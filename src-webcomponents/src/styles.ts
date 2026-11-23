/**
 * The styles in the shadow root. Colors come from the theme of the host (`--iob-*`, set by the base class), sizes
 * from the box of the host (container queries) - the element never measures itself.
 */
export const STYLES = `
:host {
    display: block;
    width: 100%;
    height: 100%;
    container-type: size;
}
.root {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: stretch;
    justify-content: center;
    gap: 4cqmin;
    padding: 2cqmin;
}
.tank {
    flex: 1 1 0;
    min-width: 0;
    max-width: calc(100cqh * 0.8);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5cqmin;
}
.bottle {
    /* only the height left over by the name and the details */
    flex: 1 1 0;
    min-height: 0;
    width: 100%;
}
.offline .art {
    opacity: 0.45;
}
.name {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 600;
    font-size: clamp(11px, 7cqmin, 20px);
}
.details {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    column-gap: 0.8em;
    font-size: clamp(10px, 5.5cqmin, 15px);
    color: var(--iob-text-secondary);
    white-space: nowrap;
}
.details span {
    display: inline-flex;
    align-items: center;
    gap: 0.25em;
}
.details svg {
    height: 1.05em;
    width: auto;
    fill: currentColor;
}
.details .weak {
    color: var(--iob-error);
}
.bar {
    opacity: 0.3;
}
.bar.on {
    opacity: 1;
}
.message {
    margin: auto;
    padding: 4cqmin;
    text-align: center;
    color: var(--iob-text-secondary);
    font-size: clamp(11px, 6cqmin, 16px);
}

/* the bottle, see bottle.ts */
.metal {
    fill: color-mix(in srgb, var(--iob-text-secondary) 45%, var(--iob-paper));
    stroke: var(--iob-text-secondary);
    stroke-width: 2;
}
.body {
    fill: color-mix(in srgb, var(--iob-text) 8%, var(--iob-paper));
}
.outline {
    fill: none;
    stroke: var(--iob-text-secondary);
    stroke-width: 2.5;
}
.seam {
    stroke: var(--iob-text-secondary);
    stroke-opacity: 0.35;
    stroke-width: 1.5;
}
.valve {
    fill: var(--iob-text-secondary);
}
.liquid.ok {
    fill: var(--iob-success);
}
.liquid.low {
    fill: var(--iob-warning);
}
.liquid.critical {
    fill: var(--iob-error);
}
.liquid.unknown {
    fill: var(--iob-text-secondary);
}
.surface {
    fill: #fff;
    fill-opacity: 0.35;
}
.label,
.sublabel {
    fill: var(--iob-text);
    stroke: var(--iob-paper);
    paint-order: stroke;
    stroke-linejoin: round;
}
.label {
    font-size: 20px;
    font-weight: 700;
    stroke-width: 4px;
}
.sublabel {
    font-size: 11px;
    stroke-width: 3px;
}
.sublabel.alert {
    fill: var(--iob-error);
    font-weight: 700;
}
`;
