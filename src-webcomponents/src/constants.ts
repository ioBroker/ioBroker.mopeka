/** Tag of `<iob-mopeka-tank>`: one sensor, or all sensors of an instance, as gas bottles */
export const TAG = 'iob-mopeka-tank';

/** The built module and its manifest, in `admin/webcomponents/` - `common.webComponents` names the manifest */
export const MODULE_FILE = 'mopeka-tank.js';
export const MANIFEST_FILE = 'mopeka-tank.json';
export const ICON_FILE = 'mopeka-tank.svg';

/** The values of the settings; a setting without a value is missing */
export type TankSettings = {
    /** A sensor device, `mopeka.0.sensors.<name>` (or one of its states) */
    sensor?: string;
    /** e.g. `mopeka.0`: all configured sensors of it, if no sensor is chosen */
    instance?: string;
    showName?: boolean;
    showDetails?: boolean;
    /** Yellow below this fill level, red below half of it */
    lowPct?: number;
};

/** The states of a sensor device the element shows (see `SENSOR_STATES` in src/main.ts) */
export const SENSOR_STATES = ['level_pct', 'level_mm', 'temperature', 'battery_pct', 'quality', 'reachable'] as const;

export type SensorState = (typeof SENSOR_STATES)[number];
