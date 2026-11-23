export interface BleGatewayFilter {
    macs?: string[];
    serviceUuids?: string[];
    namePrefixes?: string[];
    manufacturerId?: number;
}
/** Advertisement packet handed to your callback. Binary fields are Buffers. */
export interface BleGatewayPacket {
    subscriptionId: string;
    address: string;
    addressType: string;
    rssi: number;
    ts: number;
    localName?: string;
    txPowerLevel?: number;
    serviceUuids?: string[];
    manufacturerData?: Buffer;
    serviceData?: {
        uuid: string;
        data: Buffer;
    }[];
}
type PacketHandler = (packet: BleGatewayPacket) => void;
interface AdapterLike {
    log: {
        info(m: string): void;
        warn(m: string): void;
        error(m: string): void;
        debug(m: string): void;
    };
    sendTo(instance: string, command: string, message: unknown, callback?: (result: unknown) => void, options?: {
        timeout?: number;
    }): void;
    subscribeForeignStatesAsync(pattern: string): Promise<void>;
    unsubscribeForeignStatesAsync(pattern: string): Promise<void>;
    getForeignStateAsync(id: string): Promise<{
        val: unknown;
    } | null | undefined>;
}
export declare class BleGatewayClient {
    private readonly adapter;
    private readonly gateway;
    private readonly aliveId;
    private readonly onConnectionChange?;
    private readonly entries;
    private readonly pending;
    private flushTimer;
    private watching;
    private aliveKnown;
    private gatewayAlive;
    private connected;
    private destroyed;
    /**
     * @param adapter your adapter instance (`this`)
     * @param gatewayInstance gateway instance id, default "ble-gateway.0"
     * @param onConnectionChange optional, called with true once the gateway acknowledged a subscription
     *     and with false when the gateway stops or a subscription fails
     */
    constructor(adapter: AdapterLike, gatewayInstance?: string, onConnectionChange?: (connected: boolean) => void);
    /** True while the gateway instance is running (its `alive` state is true). */
    isGatewayAlive(): boolean;
    /**
     * Register (or replace) a subscription and start receiving packets.
     * If the gateway is not running, the subscription is sent as soon as it starts.
     * Re-subscribes automatically if the gateway restarts.
     */
    subscribe(subscriptionId: string, filter: BleGatewayFilter, onPacket: PacketHandler, minIntervalMs?: number): Promise<void>;
    /** Remove one subscription (or all when no id is given). */
    unsubscribe(subscriptionId?: string): Promise<void>;
    /** Call from your adapter's `message` handler. Returns true if it was a packet for us. */
    handleMessage(obj: ioBroker.Message | undefined): boolean;
    /**
     * Call from your adapter's `stateChange` handler. Watches the gateway's `alive` state:
     * the gateway forgets all subscriptions when it restarts, so they are sent again
     * as soon as it is back.
     */
    handleStateChange(id: string, state: ioBroker.State | null | undefined): void;
    /** Unsubscribe everything and stop watching the gateway. Call from onUnload. */
    destroy(): Promise<void>;
    private ensureWatching;
    private setConnected;
    private clearFlushTimer;
    /** Send the given subscriptions after `delayMs` (joins an already scheduled send). */
    private queueSubscribe;
    private sendSubscribe;
    /** sendTo with a timeout, so a stopped gateway never leaves us waiting. */
    private send;
    private decode;
}
export {};
