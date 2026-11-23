// BLE source abstraction: the Mopeka adapter can receive advertisements either
// from its own HCI controller ("direct") or from the central ble-gateway adapter
// ("gateway"). Both implementations expose the same small interface so the rest
// of the adapter (decoding, state writing) is identical regardless of source.

import { BleScanner, type Advertisement } from './scanner';
import type { BleGatewayClient } from './ble-gateway-client';
import { decodeMopeka, MOPEKA_MANUFACTURER_ID } from './mopeka';

interface MinimalLogger {
    info(msg: string): void;
    warn(msg: string): void;
    error(msg: string): void;
    debug(msg: string): void;
}

/** Normalised advertisement handed to the adapter. `manufacturerData` is a Buffer (incl. company id). */
export interface MopekaAdvertisement {
    address: string;
    rssi: number;
    localName?: string;
    manufacturerData?: Buffer;
}

/** A device found during a discovery scan. */
export interface ScanDevice {
    address: string;
    rssi: number;
    model?: string;
}

export interface BleSource {
    /** Start continuous reception. Each Mopeka-looking advertisement is passed to `cb`. */
    start(cb: (adv: MopekaAdvertisement) => void): Promise<void>;
    /** One-shot discovery scan returning unique Mopeka devices seen within the window. */
    scan(durationMs: number): Promise<ScanDevice[]>;
    /** Stop reception / release resources. */
    stop(): Promise<void>;
    describe(): string;
}

const sleep = (ms: number): Promise<void> => new Promise(r => setTimeout(r, ms));

function advToScan(adv: MopekaAdvertisement, into: Map<string, ScanDevice>): void {
    const reading = decodeMopeka(adv.manufacturerData);
    if (!reading) {
        return; // not a Mopeka frame
    }
    const prev = into.get(adv.address);
    if (!prev || adv.rssi > prev.rssi) {
        into.set(adv.address, { address: adv.address, rssi: adv.rssi, model: reading.model });
    }
}

// --- Direct: own HCI controller via noble ---------------------------------

export class DirectSource implements BleSource {
    private readonly log: MinimalLogger;
    private readonly hciId: number;
    private noble: any = null;
    private scanner: BleScanner | null = null;
    private onAdv: ((adv: MopekaAdvertisement) => void) | null = null;
    private collector: Map<string, ScanDevice> | null = null;

    public constructor(log: MinimalLogger, hciId: number) {
        this.log = log;
        this.hciId = hciId;
    }

    public describe(): string {
        return `direct (hci${this.hciId})`;
    }

    private ensureNoble(): void {
        if (this.noble) {
            return;
        }
        process.env.NOBLE_HCI_DEVICE_ID = String(this.hciId);
        const nobleModule = require('@stoprocent/noble');
        try {
            this.noble = nobleModule.withBindings('hci', { deviceId: this.hciId });
        } catch {
            this.noble = nobleModule.withBindings ? nobleModule.withBindings('hci') : nobleModule;
        }
        this.scanner = new BleScanner(this.noble, this.log);
    }

    private dispatch = (adv: Advertisement): void => {
        const mapped: MopekaAdvertisement = {
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

    private async ensureScanning(): Promise<void> {
        this.ensureNoble();
        if (!this.scanner!.isScanning()) {
            await this.scanner!.start(this.dispatch);
        }
    }

    public async start(cb: (adv: MopekaAdvertisement) => void): Promise<void> {
        this.onAdv = cb;
        await this.ensureScanning();
        this.log.info(`Mopeka source ready: ${this.describe()}`);
    }

    public async scan(durationMs: number): Promise<ScanDevice[]> {
        const startedForScan = !this.scanner?.isScanning();
        await this.ensureScanning();
        this.collector = new Map();
        try {
            await sleep(durationMs);
            return [...this.collector.values()].sort((a, b) => b.rssi - a.rssi);
        } finally {
            this.collector = null;
            // If we only opened the controller for this scan (no continuous reading), close it again.
            if (startedForScan && !this.onAdv) {
                await this.scanner?.stop().catch(() => undefined);
            }
        }
    }

    public async stop(): Promise<void> {
        this.onAdv = null;
        this.collector = null;
        if (this.scanner) {
            await this.scanner.stop().catch(() => undefined);
        }
    }
}

// --- Gateway: via the ble-gateway adapter ---------------------------------

export class GatewaySource implements BleSource {
    private readonly log: MinimalLogger;
    private readonly client: BleGatewayClient;
    private running = false;

    public constructor(log: MinimalLogger, client: BleGatewayClient, gatewayInstance: string) {
        this.log = log;
        this.client = client;
        this.gatewayInstance = gatewayInstance;
    }

    private readonly gatewayInstance: string;

    public describe(): string {
        return `gateway (${this.gatewayInstance})`;
    }

    public async start(cb: (adv: MopekaAdvertisement) => void): Promise<void> {
        this.running = true;
        await this.client.subscribe('mopeka', { manufacturerId: MOPEKA_MANUFACTURER_ID }, packet => {
            cb({
                address: packet.address,
                rssi: packet.rssi,
                localName: packet.localName,
                manufacturerData: packet.manufacturerData,
            });
        });
        this.log.info(`Mopeka source ready: ${this.describe()}`);
    }

    public async scan(durationMs: number): Promise<ScanDevice[]> {
        const found = new Map<string, ScanDevice>();
        await this.client.subscribe('mopeka-scan', { manufacturerId: MOPEKA_MANUFACTURER_ID }, packet => {
            advToScan(
                {
                    address: packet.address,
                    rssi: packet.rssi,
                    localName: packet.localName,
                    manufacturerData: packet.manufacturerData,
                },
                found,
            );
        });
        if (!this.client.isGatewayAlive()) {
            await this.client.unsubscribe('mopeka-scan').catch(() => undefined);
            throw new Error(`${this.gatewayInstance} is not running`);
        }
        try {
            await sleep(durationMs);
            return [...found.values()].sort((a, b) => b.rssi - a.rssi);
        } finally {
            await this.client.unsubscribe('mopeka-scan').catch(() => undefined);
        }
    }

    public async stop(): Promise<void> {
        if (this.running) {
            this.running = false;
            await this.client.destroy().catch(() => undefined);
        }
    }
}
