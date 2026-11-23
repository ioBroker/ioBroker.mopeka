"use strict";
// ---------------------------------------------------------------------------
// ble-gateway client helper — COPY THIS FILE INTO YOUR OWN ADAPTER.
//
// It lets any ioBroker adapter receive BLE advertisement packets from the
// central `ble-gateway` adapter without owning the HCI controller itself.
//
// Usage in your adapter:
//
//   import { BleGatewayClient } from './lib/ble-gateway-client';
//
//   class MyAdapter extends Adapter {
//       private ble = new BleGatewayClient(this);
//
//       constructor(options) {
//           super({
//               ...options,
//               message:     obj          => this.onMessage(obj),
//               stateChange: (id, state)  => this.ble.handleStateChange(id, state),
//               unload:      cb           => this.onUnload(cb),
//               ready:       ()           => this.onReady(),
//           });
//       }
//
//       async onReady() {
//           await this.ble.subscribe('sensors', { macs: ['aa:bb:cc:dd:ee:ff'] }, packet => {
//               this.log.info(`${packet.address} rssi=${packet.rssi} data=${packet.manufacturerData?.toString('hex')}`);
//           });
//       }
//
//       // stateChange must reach ble.handleStateChange(): it watches the gateway's
//       // `alive` state and re-subscribes when the gateway restarts.
//
//       onMessage(obj) {
//           if (this.ble.handleMessage(obj)) return; // consumed a 'blePacket'
//           // ... your own commands
//       }
//
//       onUnload(cb) {
//           this.ble.destroy().finally(cb);
//       }
//   }
// ---------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
exports.BleGatewayClient = void 0;
// The gateway may wait up to 15 s for the controller to power on before it answers a subscribe.
const SUBSCRIBE_TIMEOUT_MS = 20000;
const UNSUBSCRIBE_TIMEOUT_MS = 2000;
// Delay after the gateway's `alive` turned true, so it can finish its start-up first.
const RESUBSCRIBE_DELAY_MS = 2000;
// Delay before a subscribe that got no answer is sent again.
const RETRY_DELAY_MS = 10000;
class BleGatewayClient {
    adapter;
    gateway;
    aliveId;
    onConnectionChange;
    entries = new Map();
    // subscription ids waiting to be (re)sent to the gateway
    pending = new Set();
    flushTimer = null;
    watching = null;
    aliveKnown = false;
    gatewayAlive = false;
    connected = false;
    destroyed = false;
    /**
     * @param adapter your adapter instance (`this`)
     * @param gatewayInstance gateway instance id, default "ble-gateway.0"
     * @param onConnectionChange optional, called with true once the gateway acknowledged a subscription
     *     and with false when the gateway stops or a subscription fails
     */
    constructor(adapter, gatewayInstance = 'ble-gateway.0', onConnectionChange) {
        this.adapter = adapter;
        this.gateway = gatewayInstance;
        this.aliveId = `system.adapter.${this.gateway}.alive`;
        this.onConnectionChange = onConnectionChange;
    }
    /** True while the gateway instance is running (its `alive` state is true). */
    isGatewayAlive() {
        return this.gatewayAlive;
    }
    /**
     * Register (or replace) a subscription and start receiving packets.
     * If the gateway is not running, the subscription is sent as soon as it starts.
     * Re-subscribes automatically if the gateway restarts.
     */
    async subscribe(subscriptionId, filter, onPacket, minIntervalMs) {
        this.entries.set(subscriptionId, { filter, minIntervalMs, handler: onPacket });
        await this.ensureWatching();
        if (!this.gatewayAlive) {
            this.adapter.log.warn(`${this.gateway} is not running — subscription '${subscriptionId}' is sent when it starts`);
            return;
        }
        await this.sendSubscribe(subscriptionId);
    }
    /** Remove one subscription (or all when no id is given). */
    async unsubscribe(subscriptionId) {
        if (subscriptionId) {
            this.entries.delete(subscriptionId);
            this.pending.delete(subscriptionId);
        }
        else {
            this.entries.clear();
            this.pending.clear();
        }
        if (this.gatewayAlive) {
            await this.send('unsubscribe', subscriptionId ? { subscriptionId } : {}, UNSUBSCRIBE_TIMEOUT_MS);
        }
    }
    /** Call from your adapter's `message` handler. Returns true if it was a packet for us. */
    handleMessage(obj) {
        if (!obj || obj.command !== 'blePacket') {
            return false;
        }
        const raw = obj.message;
        const entry = this.entries.get(raw.subscriptionId);
        if (!entry) {
            return true; // ours by command, but no live handler — swallow it
        }
        entry.handler(this.decode(raw));
        return true;
    }
    /**
     * Call from your adapter's `stateChange` handler. Watches the gateway's `alive` state:
     * the gateway forgets all subscriptions when it restarts, so they are sent again
     * as soon as it is back.
     */
    handleStateChange(id, state) {
        if (id !== this.aliveId || !this.aliveKnown || this.destroyed) {
            return;
        }
        // `alive` is refreshed periodically (true → true) and deleted (null) when it expires after a crash.
        const alive = !!state?.val;
        if (alive === this.gatewayAlive) {
            return;
        }
        this.gatewayAlive = alive;
        if (alive) {
            if (this.entries.size) {
                this.adapter.log.info(`${this.gateway} started — re-subscribing`);
                this.clearFlushTimer();
                this.queueSubscribe(this.entries.keys(), RESUBSCRIBE_DELAY_MS);
            }
        }
        else {
            this.adapter.log.warn(`${this.gateway} stopped — waiting for it to come back`);
            this.clearFlushTimer();
            this.pending.clear();
            this.setConnected(false);
        }
    }
    /** Unsubscribe everything and stop watching the gateway. Call from onUnload. */
    async destroy() {
        this.destroyed = true;
        this.clearFlushTimer();
        this.pending.clear();
        this.entries.clear();
        if (this.gatewayAlive) {
            await this.send('unsubscribe', {}, UNSUBSCRIBE_TIMEOUT_MS);
        }
        if (this.watching) {
            this.watching = null;
            try {
                await this.adapter.unsubscribeForeignStatesAsync(this.aliveId);
            }
            catch {
                // ignore
            }
        }
    }
    // --- internals ---------------------------------------------------------
    ensureWatching() {
        this.watching ||= (async () => {
            try {
                await this.adapter.subscribeForeignStatesAsync(this.aliveId);
                const st = await this.adapter.getForeignStateAsync(this.aliveId);
                this.gatewayAlive = !!st?.val;
            }
            catch (e) {
                // Unknown state: try to subscribe anyway, a missing gateway shows up as a timeout.
                this.adapter.log.debug(`${this.gateway} watch failed: ${e.message}`);
                this.gatewayAlive = true;
            }
            this.aliveKnown = true;
        })();
        return this.watching;
    }
    setConnected(connected) {
        if (connected !== this.connected) {
            this.connected = connected;
            this.onConnectionChange?.(connected);
        }
    }
    clearFlushTimer() {
        if (this.flushTimer) {
            clearTimeout(this.flushTimer);
            this.flushTimer = null;
        }
    }
    /** Send the given subscriptions after `delayMs` (joins an already scheduled send). */
    queueSubscribe(ids, delayMs) {
        for (const id of ids) {
            this.pending.add(id);
        }
        if (this.flushTimer || this.destroyed) {
            return;
        }
        this.flushTimer = setTimeout(() => {
            this.flushTimer = null;
            if (!this.gatewayAlive || this.destroyed) {
                return;
            }
            const ids = [...this.pending];
            this.pending.clear();
            for (const id of ids) {
                void this.sendSubscribe(id);
            }
        }, delayMs);
    }
    async sendSubscribe(subscriptionId) {
        const entry = this.entries.get(subscriptionId);
        if (!entry) {
            return;
        }
        const res = await this.send('subscribe', { subscriptionId, filter: entry.filter, minIntervalMs: entry.minIntervalMs }, SUBSCRIBE_TIMEOUT_MS);
        if (this.destroyed || this.entries.get(subscriptionId) !== entry) {
            return; // unsubscribed or replaced meanwhile
        }
        if (res.ok) {
            const r = res.result;
            if (!r?.error) {
                this.setConnected(true);
                return;
            }
            this.adapter.log.warn(`${this.gateway} subscribe '${subscriptionId}' failed: ${r.error}`);
            this.setConnected(false);
            return;
        }
        this.setConnected(false);
        if (!this.gatewayAlive) {
            return; // the gateway stopped meanwhile — sent again when it is back
        }
        if (res.timeout) {
            // The gateway may still be starting up — try again.
            this.adapter.log.warn(`${this.gateway} did not answer subscribe '${subscriptionId}' — retrying`);
            this.queueSubscribe([subscriptionId], RETRY_DELAY_MS);
        }
        else {
            this.adapter.log.warn(`${this.gateway} subscribe '${subscriptionId}' failed: ${res.error}`);
        }
    }
    /** sendTo with a timeout, so a stopped gateway never leaves us waiting. */
    send(command, message, timeoutMs) {
        return new Promise(resolve => {
            // Own timer as well: older js-controllers ignore the timeout option. Only the first resolve() counts.
            const timer = setTimeout(() => resolve({ ok: false, error: 'timeout', timeout: true }), timeoutMs);
            const finish = (r) => {
                clearTimeout(timer);
                resolve(r);
            };
            try {
                this.adapter.sendTo(this.gateway, command, message, (result) => {
                    if (result instanceof Error) {
                        const timeout = /timeout/i.test(result.message);
                        finish({ ok: false, error: result.message, timeout });
                    }
                    else {
                        finish({ ok: true, result });
                    }
                }, { timeout: timeoutMs });
            }
            catch (e) {
                finish({ ok: false, error: e.message, timeout: false });
            }
        });
    }
    decode(raw) {
        const out = {
            subscriptionId: raw.subscriptionId,
            address: raw.address,
            addressType: raw.addressType,
            rssi: raw.rssi,
            ts: raw.ts,
            localName: raw.localName,
            txPowerLevel: raw.txPowerLevel,
            serviceUuids: raw.serviceUuids,
        };
        if (raw.manufacturerData) {
            out.manufacturerData = Buffer.from(raw.manufacturerData, 'hex');
        }
        if (raw.serviceData) {
            out.serviceData = raw.serviceData.map(sd => ({ uuid: sd.uuid, data: Buffer.from(sd.data, 'hex') }));
        }
        return out;
    }
}
exports.BleGatewayClient = BleGatewayClient;
//# sourceMappingURL=ble-gateway-client.js.map