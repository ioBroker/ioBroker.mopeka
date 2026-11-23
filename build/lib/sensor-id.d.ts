/** The part of a configured sensor that names its device */
export interface SensorIdSource {
    name?: string;
    mac: string;
}
/** ID of the sensor device below the instance, e.g. "sensors.Gas_left" or "sensors.s_aabbccddeeff" */
export declare function getSensorId(sensor: SensorIdSource): string;
