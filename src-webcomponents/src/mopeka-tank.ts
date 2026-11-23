/**
 * `<iob-mopeka-tank>`: Mopeka tank sensors as gas bottles - one sensor (setting `sensor`), or all configured
 * sensors of an instance (setting `instance`). Shown alike by vis-2, devices, Aura and admin (the tab "Overview"
 * of the instance configuration).
 *
 * Plain DOM, no framework: the module brings the base class and nothing else, so it needs no React of the host.
 * The sensors of an instance come from its configuration (`native.sensors`); their device IDs are made by the
 * same function as in the adapter (`src/lib/sensor-id.ts`).
 */
import { defineWebComponent, IobWebComponent } from '@iobroker/web-components/element';

import { getSensorId, type SensorIdSource } from '../../src/lib/sensor-id.ts';
import { bottleSvg, escapeXml, type Level } from './bottle.ts';
import { SENSOR_STATES, TAG, type SensorState, type TankSettings } from './constants.ts';
import { word } from './i18n.ts';
import { STYLES } from './styles.ts';

const INSTANCE_PREFIX = 'system.adapter.';
const DEFAULT_LOW_PCT = 20;

interface Sensor {
    /** e.g. `mopeka.0.sensors.Gas_left` */
    id: string;
    name: string;
}

type Values = Partial<Record<SensorState, ioBroker.StateValue>>;

/** Shown in edit mode while nothing is chosen */
const SAMPLE: { sensor: Sensor; values: Values } = {
    sensor: { id: 'sample', name: 'Propane' },
    values: { level_pct: 65, level_mm: 198, temperature: 12.5, battery_pct: 90, quality: 3, reachable: true },
};

/** `mopeka.0` from `mopeka.0` or `system.adapter.mopeka.0` */
function getInstance(value: string | undefined): string {
    const instance = (value || '').trim();
    return instance.startsWith(INSTANCE_PREFIX) ? instance.slice(INSTANCE_PREFIX.length) : instance;
}

/** The device of a sensor, also if a state of it was chosen: `mopeka.0.sensors.<name>` */
function getDevice(id: string): string {
    const parts = id.trim().split('.');
    return parts[2] === 'sensors' && parts.length > 4 ? parts.slice(0, 4).join('.') : parts.join('.');
}

function toNumber(val: ioBroker.StateValue | undefined): number | null {
    if (val === null || val === undefined || val === '') {
        return null;
    }
    const n = typeof val === 'number' ? val : parseFloat(String(val));
    return Number.isFinite(n) ? n : null;
}

const ICON_TEMPERATURE =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 13.2V5a3 3 0 0 0-6 0v8.2a5 5 0 1 0 6 0ZM12 4a1 1 0 0 1 1 1v5h-2V5a1 1 0 0 1 1-1Z"/></svg>';

function batteryIcon(pct: number): string {
    const width = (17 * Math.max(0, Math.min(100, pct))) / 100;
    return (
        '<svg viewBox="0 0 26 14" aria-hidden="true">' +
        '<rect x="1" y="1" width="21" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
        '<rect x="22.6" y="4.5" width="2.4" height="5" rx="1"/>' +
        `<rect x="3" y="3" width="${width.toFixed(1)}" height="8" rx="1"/>` +
        '</svg>'
    );
}

function qualityIcon(quality: number): string {
    const bars = [5, 9, 13]
        .map(
            (h, i) =>
                `<rect class="bar${i < quality ? ' on' : ''}" x="${1 + i * 5}" y="${14 - h}" width="4" height="${h}" rx="1"/>`,
        )
        .join('');
    return `<svg viewBox="0 0 16 14" aria-hidden="true">${bars}</svg>`;
}

class MopekaTankElement extends IobWebComponent<TankSettings> {
    readonly #shadow: ShadowRoot;

    constructor() {
        super();
        this.#shadow = this.attachShadow({ mode: 'open' });
    }

    /** One sensor: its device (for the name); all sensors: the instance, whose configuration lists them */
    protected override getObjectIds(settings: TankSettings): string[] {
        if (settings.sensor) {
            return [getDevice(settings.sensor)];
        }
        const instance = getInstance(settings.instance);
        return instance ? [`${INSTANCE_PREFIX}${instance}`] : [];
    }

    protected override getStateIds(settings: TankSettings): string[] {
        return (this.#getSensors(settings) || []).flatMap(sensor =>
            SENSOR_STATES.map(state => `${sensor.id}.${state}`),
        );
    }

