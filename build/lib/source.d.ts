import type { BleGatewayClient } from './ble-gateway-client';
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
export declare class DirectSource implements BleSource {
    private readonly log;
    private readonly hciId;
    private noble;
    private scanner;
    private onAdv;
    private collector;
    constructor(log: MinimalLogger, hciId: number);
    describe(): string;
    private ensureNoble;
    private dispatch;
    private ensureScanning;
    start(cb: (adv: MopekaAdvertisement) => void): Promise<void>;
    scan(durationMs: number): Promise<ScanDevice[]>;
    stop(): Promise<void>;
}
export declare class GatewaySource implements BleSource {
    private readonly log;
    private readonly client;
    private running;
    constructor(log: MinimalLogger, client: BleGatewayClient, gatewayInstance: string);
    private readonly gatewayInstance;
    describe(): string;
    start(cb: (adv: MopekaAdvertisement) => void): Promise<void>;
    scan(durationMs: number): Promise<ScanDevice[]>;
    stop(): Promise<void>;
}
export {};
