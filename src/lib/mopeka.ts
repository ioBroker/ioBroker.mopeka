// Mopeka tank-level sensor BLE advertisement decoder.
//
// Mopeka sensors broadcast their readings passively in the BLE advertisement
// (manufacturer-specific data, company id 89 / 0x0059, service UUID 0xFEE5).
// No connection is required. Protocol reference: Bluetooth-Devices/mopeka-iot-ble.

export const MOPEKA_MANUFACTURER_ID = 89; // 0x0059
export const MOPEKA_SERVICE_UUID = 'fee5';

export type MediumType = 'propane' | 'air' | 'water';

// Thermal-compensation coefficients (c0, c1, c2) per medium:
//   level_mm = raw * (c0 + c1*temp + c2*temp^2)
const MEDIUM_COEFFICIENTS: Record<MediumType, [number, number, number]> = {
    propane: [0.573045, -0.002822, -0.00000535],
    air: [0.7373417462, -0.001978229885, 0.00000202162], // also gasoline/diesel/LNG/oil
    water: [0.600592, 0.003124, -0.00001368],
};

// Hardware-id (payload byte 0) → human-readable model name.
const MODELS: Record<number, string> = {
    0x3: 'Pro Check',
    0x4: 'Pro-200',
    0x5: 'Pro Check H2O',
    0x6: 'Lippert BottleCheck',
    0x8: 'Pro Plus',
    0x9: 'Pro Plus Cellular',
    0xa: 'TD40/TD200',
    0xb: 'TD40/TD200 Cellular',
    0xc: 'Pro Check Universal',
    0x12: 'Pro-200B',
};

export interface MopekaReading {
    modelId: number;
    model: string;
    /** Raw tank reading (0..0x3FFF), before thermal compensation. */
    rawLevel: number;
    temperature: number; // °C
    batteryV: number; // volts
    batteryPct: number; // 0..100
    quality: number; // 0..3
    qualityPct: number; // 0..100
    button: boolean; // sync button pressed
    accelX: number;
    accelY: number;
}

function clamp(n: number, lo: number, hi: number): number {
    return n < lo ? lo : n > hi ? hi : n;
}

function round(n: number, d: number): number {
    return Number(n.toFixed(d));
}

/**
 * Decode a noble `advertisement.manufacturerData` buffer (which INCLUDES the
 * 2-byte company id). Returns null if it is not a recognised Mopeka frame.
 */
export function decodeMopeka(manufacturerData: Buffer | undefined): MopekaReading | null {
    if (!manufacturerData || manufacturerData.length < 12) {
        return null;
    }
    if (manufacturerData.readUInt16LE(0) !== MOPEKA_MANUFACTURER_ID) {
        return null;
    }
    const data = manufacturerData.subarray(2); // 10-byte payload
    const modelId = data[0];
    if (!(modelId in MODELS)) {
        return null;
    }
    const batteryV = data[1] / 32;
    const temperature = (data[2] & 0x7f) - 40;
    const button = (data[2] & 0x80) !== 0;
    const rawLevel = ((data[4] << 8) + data[3]) & 0x3fff;
    const quality = data[4] >> 6;

    return {
        modelId,
        model: MODELS[modelId],
        rawLevel,
        temperature,
        batteryV: round(batteryV, 3),
        batteryPct: round(clamp(((batteryV - 2.2) / 0.65) * 100, 0, 100), 1),
        quality,
        qualityPct: round((quality / 3) * 100, 0),
        button,
        accelX: data[8],
        accelY: data[9],
    };
}

/** Temperature-compensated liquid column height in millimetres. */
export function levelMm(rawLevel: number, temperature: number, medium: MediumType): number {
    const [c0, c1, c2] = MEDIUM_COEFFICIENTS[medium] || MEDIUM_COEFFICIENTS.propane;
    return round(rawLevel * (c0 + c1 * temperature + c2 * temperature * temperature), 1);
}

/** Fill percentage given a configured full tank height (mm). Returns null if not configured. */
export function fillPercent(mm: number, tankFullMm: number | undefined): number | null {
    if (!tankFullMm || tankFullMm <= 0) {
        return null;
    }
    return round(clamp((mm / tankFullMm) * 100, 0, 100), 1);
}

export function isMediumType(s: unknown): s is MediumType {
    return s === 'propane' || s === 'air' || s === 'water';
}