    /** The sensors to show; null while nothing is chosen */
    #getSensors(settings: TankSettings): Sensor[] | null {
        if (settings.sensor) {
            const id = getDevice(settings.sensor);
            const name = this.text(this.objects[id]?.common?.name) || id.split('.').pop() || id;
            return [{ id, name }];
        }
        const instance = getInstance(settings.instance);
        if (!instance) {
            return null;
        }
        const config = this.objects[`${INSTANCE_PREFIX}${instance}`]?.native as
            { sensors?: (SensorIdSource & { enabled?: boolean })[] } | undefined;
        const sensors = Array.isArray(config?.sensors) ? config.sensors : [];
        return sensors
            .filter(sensor => sensor?.mac && sensor.enabled !== false)
            .map(sensor => ({ id: `${instance}.${getSensorId(sensor)}`, name: sensor.name || sensor.mac }));
    }

    #format(value: number, digits: number): string {
        const lang = this.systemLang === 'zh-cn' ? 'zh-CN' : this.systemLang;
        try {
            return value.toLocaleString(lang, { minimumFractionDigits: digits, maximumFractionDigits: digits });
        } catch {
            return value.toFixed(digits);
        }
    }

    #renderTank(sensor: Sensor, values: Values, index: number): string {
        const settings = this.settings;
        const lang = this.systemLang;
        const pct = toNumber(values.level_pct);
        const mm = toNumber(values.level_mm);
        const temperature = toNumber(values.temperature);
        const battery = toNumber(values.battery_pct);
        const quality = toNumber(values.quality);
        const offline = values.reachable === false;
        const lowPct = typeof settings.lowPct === 'number' ? settings.lowPct : DEFAULT_LOW_PCT;

        let level: Level = 'unknown';
        if (pct !== null) {
            level = pct <= lowPct / 2 ? 'critical' : pct <= lowPct ? 'low' : 'ok';
        }
        let label = '–';
        if (pct !== null) {
            label = `${this.#format(pct, 0)} %`;
        } else if (mm !== null) {
            label = `${this.#format(mm, 0)} mm`;
        }
        let sublabel = pct !== null && mm !== null ? `${this.#format(mm, 0)} mm` : undefined;
        if (offline) {
            sublabel = word('offline', lang);
        }
        // without a tank height the adapter writes no level_pct
        const hint = pct === null && mm !== null ? word('noHeight', lang) : '';

        let html = `<div class="tank${offline ? ' offline' : ''}"${hint ? ` title="${escapeXml(hint)}"` : ''}>`;
        html += bottleSvg({ fill: pct, level, label, sublabel, alert: offline, uid: String(index) });
        if (settings.showName !== false) {
            html += `<div class="name" title="${escapeXml(sensor.name)}">${escapeXml(sensor.name)}</div>`;
        }
        if (settings.showDetails !== false) {
            const details: string[] = [];
            if (temperature !== null) {
                details.push(
                    `<span title="${escapeXml(word('temperature', lang))}">${ICON_TEMPERATURE}${this.#format(temperature, 1)} °C</span>`,
                );
            }
            if (battery !== null) {
                details.push(
                    `<span class="${battery < 20 ? 'weak' : ''}" title="${escapeXml(word('battery', lang))}">${batteryIcon(battery)}${this.#format(battery, 0)} %</span>`,
                );
            }
            if (quality !== null) {
                details.push(`<span title="${escapeXml(word('quality', lang))}">${qualityIcon(quality)}</span>`);
            }
            if (details.length) {
                html += `<div class="details">${details.join('')}</div>`;
            }
        }
        return `${html}</div>`;
    }

    #renderBody(): string {
        const settings = this.settings;
        const lang = this.systemLang;
        const sensors = this.#getSensors(settings);
        if (!sensors) {
            return this.editMode
                ? this.#renderTank(SAMPLE.sensor, SAMPLE.values, 0)
                : `<div class="message">${escapeXml(word('chooseSensor', lang))}</div>`;
        }
        if (!sensors.length) {
            // the configuration of the instance is still on its way
            const loaded = this.objects[`${INSTANCE_PREFIX}${getInstance(settings.instance)}`] !== undefined;
            return loaded ? `<div class="message">${escapeXml(word('noSensors', lang))}</div>` : '';
        }
        return sensors
            .map((sensor, index) => {
                const values: Values = {};
                for (const state of SENSOR_STATES) {
                    values[state] = this.states[`${sensor.id}.${state}`]?.val;
                }
                return this.#renderTank(sensor, values, index);
            })
            .join('');
    }

    protected override render(): void {
        this.#shadow.innerHTML = `<style>${STYLES}</style><div class="root">${this.#renderBody()}</div>`;
    }
}

defineWebComponent(TAG, MopekaTankElement);
