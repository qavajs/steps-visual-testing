import { DataTable, IWorld, When } from '@cucumber/cucumber';
import { type MemoryValue } from '@qavajs/core';
import { PNG } from 'pngjs';
const pixelMatchModule = import('pixelmatch').then(m => m.default);
const BASE64 = 'base64';
const BASE64_IMAGE = 'base64:image/png';

async function compare(
    world: IWorld,
    actual: MemoryValue,
    expected: MemoryValue,
    threshold: number = 0.1
) {
    const pixelmatch = await pixelMatchModule;
    const actualValue = await actual.value();
    const expectedValue = await expected.value();
    const actualBuffer = typeof actualValue !== "string" ? actualValue : Buffer.from(actualValue, BASE64);
    const expectedBuffer = typeof expectedValue !== "string" ? expectedValue : Buffer.from(expectedValue, BASE64);
    const actualScreenshotImage = PNG.sync.read(actualBuffer);
    const expectedScreenshotImage = PNG.sync.read(expectedBuffer);
    const { width, height } = expectedScreenshotImage;
    const diff = new PNG({ width, height});
    let delta;
    try {
        delta = pixelmatch(
            actualScreenshotImage.data,
            expectedScreenshotImage.data,
            diff.data,
            width,
            height,
            { threshold }
        );
    } catch (e) {
        world.attach(actualBuffer.toString(BASE64), { mediaType: BASE64_IMAGE, fileName: 'actual' });
        world.attach(expectedBuffer.toString(BASE64), { mediaType: BASE64_IMAGE, fileName: 'expected' });
        throw e;
    }
    if (delta > 0) {
        world.attach(actualBuffer.toString(BASE64), { mediaType: BASE64_IMAGE, fileName: 'actual' });
        world.attach(expectedBuffer.toString(BASE64), { mediaType: BASE64_IMAGE, fileName: 'expected' });
        world.attach(PNG.sync.write(diff).toString(BASE64), { mediaType: BASE64_IMAGE, fileName: 'delta' });
        throw new Error('Images are not equal');
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
 *   | threshold | 0.4 |
 */
When('I expect {value} screenshot to equal {value}:',
    async function (actual: MemoryValue, expected: MemoryValue, dataTable: DataTable) {
        const [ params ] = dataTable.transpose().hashes();
        const threshold = parseFloat(await this.getValue(params.threshold));
        await compare(this, actual, expected, threshold);
    }
);
