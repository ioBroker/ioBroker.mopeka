export declare const MOPEKA_MANUFACTURER_ID = 89;
export declare const MOPEKA_SERVICE_UUID = "fee5";
export type MediumType = 'propane' | 'air' | 'water';
export interface MopekaReading {
    modelId: number;
    model: string;
    /** Raw tank reading (0..0x3FFF), before thermal compensation. */
    rawLevel: number;
    temperature: number;
    batteryV: number;
    batteryPct: number;
    quality: number;
    qualityPct: number;
    button: boolean;
    accelX: number;
    accelY: number;
}
/**
 * Decode a noble `advertisement.manufacturerData` buffer (which INCLUDES the
 * 2-byte company id). Returns null if it is not a recognised Mopeka frame.
 */
export declare function decodeMopeka(manufacturerData: Buffer | undefined): MopekaReading | null;
/** Temperature-compensated liquid column height in millimetres. */
export declare function levelMm(rawLevel: number, temperature: number, medium: MediumType): number;
/** Fill percentage given a configured full tank height (mm). Returns null if not configured. */
export declare function fillPercent(mm: number, tankFullMm: number | undefined): number | null;
export declare function isMediumType(s: unknown): s is MediumType;
