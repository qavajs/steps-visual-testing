import { DataTable, IWorld, When } from '@cucumber/cucumber';
import { type MemoryValue } from '@qavajs/core';
import { PNG } from 'pngjs';
const pixelMatchModule = import('pixelmatch').then(m => m.default);
const BASE64 = 'base64';
const BASE64_IMAGE = 'base64:image/png';
/**
 * pixelmatch >= 8 measures per-pixel color difference as OKLab HyAB distance, where 1 is black vs white,
 * but the largest possible distance between two sRGB colors is ~1.2119 (e.g. yellow vs dark blue).
 * Step threshold is kept in the 0..1 range (1 - any difference is accepted), so it is scaled to this maximum.
 */
const MAX_COLOR_DELTA = 1.212;

type RGB = [number, number, number];
export type Attachments = 'all' | 'diff' | 'none';

export interface CompareOptions {
    /** per-pixel color matching threshold (0..1) */
    threshold: number;
    /** count anti-aliased pixels as differences */
    includeAA: boolean;
    /** opacity of the original image in the diff output (0..1) */
    alpha: number;
    /** color of anti-aliased pixels in the diff output */
    aaColor: RGB;
    /** color of differing pixels in the diff output */
    diffColor: RGB;
    /** color of differing pixels that are darker in the expected image */
    diffColorAlt?: RGB;
    /** draw the diff over a transparent background */
    diffMask: boolean;
    /** which images to attach to the report on failure */
    attach: Attachments;
}

export const DEFAULT_OPTIONS: CompareOptions = {
    threshold: 0.1,
    includeAA: false,
    alpha: 0.1,
    aaColor: [255, 255, 0],
    diffColor: [255, 0, 0],
    diffMask: false,
    attach: 'all'
};

const ATTACHMENTS: Attachments[] = ['all', 'diff', 'none'];

function toStr(name: string, value: unknown): string {
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    throw new Error(`Parameter '${name}': expected a string, number or boolean, got ${typeof value}`);
}

function parseRatio(name: string, value: unknown): number {
    const str = toStr(name, value);
    const num = str === '' ? NaN : Number(str);
    if (!Number.isFinite(num) || num < 0 || num > 1) {
        throw new Error(`Parameter '${name}': expected a number in range 0..1, got '${value}'`);
    }
    return num;
}

function parseBoolean(name: string, value: unknown): boolean {
    if (typeof value === 'boolean') return value;
    const str = toStr(name, value).toLowerCase();
    if (str === 'true') return true;
    if (str === 'false') return false;
    throw new Error(`Parameter '${name}': expected true or false, got '${value}'`);
}

