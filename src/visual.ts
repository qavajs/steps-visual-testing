import {DataTable, IWorld, When} from '@cucumber/cucumber';
import memory from '@qavajs/memory';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

async function compare(
    world: IWorld,
    actual: string,
    expected: string,
    threshold: number = 0.1
) {
    const actualValue = await memory.getValue(actual);
    const expectedValue = await memory.getValue(expected);
    const actualBuffer = typeof actualValue !== "string" ? actualValue : Buffer.from(actualValue, 'base64');
    const expectedBuffer = typeof expectedValue !== "string" ? expectedValue : Buffer.from(expectedValue, 'base64');
    const actualScreenshotImage = PNG.sync.read(actualBuffer);
    const expectedScreenshotImage = PNG.sync.read(expectedBuffer);
    const { width, height } = expectedScreenshotImage;
    const diff = new PNG({width, height});
    const delta = pixelmatch(
        actualScreenshotImage.data,
        expectedScreenshotImage.data,
        diff.data,
        width,
        height,
        { threshold }
    );
    if (delta > 0) {
        world.attach(actualBuffer.toString('base64'), 'base64:image/png');
        world.attach(expectedBuffer.toString('base64'), 'base64:image/png');
        world.attach(PNG.sync.write(diff).toString('base64'), 'base64:image/png');
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
When('I expect {string} screenshot to equal {string}',
    async function (actual, expected) {
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
When('I expect {string} screenshot to equal {string}:',
    async function (actual: string, expected: string, dataTable: DataTable) {
        const [ params ] = dataTable.transpose().hashes();
        const threshold = parseFloat(await memory.getValue(params.threshold));
        await compare(this, actual, expected, threshold);
    }
);
