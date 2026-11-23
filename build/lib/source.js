"use strict";
// BLE source abstraction: the Mopeka adapter can receive advertisements either
// from its own HCI controller ("direct") or from the central ble-gateway adapter
// ("gateway"). Both implementations expose the same small interface so the rest
// of the adapter (decoding, state writing) is identical regardless of source.
Object.defineProperty(exports, "__esModule", { value: true });
exports.GatewaySource = exports.DirectSource = void 0;
const scanner_1 = require("./scanner");
const mopeka_1 = require("./mopeka");
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
function advToScan(adv, into) {
    const reading = (0, mopeka_1.decodeMopeka)(adv.manufacturerData);
    if (!reading) {
        return; // not a Mopeka frame
    }
    const prev = into.get(adv.address);
    if (!prev || adv.rssi > prev.rssi) {
        into.set(adv.address, { address: adv.address, rssi: adv.rssi, model: reading.model });
    }
}
// --- Direct: own HCI controller via noble ---------------------------------
class DirectSource {
    log;
    hciId;
    noble = null;
    scanner = null;
    onAdv = null;
    collector = null;
    constructor(log, hciId) {
        this.log = log;
        this.hciId = hciId;
    }
    describe() {
        return `direct (hci${this.hciId})`;
    }
    ensureNoble() {
        if (this.noble) {
            return;
        }
        process.env.NOBLE_HCI_DEVICE_ID = String(this.hciId);
        const nobleModule = require('@stoprocent/noble');
        try {
            this.noble = nobleModule.withBindings('hci', { deviceId: this.hciId });
        }
        catch {
            this.noble = nobleModule.withBindings ? nobleModule.withBindings('hci') : nobleModule;
        }
        this.scanner = new scanner_1.BleScanner(this.noble, this.log);
    }
    dispatch = (adv) => {
        const mapped = {
            address: adv.address,
            rssi: adv.rssi,
            localName: adv.localName,
            manufacturerData: adv.manufacturerData,
        };
        if (this.collector) {
            advToScan(mapped, this.collector);
        }
        this.onAdv?.(mapped);
    };
    async ensureScanning() {
        this.ensureNoble();
        if (!this.scanner.isScanning()) {
            await this.scanner.start(this.dispatch);
        }
    }
    async start(cb) {
        this.onAdv = cb;
        await this.ensureScanning();
        this.log.info(`Mopeka source ready: ${this.describe()}`);
    }
    async scan(durationMs) {
        const startedForScan = !this.scanner?.isScanning();
        await this.ensureScanning();
        this.collector = new Map();
        try {
            await sleep(durationMs);
            return [...this.collector.values()].sort((a, b) => b.rssi - a.rssi);
        }
        finally {
            this.collector = null;
            // If we only opened the controller for this scan (no continuous reading), close it again.
            if (startedForScan && !this.onAdv) {
                await this.scanner?.stop().catch(() => undefined);
            }
        }
    }
    async stop() {
        this.onAdv = null;
        this.collector = null;
        if (this.scanner) {
            await this.scanner.stop().catch(() => undefined);
        }
    }
}
exports.DirectSource = DirectSource;
// --- Gateway: via the ble-gateway adapter ---------------------------------
class GatewaySource {
    log;
    client;
    running = false;
    constructor(log, client, gatewayInstance) {
        this.log = log;
        this.client = client;
        this.gatewayInstance = gatewayInstance;
    }
    gatewayInstance;
    describe() {
        return `gateway (${this.gatewayInstance})`;
    }
    async start(cb) {
        this.running = true;
        await this.client.subscribe('mopeka', { manufacturerId: mopeka_1.MOPEKA_MANUFACTURER_ID }, packet => {
            cb({
                address: packet.address,
                rssi: packet.rssi,
                localName: packet.localName,
                manufacturerData: packet.manufacturerData,
            });
        });
        this.log.info(`Mopeka source ready: ${this.describe()}`);
    }
    async scan(durationMs) {
        const found = new Map();
        await this.client.subscribe('mopeka-scan', { manufacturerId: mopeka_1.MOPEKA_MANUFACTURER_ID }, packet => {
            advToScan({
                address: packet.address,
                rssi: packet.rssi,
                localName: packet.localName,
                manufacturerData: packet.manufacturerData,
            }, found);
        });
        if (!this.client.isGatewayAlive()) {
            await this.client.unsubscribe('mopeka-scan').catch(() => undefined);
            throw new Error(`${this.gatewayInstance} is not running`);
        }
        try {
            await sleep(durationMs);
            return [...found.values()].sort((a, b) => b.rssi - a.rssi);
        }
        finally {
            await this.client.unsubscribe('mopeka-scan').catch(() => undefined);
        }
    }
    async stop() {
        if (this.running) {
            this.running = false;
            await this.client.destroy().catch(() => undefined);
        }
    }
}
exports.GatewaySource = GatewaySource;
//# sourceMappingURL=source.js.map