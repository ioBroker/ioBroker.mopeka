import {
    ACTIONS,
    DeviceManagement,
    type ActionContext,
    type ConfigItemAny,
    type DeviceAction,
    type DeviceDetails,
    type DeviceInfo,
    type DeviceLoadContext,
    type DeviceRefreshResponse,
    type InstanceDetails,
    type InstanceRefreshResponse,
    type StatusIndicator,
} from '@iobroker/dm-utils';
import type { AdapterInstance } from '@iobroker/adapter-core';
import type { MopekaAdapterConfig, SensorEntry } from '../types';
import { t } from './i18n';
import { isMediumType, type MediumType } from './mopeka';
import type { ScanDevice } from './source';

/** What the device manager needs from the adapter */
export interface MopekaAdapterApi extends AdapterInstance {
    config: MopekaAdapterConfig;
    /** Device ID of a sensor relative to the instance, e.g. `sensors.Gas_left` */
    getDeviceId(sensor: SensorEntry): string;
    scanSensors(): Promise<ScanDevice[]>;
    updateSensors(mutate: (sensors: SensorEntry[]) => SensorEntry[]): Promise<void>;
}

/** The gas bottle of `src-webcomponents/`, shown on every card */
const TANK_WEB_COMPONENT = 'webcomponents/mopeka-tank.json';

/** Like the default of the web component: yellow below 20 %, red below 10 % */
const LOW_PCT = 20;

const MEDIA: MediumType[] = ['propane', 'air', 'water'];

