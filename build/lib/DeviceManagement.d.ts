import { DeviceManagement, type DeviceDetails, type DeviceLoadContext, type InstanceDetails } from '@iobroker/dm-utils';
import type { AdapterInstance } from '@iobroker/adapter-core';
import type { MopekaAdapterConfig, SensorEntry } from '../types';
import type { ScanDevice } from './source';
/** What the device manager needs from the adapter */
export interface MopekaAdapterApi extends AdapterInstance {
    config: MopekaAdapterConfig;
    /** Device ID of a sensor relative to the instance, e.g. `sensors.Gas_left` */
    getDeviceId(sensor: SensorEntry): string;
    scanSensors(): Promise<ScanDevice[]>;
    updateSensors(mutate: (sensors: SensorEntry[]) => SensorEntry[]): Promise<void>;
}
export declare class MopekaDeviceManagement extends DeviceManagement<MopekaAdapterApi> {
    private full;
    private getSensors;
    private findSensor;
    protected getInstanceInfo(): InstanceDetails;
    protected loadDevices(context: DeviceLoadContext<string>): void;
    protected getDeviceDetails(id: string): Promise<DeviceDetails<string> | null | {
        error: string;
    }>;
    private getIndicators;
    /** The gas bottle on the card; name and values are shown by the card itself */
    private getCustomInfo;
    private getSensorInfo;
    private stateItem;
    private staticItem;
    private header;
    private getSensorDetails;
    private mediumOptions;
    private onScan;
    private onEdit;
}