function parseColor(name: string, value: unknown): RGB {
    if (Array.isArray(value) && value.length === 3 && value.every(c => Number.isInteger(c) && c >= 0 && c <= 255)) {
        return value as RGB;
    }
    const str = typeof value === 'string' ? value.trim() : '';
    const hex = /^#([0-9a-f]{6})$/i.exec(str);
    if (hex) {
        const n = parseInt(hex[1], 16);
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    const parts = str.split(',').map(p => p.trim());
    if (parts.length === 3 && parts.every(p => /^\d{1,3}$/.test(p) && Number(p) <= 255)) {
        return parts.map(Number) as RGB;
    }
    throw new Error(`Parameter '${name}': expected a color as '#rrggbb' or 'r, g, b' (0..255), got '${value}'`);
}

function parseAttachments(name: string, value: unknown): Attachments {
    const str = toStr(name, value).toLowerCase() as Attachments;
    if (ATTACHMENTS.includes(str)) return str;
    throw new Error(`Parameter '${name}': expected one of ${ATTACHMENTS.map(a => `'${a}'`).join(', ')}, got '${value}'`);
}

const PARSERS: { [K in keyof CompareOptions]-?: (name: string, value: unknown) => CompareOptions[K] } = {
    threshold: parseRatio,
    includeAA: parseBoolean,
    alpha: parseRatio,
    aaColor: parseColor,
    diffColor: parseColor,
    diffColorAlt: parseColor,
    diffMask: parseBoolean,
    attach: parseAttachments
};

/**
 * Parse and validate step parameters, resolving each value through memory
 * @param params - raw key/value params (e.g. from a data table)
 * @param resolve - function resolving a raw value (e.g. memory expression)
 */
export async function parseOptions(
    params: Record<string, string>,
    resolve: (value: string) => unknown | Promise<unknown> = v => v
): Promise<CompareOptions> {
    const options: CompareOptions = { ...DEFAULT_OPTIONS };
    const supported = Object.keys(PARSERS);
    for (const [rawKey, rawValue] of Object.entries(params)) {
        const key = rawKey.trim() as keyof CompareOptions;
        if (!supported.includes(key)) {
            throw new Error(`Unknown parameter '${rawKey}'. Supported parameters: ${supported.join(', ')}`);
        }
        (options as any)[key] = PARSERS[key](key, await resolve(rawValue));
    }
    return options;
}

function toBuffer(value: unknown, name: string): Buffer {
    if (Buffer.isBuffer(value)) return value;
    if (value instanceof Uint8Array) return Buffer.from(value);
    if (typeof value === 'string') return Buffer.from(value, BASE64);
    throw new Error(`The ${name} screenshot must be a Buffer or a base64-encoded PNG string, got ${value === null ? 'null' : typeof value}`);
}

function readPng(buffer: Buffer, name: string): PNG {
    try {
        return PNG.sync.read(buffer);
    } catch (e) {
        throw new Error(`The ${name} screenshot is not a valid PNG image: ${(e as Error).message}`);
    }
}

function formatPercent(value: number): string {
    const percent = value * 100;
    return `${percent > 0 && percent < 0.01 ? '<0.01' : percent.toFixed(2)}%`;
}

/**
 * Compare two screenshots and attach actual, expected and delta images to the report on failure
 * @param world - cucumber world
 * @param actual - actual screenshot
 * @param expected - expected screenshot
 * @param options - comparison options
 */
export async function compare(
    world: IWorld,
    actual: MemoryValue,
    expected: MemoryValue,
    options: Partial<CompareOptions> = {}
) {
    const opts: CompareOptions = { ...DEFAULT_OPTIONS, ...options };
    const pixelmatch = await pixelMatchModule;
    const actualBuffer = toBuffer(await actual.value(), 'actual');
    const expectedBuffer = toBuffer(await expected.value(), 'expected');
    const attachSources = () => {
        world.attach(actualBuffer.toString(BASE64), { mediaType: BASE64_IMAGE, fileName: 'actual' });
        world.attach(expectedBuffer.toString(BASE64), { mediaType: BASE64_IMAGE, fileName: 'expected' });
    };
    const actualImage = readPng(actualBuffer, 'actual');
    const expectedImage = readPng(expectedBuffer, 'expected');
    const { width, height } = expectedImage;
    if (actualImage.width !== width || actualImage.height !== height) {
        // delta image cannot be built for images of different size, so sources are attached even in 'diff' mode
        if (opts.attach !== 'none') attachSources();
        throw new Error(
            `Image sizes do not match: actual ${actualImage.width}x${actualImage.height}, expected ${width}x${height}`
        );
    }
    const diff = new PNG({ width, height });
    const delta = pixelmatch(
        actualImage.data,
        expectedImage.data,
        diff.data,
        width,
        height,
        {
            threshold: opts.threshold * MAX_COLOR_DELTA,
            includeAA: opts.includeAA,
            alpha: opts.alpha,
            aaColor: opts.aaColor,
            diffColor: opts.diffColor,
            diffColorAlt: opts.diffColorAlt,
            diffMask: opts.diffMask
        }
    );
    if (delta > 0) {
        if (opts.attach === 'all') attachSources();
        if (opts.attach !== 'none') {
            world.attach(PNG.sync.write(diff).toString(BASE64), { mediaType: BASE64_IMAGE, fileName: 'delta' });
        }
        const total = width * height;
        throw new Error(
            `Images are not equal: ${delta} of ${total} pixels (${formatPercent(delta / total)}) differ ` +
            `at threshold ${opts.threshold}`
        );
    }
}

/**
 * Compare two screenshots saved in memory as base64 string
 * @param {string} actual - alias of actual screenshot
 * @param {string} alias - alias of expected screenshot
 * A screenshot can either be a Buffer instance or base 64 encoded string
 * @example I expect '$actual' screenshot to equal '$expected'
 */
When('I expect {value} screenshot to equal {value}',
    async function (actual: MemoryValue, expected: MemoryValue) {
        await compare(this, actual, expected);
    }
);

/**
 * Compare two screenshots saved in memory as base64 string
 * @param {string} actual - alias of actual screenshot
 * @param {string} alias - alias of expected screenshot
 * @param {dataTable} params - params data table
 * A screenshot can either be a Buffer instance or base 64 encoded string
 * @example
 * I expect '$actual' screenshot to equal '$expected':
 *   | threshold | 0.4   |
 *   | includeAA | true  |
 *   | attach    | diff  |
 */
When('I expect {value} screenshot to equal {value}:',
    async function (actual: MemoryValue, expected: MemoryValue, dataTable: DataTable) {
        const options = await parseOptions(dataTable.rowsHash(), value => this.getValue(value));
        await compare(this, actual, expected, options);
    }
);
