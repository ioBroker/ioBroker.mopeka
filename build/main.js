"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const adapter_core_1 = require("@iobroker/adapter-core");
const node_fs_1 = require("node:fs");
const hci_info_1 = require("./lib/hci-info");
const mopeka_1 = require("./lib/mopeka");
const source_1 = require("./lib/source");
const ble_gateway_client_1 = require("./lib/ble-gateway-client");
const MAC_RE = /^[0-9a-f]{2}(?::[0-9a-f]{2}){5}$/i;
const STALE_MS = 300000; // mark a sensor unreachable after 5 min without a packet
function readSysFile(path) {
    try {
        return (0, node_fs_1.readFileSync)(path, 'utf8').trim();
    }
    catch {
        return '';
    }
}
async function readHciAdapters() {
    try {
        const infos = await (0, hci_info_1.readHciInfos)();
        if (infos.length) {
            return infos.map(i => ({ id: i.devId, address: i.address.toUpperCase() })).sort((a, b) => a.id - b.id);
        }
    }
    catch {
        // fall through
    }
    const out = [];
    const sysPath = '/sys/class/bluetooth';
    try {
        if ((0, node_fs_1.existsSync)(sysPath)) {
            for (const name of (0, node_fs_1.readdirSync)(sysPath)) {
                const m = /^hci(\d+)$/.exec(name);
                if (!m) {
                    continue;
                }
                out.push({
                    id: parseInt(m[1], 10),
                    address: readSysFile(`${sysPath}/${name}/address`).toUpperCase(),
                });
            }
        }
    }
    catch {
        // ignore
    }
    out.sort((a, b) => a.id - b.id);
    return out;
}
// Resolve a configured value (MAC string or numeric index) to the current hciX id.
// Returns -1 if a MAC was given but no controller currently exposes it.
async function resolveHciId(value) {
    if (typeof value === 'string' && MAC_RE.test(value.trim())) {
        const wanted = value.trim().toUpperCase();
        const adapters = await readHciAdapters();
        const match = adapters.find(a => a.address === wanted);
        return match ? match.id : -1;
    }
    const n = parseInt(value, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
}
async function listHciAdapters() {
    const out = [];
    try {
        const infos = await (0, hci_info_1.readHciInfos)();
        for (const info of infos) {
            const parts = [];
            if (info.name) {
                parts.push(info.name);
            }
            if (info.address) {
                parts.push(info.address);
            }
            const hciName = `hci${info.devId}`;
            const label = parts.length ? `${hciName} — ${parts.join(' · ')}` : hciName;
            out.push({ value: info.address || info.devId, label });
        }
    }
    catch {
        // fall through to sysfs probe
    }
    if (out.length) {
        return out;
    }
    const sysPath = '/sys/class/bluetooth';
    try {
        if ((0, node_fs_1.existsSync)(sysPath)) {
            for (const name of (0, node_fs_1.readdirSync)(sysPath)) {
                const m = /^hci(\d+)$/.exec(name);
                if (!m) {
                    continue;
                }
                const id = parseInt(m[1], 10);
                const base = `${sysPath}/${name}`;
                const address = readSysFile(`${base}/address`).toUpperCase();
                const product = readSysFile(`${base}/device/product`);
                const manufacturer = readSysFile(`${base}/device/manufacturer`);
                const friendly = product || manufacturer;
                const parts = [];
                if (friendly) {
                    parts.push(friendly);
                }
                if (address) {
                    parts.push(address);
                }
                const label = parts.length ? `${name} — ${parts.join(' · ')}` : name;
                out.push({ value: address || id, label });
            }
        }
    }
    catch {
        // ignore
    }
    return out;
}
function sanitizeId(s) {
    return (s || '').toString().replace(/[^a-zA-Z0-9_]/g, '_');
}
function macToId(mac) {
    return mac.toLowerCase().replace(/[^a-f0-9]/g, '');
}
const SENSOR_STATES = [
    { id: 'level_mm', name: 'Liquid level', type: 'number', role: 'value.distance', unit: 'mm' },
    { id: 'level_pct', name: 'Fill level', type: 'number', role: 'value.fill', unit: '%' },
    { id: 'temperature', name: 'Temperature', type: 'number', role: 'value.temperature', unit: '°C' },
    { id: 'battery_v', name: 'Battery voltage', type: 'number', role: 'value.voltage', unit: 'V' },
    { id: 'battery_pct', name: 'Battery level', type: 'number', role: 'value.battery', unit: '%' },
    { id: 'quality', name: 'Reading quality (0-3)', type: 'number', role: 'value' },
    { id: 'quality_pct', name: 'Reading quality', type: 'number', role: 'value', unit: '%' },
    { id: 'button', name: 'Sync button pressed', type: 'boolean', role: 'indicator' },
    { id: 'rssi', name: 'Signal strength', type: 'number', role: 'value.rssi', unit: 'dBm' },
    { id: 'accel_x', name: 'Accelerometer X', type: 'number', role: 'value' },
    { id: 'accel_y', name: 'Accelerometer Y', type: 'number', role: 'value' },
    { id: 'model', name: 'Sensor model', type: 'string', role: 'text' },
    { id: 'lastUpdate', name: 'Last update', type: 'number', role: 'date' },
    { id: 'reachable', name: 'Reachable', type: 'boolean', role: 'indicator.reachable' },
];
class MopekaAdapter extends adapter_core_1.Adapter {
    source = null;
    gwClient = null;
    stopping = false;
    staleTimer = null;
    // lowercased mac → { sensor, lastSeen }
    byMac = new Map();
    constructor(options = {}) {
        super({
            ...options,
            name: 'mopeka',
            unload: cb => this.onUnload(cb),
            message: obj => this.onAdapterMessage(obj),
            stateChange: (id, state) => this.onStateChange(id, state),
            ready: () => this.onReady(),
        });
    }
    enabledSensors() {
        const sensors = Array.isArray(this.config.sensors) ? this.config.sensors : [];
        return sensors.filter(s => s && s.mac && s.enabled !== false);
    }
    async onReady() {
        await this.setStateAsync('info.connection', false, true);
        const enabled = this.enabledSensors();
        await this.syncObjects(enabled);
        this.byMac = new Map();
        for (const s of enabled) {
            this.byMac.set(s.mac.toLowerCase(), { sensor: s, lastSeen: 0 });
        }
        try {
            this.source = await this.buildSource();
        }
        catch (e) {
            this.log.error(`Cannot initialise BLE source: ${e.message}`);
            await this.setStateAsync('info.connection', false, true);
            return;
        }
        if (!enabled.length) {
            this.log.info('No sensors configured. Use the admin UI to scan and add Mopeka sensors.');
            return;
        }
        try {
            await this.source.start(adv => void this.onAdvertisement(adv));
            await this.setStateAsync('info.connection', true, true);
        }
        catch (e) {
            this.log.error(`Failed to start BLE source (${this.source.describe()}): ${e.message}`);
            await this.setStateAsync('info.connection', false, true);
            return;
        }
        this.staleTimer = setInterval(() => void this.checkStale(), 60000);
        this.log.info(`Listening for ${enabled.length} Mopeka sensor(s) via ${this.source.describe()}`);
    }
    // Build the configured source. For gateway mode this also creates the
    // BleGatewayClient that message/stateChange handlers route to.
    async buildSource() {
        const log = {
            info: (m) => this.log.info(m),
            warn: (m) => this.log.warn(m),
            error: (m) => this.log.error(m),
            debug: (m) => this.log.debug(m),
        };
        if (this.config.source === 'gateway') {
            const instance = this.config.gatewayInstance || 'ble-gateway.0';
            this.gwClient = new ble_gateway_client_1.BleGatewayClient(this, instance);
            return new source_1.GatewaySource(log, this.gwClient, instance);
        }
        // direct
        const hci = await resolveHciId(this.config.hciDevice);
        if (hci < 0) {
            const adapters = await readHciAdapters();
            throw new Error(`Configured controller ${String(this.config.hciDevice)} not present. ` +
                `Available: ${adapters.map(a => `hci${a.id}=${a.address || '?'}`).join(', ') || 'none'}`);
        }
        return new source_1.DirectSource(log, hci);
    }
    onUnload(cb) {
        this.stopping = true;
        if (this.staleTimer) {
            clearInterval(this.staleTimer);
            this.staleTimer = null;
        }
        const finish = () => {
            try {
                cb();
            }
            catch {
                // ignore
            }
        };
        if (this.source) {
            void this.source.stop().finally(finish);
        }
        else {
            finish();
        }
    }
    onStateChange(id, state) {
        // In gateway mode the client watches the gateway's connection state to re-subscribe.
        this.gwClient?.handleStateChange(id, state);
    }
    async onAdvertisement(adv) {
        if (this.stopping) {
            return;
        }
        const entry = this.byMac.get(adv.address.toLowerCase());
        if (!entry) {
            return; // not a configured sensor
        }
        const reading = (0, mopeka_1.decodeMopeka)(adv.manufacturerData);
        if (!reading) {
            return;
        }
        entry.lastSeen = Date.now();
        const sensor = entry.sensor;
        const medium = (0, mopeka_1.isMediumType)(sensor.medium) ? sensor.medium : 'propane';
        const mm = (0, mopeka_1.levelMm)(reading.rawLevel, reading.temperature, medium);
        const pct = (0, mopeka_1.fillPercent)(mm, sensor.tankFullMm);
        const prefix = `${this.getSensorId(sensor)}.`;
        await this.setStateAsync(`${prefix}level_mm`, mm, true);
        if (pct !== null) {
            await this.setStateAsync(`${prefix}level_pct`, pct, true);
        }
        await this.setStateAsync(`${prefix}temperature`, reading.temperature, true);
        await this.setStateAsync(`${prefix}battery_v`, reading.batteryV, true);
        await this.setStateAsync(`${prefix}battery_pct`, reading.batteryPct, true);
        await this.setStateAsync(`${prefix}quality`, reading.quality, true);
        await this.setStateAsync(`${prefix}quality_pct`, reading.qualityPct, true);
        await this.setStateAsync(`${prefix}button`, reading.button, true);
        await this.setStateAsync(`${prefix}rssi`, adv.rssi, true);
        await this.setStateAsync(`${prefix}accel_x`, reading.accelX, true);
        await this.setStateAsync(`${prefix}accel_y`, reading.accelY, true);
        await this.setStateAsync(`${prefix}model`, reading.model, true);
        await this.setStateAsync(`${prefix}lastUpdate`, entry.lastSeen, true);
        await this.setStateAsync(`${prefix}reachable`, true, true);
        this.log.debug(`${sensor.mac}: ${mm}mm ${reading.temperature}°C ${reading.batteryV}V q=${reading.quality}`);
    }
    async checkStale() {
        const now = Date.now();
        for (const entry of this.byMac.values()) {
            if (entry.lastSeen && now - entry.lastSeen > STALE_MS) {
                await this.setStateAsync(`${this.getSensorId(entry.sensor)}.reachable`, false, true);
            }
        }
    }
    getSensorId(sensor) {
        const named = sensor.name ? sanitizeId(sensor.name) : '';
        return `sensors.${named || `s_${macToId(sensor.mac)}`}`;
    }
    async syncObjects(sensors) {
        await this.setObjectNotExistsAsync('sensors', {
            type: 'channel',
            common: { name: 'Mopeka sensors' },
            native: {},
        });
        const wanted = new Set();
        for (const sensor of sensors) {
            const devId = this.getSensorId(sensor);
            wanted.add(devId);
            await this.setObjectAsync(devId, {
                type: 'device',
                common: { name: sensor.name || sensor.mac },
                native: { mac: sensor.mac },
            });
            for (const s of SENSOR_STATES) {
                const common = {
                    name: s.name,
                    type: s.type,
                    role: s.role,
                    read: true,
                    write: false,
                };
                if (s.type === 'number' && s.unit) {
                    common.unit = s.unit;
                }
                await this.setObjectNotExistsAsync(`${devId}.${s.id}`, {
                    type: 'state',
                    common,
                    native: { mac: sensor.mac },
                });
            }
        }
        // Remove sensor devices that are no longer configured.
        try {
            const existing = await this.getDevicesAsync();
            for (const dev of existing) {
                const idParts = dev._id.split('.');
                if (idParts.length < 4 || idParts[2] !== 'sensors') {
                    continue;
                }
                const relId = idParts.slice(2).join('.');
                if (!wanted.has(relId)) {
                    this.log.info(`Removing sensor device no longer configured: ${dev._id}`);
                    await this.delObjectAsync(dev._id, { recursive: true });
                }
            }
        }
        catch (e) {
            this.log.debug(`syncObjects cleanup: ${e.message}`);
        }
    }
    async onAdapterMessage(obj) {
        if (!obj?.command) {
            return;
        }
        // In gateway mode, forward inbound BLE packets to the client first.
        if (this.gwClient?.handleMessage(obj)) {
            return;
        }
        switch (obj.command) {
            case 'scan':
                await this.handleScan(obj);
                break;
            case 'listHciAdapters': {
                let adapters = await listHciAdapters();
                if (!adapters.length) {
                    adapters = [
                        { value: 0, label: 'hci0' },
                        { value: 1, label: 'hci1' },
                    ];
                }
                if (obj.callback) {
                    this.sendTo(obj.from, obj.command, adapters, obj.callback);
                }
                break;
            }
            case 'listGateways': {
                const gateways = await this.listGateways();
                if (obj.callback) {
                    this.sendTo(obj.from, obj.command, gateways, obj.callback);
                }
                break;
            }
        }
    }
    async listGateways() {
        const out = [];
        try {
            const view = await this.getObjectViewAsync('system', 'instance', {
                startkey: 'system.adapter.ble-gateway.',
                endkey: 'system.adapter.ble-gateway.香',
            });
            for (const row of view.rows) {
                const id = row.id.replace('system.adapter.', '');
                out.push({ value: id, label: id });
            }
        }
        catch (e) {
            this.log.debug(`listGateways: ${e.message}`);
        }
        if (!out.length) {
            out.push({ value: 'ble-gateway.0', label: 'ble-gateway.0' });
        }
        return out;
    }
    async handleScan(obj) {
        const reply = (payload) => {
            if (obj.callback) {
                this.sendTo(obj.from, obj.command, payload, obj.callback);
            }
        };
        const msg = obj.message || {};
        const ms = parseInt(msg.duration, 10) ||
            parseInt(this.config.scanDurationMs, 10) ||
            10000;
        if (!this.source) {
            try {
                this.source = await this.buildSource();
            }
            catch (e) {
                reply({ error: e.message });
                return;
            }
        }
        try {
            this.log.info(`Scanning for Mopeka sensors via ${this.source.describe()} for ${ms} ms...`);
            const found = await this.source.scan(ms);
            this.log.info(`Scan finished: ${found.length} Mopeka sensor(s) found`);
            const sensors = Array.isArray(this.config.sensors) ? [...this.config.sensors] : [];
            for (const dev of found) {
                if (!sensors.find(s => s.mac.toLowerCase() === dev.address.toLowerCase())) {
                    sensors.push({
                        name: dev.model ? `${dev.model} ${dev.address.slice(-5)}` : dev.address,
                        mac: dev.address,
                        enabled: true,
                        medium: 'propane',
                    });
                }
            }
            reply({ native: { sensors } });
        }
        catch (e) {
            reply({ error: e.message });
        }
    }
}
if (require.main !== module) {
    module.exports = (options) => new MopekaAdapter(options);
}
else {
    (() => new MopekaAdapter())();
}
//# sourceMappingURL=main.js.map