function svgIcon(path: string): string {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="${path}"/></svg>`;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

const ICON_BOTTLE = svgIcon(
    'M9 1h6v2h-1.5v1.6c3 .5 5.5 3 5.5 6.4v9a2 2 0 0 1-2 2v1H7v-1a2 2 0 0 1-2-2v-9c0-3.4 2.5-5.9 5.5-6.4V3H9z',
);
const ICON_TEMPERATURE = svgIcon(
    'M15 13V5c0-1.66-1.34-3-3-3S9 3.34 9 5v8c-1.21.91-2 2.37-2 4 0 2.76 2.24 5 5 5s5-2.24 5-5c0-1.63-.79-3.09-2-4m-4-8c0-.55.45-1 1-1s1 .45 1 1h-1v1h1v2h-1v1h1v2h-2z',
);
const ICON_QUALITY = svgIcon('M2 22h4v-6H2zm7 0h4V10H9zm7 0h4V2h-4z');

function mediumOf(sensor: SensorEntry): MediumType {
    return isMediumType(sensor.medium) ? sensor.medium : 'propane';
}

function tankHeightOf(sensor: SensorEntry): number {
    const mm = Number(sensor.tankFullMm);
    return Number.isFinite(mm) && mm > 0 ? mm : 0;
}

export class MopekaDeviceManagement extends DeviceManagement<MopekaAdapterApi> {
    private full(relId: string): string {
        return `${this.adapter.namespace}.${relId}`;
    }

    private getSensors(): SensorEntry[] {
        const list = this.adapter.config.sensors;
        return Array.isArray(list) ? list.filter(s => s?.mac) : [];
    }

    private findSensor(mac: string): SensorEntry | undefined {
        return this.getSensors().find(s => s.mac === mac);
    }

    protected override getInstanceInfo(): InstanceDetails {
        return {
            apiVersion: 'v3',
            identifierLabel: 'MAC',
            actions: [
                {
                    id: 'scan',
                    icon: 'search',
                    title: t('Scan for sensors'),
                    description: t('Scan for sensors'),
                    handler: (context: ActionContext): Promise<InstanceRefreshResponse> => this.onScan(context),
                },
            ],
        };
    }

    protected override loadDevices(context: DeviceLoadContext<string>): void {
        const sensors = [...this.getSensors()].sort((a, b) =>
            (a.name || a.mac).localeCompare(b.name || b.mac, undefined, { numeric: true, sensitivity: 'base' }),
        );
        context.setTotalDevices(sensors.length);
        for (const sensor of sensors) {
            context.addDevice(this.getSensorInfo(sensor));
        }
    }

    protected override getDeviceDetails(id: string): Promise<DeviceDetails<string> | null | { error: string }> {
        const sensor = this.findSensor(id);
        if (!sensor) {
            return Promise.resolve({ error: `Unknown sensor ${id}` });
        }
        return this.getSensorDetails(sensor);
    }

    // ---------------------------------------------------------------------------------------------
    // Cards

    private getIndicators(sensor: SensorEntry, devId: string): StatusIndicator[] {
        const withPct = tankHeightOf(sensor) > 0;
        return [
            {
                id: 'level',
                value: { stateId: this.full(`${devId}.${withPct ? 'level_pct' : 'level_mm'}`) },
                icon: ICON_BOTTLE,
                showValue: true,
                unit: withPct ? '%' : 'mm',
                tooltip: withPct ? t('Fill level') : t('Liquid level'),
                configurable: true,
                order: 10,
                levels: withPct
                    ? [{ max: LOW_PCT / 2, color: 'error' }, { max: LOW_PCT, color: 'warning' }, { color: 'ok' }]
                    : undefined,
            },
            {
                id: 'temperature',
                value: { stateId: this.full(`${devId}.temperature`) },
                icon: ICON_TEMPERATURE,
                showValue: true,
                unit: '°C',
                tooltip: t('Temperature'),
                configurable: true,
                order: 20,
            },
            {
                id: 'quality',
                value: { stateId: this.full(`${devId}.quality`) },
                icon: ICON_QUALITY,
                tooltip: t('Reading quality'),
                label: t('Reading quality'),
                configurable: true,
                order: 30,
                levels: [
                    { value: 0, color: 'error', tooltip: t('No valid reading') },
                    { value: 1, color: 'warning', tooltip: t('Poor contact') },
                    { value: 2, color: 'ok', tooltip: t('Normal reading') },
                    { value: 3, color: 'ok', tooltip: t('Optimal reading') },
                ],
            },
        ];
    }

    /** The gas bottle on the card; name and values are shown by the card itself */
    private getCustomInfo(sensor: SensorEntry, devId: string): DeviceDetails<string> {
        // `webComponent` is newer than the types of dm-utils: JSON-Config of admin 8.3.10+ shows it
        const tank = {
            type: 'custom',
            webComponent: TANK_WEB_COMPONENT,
            settings: { sensor: this.full(devId), showName: false, showDetails: false, lowPct: LOW_PCT },
            height: 150,
            xs: 12,
        } as unknown as ConfigItemAny;
        return { id: sensor.mac, schema: { type: 'panel', items: { _tank: tank } } };
    }

    private getSensorInfo(sensor: SensorEntry): DeviceInfo<string> {
        const enabled = sensor.enabled !== false;
        const devId = this.adapter.getDeviceId(sensor);
        const medium = mediumOf(sensor);

        const actions: DeviceAction<string>[] = [
            {
                id: ACTIONS.ENABLE_DISABLE,
                description: t('Enabled'),
                handler: async (mac: string, context: ActionContext): Promise<DeviceRefreshResponse<string>> => {
                    await this.adapter.updateSensors(list =>
                        list.map(s => (s.mac === mac ? { ...s, enabled: s.enabled === false } : s)),
                    );
                    await context.showMessage(t('Settings changed'));
                    return { refresh: 'devices' };
                },
            },
            {
                id: 'edit',
                icon: 'edit',
                description: t('Edit'),
                handler: (mac: string, context: ActionContext): Promise<DeviceRefreshResponse<string>> =>
                    this.onEdit(mac, context),
            },
            {
                id: 'delete',
                icon: 'delete',
                description: t('Delete'),
                confirmation: t('Delete sensor?'),
                handler: async (mac: string): Promise<DeviceRefreshResponse<string>> => {
                    await this.adapter.updateSensors(list => list.filter(s => s.mac !== mac));
                    return { delete: mac };
                },
            },
        ];

        const info: DeviceInfo<string> = {
            id: sensor.mac,
            identifier: sensor.mac,
            name: sensor.name || sensor.mac,
            icon: ICON_BOTTLE,
            manufacturer: 'Mopeka',
            enabled,
            group: { key: medium, name: t(medium), icon: ICON_BOTTLE },
            actions,
        };

        if (!enabled) {
            // A disabled sensor has no objects, so there is nothing live to bind to
            info.status = 'disconnected';
            return info;
        }

        info.model = { stateId: this.full(`${devId}.model`) };
        info.status = {
            connection: {
                stateId: this.full(`${devId}.reachable`),
                mapping: { true: 'connected', false: 'disconnected' },
            },
            battery: { stateId: this.full(`${devId}.battery_pct`) },
            rssi: { stateId: this.full(`${devId}.rssi`) },
        };
        info.indicators = this.getIndicators(sensor, devId);
        info.customInfo = this.getCustomInfo(sensor, devId);
        info.hasDetails = true;
        return info;
    }

    // ---------------------------------------------------------------------------------------------
    // Details

    private stateItem(relId: string, label: ioBroker.StringOrTranslated, unit?: string): ConfigItemAny {
        return { type: 'state', oid: this.full(relId), foreign: true, label, unit, xs: 12, sm: 6 };
    }

    private staticItem(
        label: ioBroker.StringOrTranslated,
        data: ioBroker.StringOrTranslated | number,
        unit?: string,
    ): ConfigItemAny {
        return { type: 'staticInfo', label, data, unit, xs: 12, sm: 6 };
    }

    private header(text: ioBroker.StringOrTranslated): ConfigItemAny {
        return { type: 'header', text, size: 4, newLine: true, xs: 12 };
    }

    private async getSensorDetails(sensor: SensorEntry): Promise<DeviceDetails<string>> {
        const devId = this.adapter.getDeviceId(sensor);
        const height = tankHeightOf(sensor);
        const items: Record<string, ConfigItemAny> = {
            _level: this.header(t('Fill level')),
        };
        if (height) {
            items.level_pct = this.stateItem(`${devId}.level_pct`, t('Fill level'), '%');
        }
        items.level_mm = this.stateItem(`${devId}.level_mm`, t('Liquid level'), 'mm');
        items.height = this.staticItem(t('Tank height (mm)'), height || '—', height ? 'mm' : undefined);
        items.medium = this.staticItem(t('Medium'), t(mediumOf(sensor)));

        items._measurement = this.header(t('Measurement'));
        items.temperature = this.stateItem(`${devId}.temperature`, t('Temperature'), '°C');
        items.quality_pct = this.stateItem(`${devId}.quality_pct`, t('Reading quality'), '%');
        items.battery_pct = this.stateItem(`${devId}.battery_pct`, t('Battery level'), '%');
        items.battery_v = this.stateItem(`${devId}.battery_v`, t('Battery voltage'), 'V');
        items.rssi = this.stateItem(`${devId}.rssi`, t('Signal strength'), 'dBm');

        items._sensor = this.header(t('Sensor'));
        items.mac = this.staticItem('MAC', sensor.mac);
        items.model = this.stateItem(`${devId}.model`, t('Model'));
        const lastUpdate = await this.adapter.getStateAsync(`${devId}.lastUpdate`);
        const ts = typeof lastUpdate?.val === 'number' && lastUpdate.val > 0 ? lastUpdate.val : 0;
        items.lastUpdate = this.staticItem(t('Last update'), ts ? new Date(ts).toLocaleString() : '—');

        return { id: sensor.mac, schema: { type: 'panel', items } };
    }

    // ---------------------------------------------------------------------------------------------
    // Actions

    private mediumOptions(): { value: MediumType; label: ioBroker.Translated }[] {
        return MEDIA.map(m => ({ value: m, label: t(m) }));
    }

    private async onScan(context: ActionContext): Promise<InstanceRefreshResponse> {
        const progress = await context.openProgress(t('Scanning'), { indeterminate: true });
        let found: ScanDevice[];
        try {
            found = await this.adapter.scanSensors();
        } catch (e) {
            await progress.close();
            await context.showMessage((e as Error).message);
            return { refresh: false };
        }
        await progress.close();

        const known = new Set(this.getSensors().map(s => s.mac.toLowerCase()));
        const fresh = found.filter(d => !known.has(d.address.toLowerCase()));
        if (!fresh.length) {
            await context.showMessage(t('No new sensors found'));
            return { refresh: false };
        }

        const items: Record<string, ConfigItemAny> = {
            _info: { type: 'staticText', text: t('Add selected sensors'), xs: 12 },
        };
        const data: Record<string, boolean | string> = {};
        fresh.forEach((d, i) => {
            items[`add_${i}`] = {
                type: 'checkbox',
                label: `${d.model || 'Mopeka'} (${d.address}, ${d.rssi} dBm)`,
                newLine: true,
                xs: 12,
                sm: 4,
            };
            items[`name_${i}`] = { type: 'text', label: t('Name'), hidden: `!data.add_${i}`, xs: 12, sm: 4 };
            items[`medium_${i}`] = {
                type: 'select',
                label: t('Medium'),
                options: this.mediumOptions(),
                hidden: `!data.add_${i}`,
                xs: 12,
                sm: 4,
            };
            data[`add_${i}`] = true;
            data[`name_${i}`] = d.model ? `${d.model} ${d.address.slice(-5)}` : d.address;
            data[`medium_${i}`] = 'propane';
        });

        const result = await context.showForm(
            { type: 'panel', items },
            { data, title: t('Found sensors'), buttons: ['apply', 'cancel'] },
        );
        if (!result) {
            return { refresh: false };
        }
        const toAdd: SensorEntry[] = [];
        fresh.forEach((d, i) => {
            if (result[`add_${i}`]) {
                const medium = result[`medium_${i}`];
                toAdd.push({
                    mac: d.address,
                    name: String(result[`name_${i}`] || '').trim(),
                    enabled: true,
                    medium: isMediumType(medium) ? medium : 'propane',
                });
            }
        });
        if (!toAdd.length) {
            return { refresh: false };
        }
        await this.adapter.updateSensors(list => [...list, ...toAdd]);
        await context.showMessage(t('Settings changed'));
        return { refresh: true };
    }

    private async onEdit(mac: string, context: ActionContext): Promise<DeviceRefreshResponse<string>> {
        const sensor = this.findSensor(mac);
        if (!sensor) {
            return { refresh: 'devices' };
        }
        const result = await context.showForm(
            {
                type: 'panel',
                items: {
                    name: { type: 'text', label: t('Name'), xs: 12 },
                    medium: {
                        type: 'select',
                        label: t('Medium'),
                        options: this.mediumOptions(),
                        newLine: true,
                        xs: 12,
                        sm: 6,
                    },
                    tankFullMm: {
                        type: 'number',
                        label: t('Tank height (mm)'),
                        help: t('Tank height help'),
                        min: 0,
                        max: 5000,
                        xs: 12,
                        sm: 6,
                    },
                    enabled: { type: 'checkbox', label: t('Enabled'), newLine: true, xs: 12 },
                },
            },
            {
                data: {
                    name: sensor.name || '',
                    medium: mediumOf(sensor),
                    tankFullMm: tankHeightOf(sensor),
                    enabled: sensor.enabled !== false,
                },
                title: t('Sensor settings'),
                buttons: ['apply', 'cancel'],
            },
        );
        if (!result) {
            return { refresh: 'none' };
        }
        const name = String(result.name ?? '').trim();
        const medium = isMediumType(result.medium) ? result.medium : mediumOf(sensor);
        const height = Number(result.tankFullMm);
        const tankFullMm = Number.isFinite(height) && height > 0 ? Math.round(height) : 0;
        const enabled = !!result.enabled;
        if (
            name === (sensor.name || '') &&
            medium === mediumOf(sensor) &&
            tankFullMm === tankHeightOf(sensor) &&
            enabled === (sensor.enabled !== false)
        ) {
            return { refresh: 'none' };
        }
        // The objects of a sensor are named after it, so two sensors must not share a name
        const newDevId = this.adapter.getDeviceId({ ...sensor, name });
        if (this.getSensors().some(s => s.mac !== mac && this.adapter.getDeviceId(s) === newDevId)) {
            await context.showMessage(t('Name already used'));
            return { refresh: 'none' };
        }
        await this.adapter.updateSensors(list =>
            list.map(s => (s.mac === mac ? { ...s, name, medium, tankFullMm, enabled } : s)),
        );
        await context.showMessage(t('Settings changed'));
        return { refresh: 'devices' };
    }
}
