/**
 * The gas bottle as SVG markup - a plain string without DOM, so the build can make the icon of the manifest
 * from it as well. Colors come from CSS classes: the element styles them with the theme of the host
 * (`styles.ts`), the icon with fixed colors (`ICON_STYLE`).
 */

/** Fill level as the element colors it */
export type Level = 'ok' | 'low' | 'critical' | 'unknown';

export interface BottleOptions {
    /** Fill level 0..100; null: unknown, the bottle stays empty */
    fill: number | null;
    level: Level;
    /** Big text inside the bottle, e.g. "65 %" */
    label: string;
    /** Smaller text below it, e.g. "312 mm" */
    sublabel?: string;
    /** Show the sublabel as a warning, e.g. "offline" */
    alert?: boolean;
    /** Makes the IDs of the clip path and the gradient unique among several bottles in one shadow root */
    uid: string;
}

export const VIEW_BOX = '0 0 100 184';

// the inner height of the body: the liquid rises from BOTTOM to TOP
const TOP = 36;
const BOTTOM = 170;

const BODY = 'M14 64C14 44 30 36 50 36S86 44 86 64V154C86 166 72 170 50 170S14 166 14 154Z';
// the collar with the opening of the handle
const COLLAR =
    'M34 6h32a6 6 0 0 1 6 6v26H28V12a6 6 0 0 1 6-6Zm4 6a3 3 0 0 0-3 3v4a3 3 0 0 0 3 3h24a3 3 0 0 0 3-3v-4a3 3 0 0 0-3-3Z';

export function escapeXml(text: string): string {
    return text.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
}

export function bottleSvg(o: BottleOptions): string {
    const fill = o.fill === null || !Number.isFinite(o.fill) ? 0 : Math.max(0, Math.min(100, o.fill));
    const height = ((BOTTOM - TOP) * fill) / 100;
    const y = BOTTOM - height;
    const clip = `mopeka-body-${o.uid}`;
    const shine = `mopeka-shine-${o.uid}`;
    const labelY = o.sublabel ? 106 : 112;
    const ariaLabel = escapeXml([o.label, o.sublabel].filter(Boolean).join(' '));

    const parts = [
        `<svg class="bottle" viewBox="${VIEW_BOX}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${ariaLabel}">`,
        '<defs>',
        `<clipPath id="${clip}"><path d="${BODY}"/></clipPath>`,
        `<linearGradient id="${shine}" x1="0" x2="1" y1="0" y2="0">`,
        '<stop offset="0" stop-color="#fff" stop-opacity=".04"/>',
        '<stop offset=".22" stop-color="#fff" stop-opacity=".32"/>',
        '<stop offset=".46" stop-color="#fff" stop-opacity="0"/>',
        '<stop offset="1" stop-color="#000" stop-opacity=".16"/>',
        '</linearGradient>',
        '</defs>',
        // everything but the texts: an offline sensor dims it
        '<g class="art">',
        '<rect class="metal" x="24" y="158" width="52" height="24" rx="3"/>',
        `<path class="metal" fill-rule="evenodd" d="${COLLAR}"/>`,
        `<path class="body" d="${BODY}"/>`,
        `<g clip-path="url(#${clip})">`,
    ];
    if (height > 0) {
        parts.push(
            `<rect class="liquid ${o.level}" x="0" y="${y.toFixed(2)}" width="100" height="${height.toFixed(2)}"/>`,
            `<rect class="surface ${o.level}" x="0" y="${y.toFixed(2)}" width="100" height="2.5"/>`,
        );
    }
    parts.push(
        `<rect x="0" y="0" width="100" height="184" fill="url(#${shine})"/>`,
        '</g>',
        '<path class="seam" d="M14.5 104H85.5"/>',
        `<path class="outline" d="${BODY}"/>`,
        '<rect class="valve" x="44" y="24" width="12" height="14" rx="2"/>',
        '</g>',
        `<text class="label" x="50" y="${labelY}" text-anchor="middle">${escapeXml(o.label)}</text>`,
    );
    if (o.sublabel) {
        const cls = o.alert ? 'sublabel alert' : 'sublabel';
        parts.push(`<text class="${cls}" x="50" y="126" text-anchor="middle">${escapeXml(o.sublabel)}</text>`);
    }
    parts.push('</svg>');
    return parts.join('');
}

/** The styles of the classes above with fixed colors, for the icon */
const ICON_STYLE =
    '.metal{fill:#9aa5b1;stroke:#52606d;stroke-width:2}' +
    '.body{fill:#e4e7eb}' +
    '.outline{fill:none;stroke:#52606d;stroke-width:2.5}' +
    '.seam{stroke:#52606d;stroke-opacity:.35;stroke-width:1.5}' +
    '.valve{fill:#3e4c59}' +
    '.liquid{fill:#2e9f5b}' +
    '.surface{fill:#7fd6a0}' +
    '.label,.sublabel{display:none}';

/** The icon of the manifest: a bottle filled to two thirds */
export function iconSvg(): string {
    const svg = bottleSvg({ fill: 65, level: 'ok', label: '', uid: 'icon' });
    return svg
        .replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')
        .replace('<defs>', `<defs><style>${ICON_STYLE}</style>`);
}
