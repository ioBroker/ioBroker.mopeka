"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MopekaDeviceManagement = void 0;
const dm_utils_1 = require("@iobroker/dm-utils");
const i18n_1 = require("./i18n");
const mopeka_1 = require("./mopeka");
/** The gas bottle of `src-webcomponents/`, shown on every card */
const TANK_WEB_COMPONENT = 'webcomponents/mopeka-tank.json';
/** Like the default of the web component: yellow below 20 %, red below 10 % */
const LOW_PCT = 20;
const MEDIA = ['propane', 'air', 'water'];
function svgIcon(path) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="${path}"/></svg>`;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}
const ICON_BOTTLE = svgIcon('M9 1h6v2h-1.5v1.6c3 .5 5.5 3 5.5 6.4v9a2 2 0 0 1-2 2v1H7v-1a2 2 0 0 1-2-2v-9c0-3.4 2.5-5.9 5.5-6.4V3H9z');
const ICON_TEMPERATURE = svgIcon('M15 13V5c0-1.66-1.34-3-3-3S9 3.34 9 5v8c-1.21.91-2 2.37-2 4 0 2.76 2.24 5 5 5s5-2.24 5-5c0-1.63-.79-3.09-2-4m-4-8c0-.55.45-1 1-1s1 .45 1 1h-1v1h1v2h-1v1h1v2h-2z');
const ICON_QUALITY = svgIcon('M2 22h4v-6H2zm7 0h4V10H9zm7 0h4V2h-4z');
function mediumOf(sensor) {
    return (0, mopeka_1.isMediumType)(sensor.medium) ? sensor.medium : 'propane';
}
function tankHeightOf(sensor) {
    const mm = Number(sensor.tankFullMm);
    return Number.isFinite(mm) && mm > 0 ? mm : 0;
}
class MopekaDeviceManagement extends dm_utils_1.DeviceManagement {
    full(relId) {
        return `${this.adapter.namespace}.${relId}`;
    }
    getSensors() {
        const list = this.adapter.config.sensors;
        return Array.isArray(list) ? list.filter(s => s?.mac) : [];
    }
    findSensor(mac) {
        return this.getSensors().find(s => s.mac === mac);
    }
    getInstanceInfo() {
        return {
            apiVersion: 'v3',
            identifierLabel: 'MAC',
            actions: [
                {
                    id: 'scan',
                    icon: 'search',
                    title: (0, i18n_1.t)('Scan for sensors'),
                    description: (0, i18n_1.t)('Scan for sensors'),
                    handler: (context) => this.onScan(context),
                },
            ],
        };
    }
    loadDevices(context) {
        const sensors = [...this.getSensors()].sort((a, b) => (a.name || a.mac).localeCompare(b.name || b.mac, undefined, { numeric: true, sensitivity: 'base' }));
        context.setTotalDevices(sensors.length);
        for (const sensor of sensors) {
            context.addDevice(this.getSensorInfo(sensor));
        }
    }
    getDeviceDetails(id) {
        const sensor = this.findSensor(id);
        if (!sensor) {
            return Promise.resolve({ error: `Unknown sensor ${id}` });
        }
        return this.getSensorDetails(sensor);
    }
    // ---------------------------------------------------------------------------------------------
    // Cards
    getIndicators(sensor, devId) {
        const withPct = tankHeightOf(sensor) > 0;
        return [
            {
                id: 'level',
                value: { stateId: this.full(`${devId}.${withPct ? 'level_pct' : 'level_mm'}`) },
                icon: ICON_BOTTLE,
                showValue: true,
                unit: withPct ? '%' : 'mm',
                tooltip: withPct ? (0, i18n_1.t)('Fill level') : (0, i18n_1.t)('Liquid level'),
                configurable: true,
                order: 10,
                levels: withPct
                    ? [{ max: LOW_PCT / 2, color: 'error' }, { max: LOW_PCT, color: 'warning' }, { color: 'ok' }]
                    : undefined,
            },
            {
                id: 'temperature',
                value: { stateId: this.full(`${devId}.temperature`) },
                icon: ICON_TEMPERATURE,
                showValue: true,
                unit: '°C',
                tooltip: (0, i18n_1.t)('Temperature'),
                configurable: true,
                order: 20,
            },
            {
                id: 'quality',
                value: { stateId: this.full(`${devId}.quality`) },
                icon: ICON_QUALITY,
                tooltip: (0, i18n_1.t)('Reading quality'),
                label: (0, i18n_1.t)('Reading quality'),
                configurable: true,
                order: 30,
                levels: [
                    { value: 0, color: 'error', tooltip: (0, i18n_1.t)('No valid reading') },
                    { value: 1, color: 'warning', tooltip: (0, i18n_1.t)('Poor contact') },
                    { value: 2, color: 'ok', tooltip: (0, i18n_1.t)('Normal reading') },
                    { value: 3, color: 'ok', tooltip: (0, i18n_1.t)('Optimal reading') },
                ],
            },
        ];
    }
    /** The gas bottle on the card; name and values are shown by the card itself */
    getCustomInfo(sensor, devId) {
        // `webComponent` is newer than the types of dm-utils: JSON-Config of admin 8.3.10+ shows it
        const tank = {
            type: 'custom',
            webComponent: TANK_WEB_COMPONENT,
            settings: { sensor: this.full(devId), showName: false, showDetails: false, lowPct: LOW_PCT },
            height: 150,
            xs: 12,
        };
        return { id: sensor.mac, schema: { type: 'panel', items: { _tank: tank } } };
    }
    getSensorInfo(sensor) {
        const enabled = sensor.enabled !== false;
        const devId = this.adapter.getDeviceId(sensor);
        const medium = mediumOf(sensor);
        const actions = [
            {
                id: dm_utils_1.ACTIONS.ENABLE_DISABLE,
                description: (0, i18n_1.t)('Enabled'),
                handler: async (mac, context) => {
                    await this.adapter.updateSensors(list => list.map(s => (s.mac === mac ? { ...s, enabled: s.enabled === false } : s)));
                    await context.showMessage((0, i18n_1.t)('Settings changed'));
                    return { refresh: 'devices' };
                },
            },
            {
                id: 'edit',
                icon: 'edit',
                description: (0, i18n_1.t)('Edit'),
                handler: (mac, context) => this.onEdit(mac, context),
            },
            {
                id: 'delete',
                icon: 'delete',
                description: (0, i18n_1.t)('Delete'),
                confirmation: (0, i18n_1.t)('Delete sensor?'),
                handler: async (mac) => {
                    await this.adapter.updateSensors(list => list.filter(s => s.mac !== mac));
                    return { delete: mac };
                },
            },
        ];
        const info = {
            id: sensor.mac,
            identifier: sensor.mac,
            name: sensor.name || sensor.mac,
            icon: ICON_BOTTLE,
            manufacturer: 'Mopeka',
            enabled,
            group: { key: medium, name: (0, i18n_1.t)(medium), icon: ICON_BOTTLE },
            actions,
        };
        if (!enabled) {
            // A disabled sensor has no objects, so there is nothing live to bind to
            info.status = 'disconnected';
            return info;
        }
        info.model = { stateId: this.full(`${devId}.model`) };
        info.status = {
            connection: {
                stateId: this.full(`${devId}.reachable`),
                mapping: { true: 'connected', false: 'disconnected' },
            },
            battery: { stateId: this.full(`${devId}.battery_pct`) },
            rssi: { stateId: this.full(`${devId}.rssi`) },
        };
        info.indicators = this.getIndicators(sensor, devId);
        info.customInfo = this.getCustomInfo(sensor, devId);
        info.hasDetails = true;
        return info;
    }
    // ---------------------------------------------------------------------------------------------
    // Details
    stateItem(relId, label, unit) {
        return { type: 'state', oid: this.full(relId), foreign: true, label, unit, xs: 12, sm: 6 };
    }
    staticItem(label, data, unit) {
        return { type: 'staticInfo', label, data, unit, xs: 12, sm: 6 };
    }
    header(text) {
        return { type: 'header', text, size: 4, newLine: true, xs: 12 };
    }
    async getSensorDetails(sensor) {
        const devId = this.adapter.getDeviceId(sensor);
        const height = tankHeightOf(sensor);
        const items = {
            _level: this.header((0, i18n_1.t)('Fill level')),
        };
        if (height) {
            items.level_pct = this.stateItem(`${devId}.level_pct`, (0, i18n_1.t)('Fill level'), '%');
        }
        items.level_mm = this.stateItem(`${devId}.level_mm`, (0, i18n_1.t)('Liquid level'), 'mm');
        items.height = this.staticItem((0, i18n_1.t)('Tank height (mm)'), height || '—', height ? 'mm' : undefined);
        items.medium = this.staticItem((0, i18n_1.t)('Medium'), (0, i18n_1.t)(mediumOf(sensor)));
        items._measurement = this.header((0, i18n_1.t)('Measurement'));
        items.temperature = this.stateItem(`${devId}.temperature`, (0, i18n_1.t)('Temperature'), '°C');
        items.quality_pct = this.stateItem(`${devId}.quality_pct`, (0, i18n_1.t)('Reading quality'), '%');
        items.battery_pct = this.stateItem(`${devId}.battery_pct`, (0, i18n_1.t)('Battery level'), '%');
        items.battery_v = this.stateItem(`${devId}.battery_v`, (0, i18n_1.t)('Battery voltage'), 'V');
        items.rssi = this.stateItem(`${devId}.rssi`, (0, i18n_1.t)('Signal strength'), 'dBm');
        items._sensor = this.header((0, i18n_1.t)('Sensor'));
        items.mac = this.staticItem('MAC', sensor.mac);
        items.model = this.stateItem(`${devId}.model`, (0, i18n_1.t)('Model'));
        const lastUpdate = await this.adapter.getStateAsync(`${devId}.lastUpdate`);
        const ts = typeof lastUpdate?.val === 'number' && lastUpdate.val > 0 ? lastUpdate.val : 0;
        items.lastUpdate = this.staticItem((0, i18n_1.t)('Last update'), ts ? new Date(ts).toLocaleString() : '—');
        return { id: sensor.mac, schema: { type: 'panel', items } };
    }
    // ---------------------------------------------------------------------------------------------
    // Actions
    mediumOptions() {
        return MEDIA.map(m => ({ value: m, label: (0, i18n_1.t)(m) }));
    }
    async onScan(context) {
        const progress = await context.openProgress((0, i18n_1.t)('Scanning'), { indeterminate: true });
        let found;
        try {
            found = await this.adapter.scanSensors();
        }
        catch (e) {
            await progress.close();
            await context.showMessage(e.message);
            return { refresh: false };
        }
        await progress.close();
        const known = new Set(this.getSensors().map(s => s.mac.toLowerCase()));
        const fresh = found.filter(d => !known.has(d.address.toLowerCase()));
        if (!fresh.length) {
            await context.showMessage((0, i18n_1.t)('No new sensors found'));
            return { refresh: false };
        }
        const items = {
            _info: { type: 'staticText', text: (0, i18n_1.t)('Add selected sensors'), xs: 12 },
        };
        const data = {};
        fresh.forEach((d, i) => {
            items[`add_${i}`] = {
                type: 'checkbox',
                label: `${d.model || 'Mopeka'} (${d.address}, ${d.rssi} dBm)`,
                newLine: true,
                xs: 12,
                sm: 4,
            };
            items[`name_${i}`] = { type: 'text', label: (0, i18n_1.t)('Name'), hidden: `!data.add_${i}`, xs: 12, sm: 4 };
            items[`medium_${i}`] = {
                type: 'select',
                label: (0, i18n_1.t)('Medium'),
                options: this.mediumOptions(),
                hidden: `!data.add_${i}`,
                xs: 12,
                sm: 4,
            };
            data[`add_${i}`] = true;
            data[`name_${i}`] = d.model ? `${d.model} ${d.address.slice(-5)}` : d.address;
            data[`medium_${i}`] = 'propane';
        });
        const result = await context.showForm({ type: 'panel', items }, { data, title: (0, i18n_1.t)('Found sensors'), buttons: ['apply', 'cancel'] });
        if (!result) {
            return { refresh: false };
        }
        const toAdd = [];
        fresh.forEach((d, i) => {
            if (result[`add_${i}`]) {
                const medium = result[`medium_${i}`];
                toAdd.push({
                    mac: d.address,
                    name: String(result[`name_${i}`] || '').trim(),
                    enabled: true,
                    medium: (0, mopeka_1.isMediumType)(medium) ? medium : 'propane',
                });
            }
        });
        if (!toAdd.length) {
            return { refresh: false };
        }
        await this.adapter.updateSensors(list => [...list, ...toAdd]);
        await context.showMessage((0, i18n_1.t)('Settings changed'));
        return { refresh: true };
    }
    async onEdit(mac, context) {
        const sensor = this.findSensor(mac);
        if (!sensor) {
            return { refresh: 'devices' };
        }
        const result = await context.showForm({
            type: 'panel',
            items: {
                name: { type: 'text', label: (0, i18n_1.t)('Name'), xs: 12 },
                medium: {
                    type: 'select',
                    label: (0, i18n_1.t)('Medium'),
                    options: this.mediumOptions(),
                    newLine: true,
                    xs: 12,
                    sm: 6,
                },
                tankFullMm: {
                    type: 'number',
                    label: (0, i18n_1.t)('Tank height (mm)'),
                    help: (0, i18n_1.t)('Tank height help'),
                    min: 0,
                    max: 5000,
                    xs: 12,
                    sm: 6,
                },
                enabled: { type: 'checkbox', label: (0, i18n_1.t)('Enabled'), newLine: true, xs: 12 },
            },
        }, {
            data: {
                name: sensor.name || '',
                medium: mediumOf(sensor),
                tankFullMm: tankHeightOf(sensor),
                enabled: sensor.enabled !== false,
            },
            title: (0, i18n_1.t)('Sensor settings'),
            buttons: ['apply', 'cancel'],
        });
        if (!result) {
            return { refresh: 'none' };
        }
        const name = String(result.name ?? '').trim();
        const medium = (0, mopeka_1.isMediumType)(result.medium) ? result.medium : mediumOf(sensor);
        const height = Number(result.tankFullMm);
        const tankFullMm = Number.isFinite(height) && height > 0 ? Math.round(height) : 0;
        const enabled = !!result.enabled;
        if (name === (sensor.name || '') &&
            medium === mediumOf(sensor) &&
            tankFullMm === tankHeightOf(sensor) &&
            enabled === (sensor.enabled !== false)) {
            return { refresh: 'none' };
        }
        // The objects of a sensor are named after it, so two sensors must not share a name
        const newDevId = this.adapter.getDeviceId({ ...sensor, name });
        if (this.getSensors().some(s => s.mac !== mac && this.adapter.getDeviceId(s) === newDevId)) {
            await context.showMessage((0, i18n_1.t)('Name already used'));
            return { refresh: 'none' };
        }
        await this.adapter.updateSensors(list => list.map(s => (s.mac === mac ? { ...s, name, medium, tankFullMm, enabled } : s)));
        await context.showMessage((0, i18n_1.t)('Settings changed'));
        return { refresh: 'devices' };
    }
}
exports.MopekaDeviceManagement = MopekaDeviceManagement;
//# sourceMappingURL=DeviceManagement.js.map