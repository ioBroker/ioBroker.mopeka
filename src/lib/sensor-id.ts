// IDs of the sensor devices. Used by the adapter and by the web component
// (src-webcomponents), which derives the states of every configured sensor
// from the instance configuration - keep both on this one function.

/** The part of a configured sensor that names its device */
export interface SensorIdSource {
    name?: string;
    mac: string;
}

function sanitizeId(s: string): string {
    return (s || '').toString().replace(/[^a-zA-Z0-9_]/g, '_');
}

function macToId(mac: string): string {
    return mac.toLowerCase().replace(/[^a-f0-9]/g, '');
}

/** ID of the sensor device below the instance, e.g. "sensors.Gas_left" or "sensors.s_aabbccddeeff" */
export function getSensorId(sensor: SensorIdSource): string {
    const named = sensor.name ? sanitizeId(sensor.name) : '';
    return `sensors.${named || `s_${macToId(sensor.mac)}`}`;
}
