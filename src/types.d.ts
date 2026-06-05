import type { MediumType } from './lib/mopeka';

export type BleSourceType = 'direct' | 'gateway';

export interface SensorEntry {
    mac: string;
    name: string;
    enabled?: boolean;
    /** Liquid medium for thermal compensation. Defaults to "propane". */
    medium?: MediumType;
    /** Full tank height in mm. When set, a fill percentage (level_pct) is computed. */
    tankFullMm?: number;
}

export interface MopekaAdapterConfig {
    /** Where the BLE advertisements come from: own controller ("direct") or the ble-gateway adapter. */
    source: BleSourceType;
    /**
     * HCI device selector (direct mode). Either a controller MAC (BD_ADDR) — stable across
     * reboots — or a numeric hciX index for legacy configs.
     */
    hciDevice: number | string;
    /** Instance id of the ble-gateway adapter (gateway mode), e.g. "ble-gateway.0". */
    gatewayInstance: string;
    /** Duration (ms) of the discovery scan triggered from the admin UI. */
    scanDurationMs: number | string;
    sensors: SensorEntry[];
}
