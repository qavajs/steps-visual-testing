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
    const actualScreenshot = await memory.getValue(actual);
    const expectedScreenshot = await memory.getValue(expected);
    const actualScreenshotImage = PNG.sync.read(Buffer.from(actualScreenshot, 'base64'));
    const expectedScreenshotImage = PNG.sync.read(Buffer.from(expectedScreenshot, 'base64'));
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
        world.attach(actualScreenshot, 'base64:image/png');
        world.attach(expectedScreenshot, 'base64:image/png');
        world.attach(PNG.sync.write(diff).toString('base64'), 'base64:image/png');
        throw new Error('Images are not equal');
    }
}

/**
 * Compare two screenshots saved in memory as base64 string
 * @param {string} actual - alias of actual screenshot
 * @param {string} alias - alias of expected screenshot
 * @example I expect '$actual' screenshot to equal '$expected'
 */
When(
    'I expect {string} screenshot to equal {string}',
    async function (actual, expected) {
        await compare(this, actual, expected);
    }
);

/**
 * Compare two screenshots saved in memory as base64 string
 * @param {string} actual - alias of actual screenshot
 * @param {string} alias - alias of expected screenshot
 * @param {dataTable} params - params data table
 * @example
 * I expect '$actual' screenshot to equal '$expected':
 *   | threshold | 0.4 |
 */
When(
    'I expect {string} screenshot to equal {string}:',
    async function (actual: string, expected: string, dataTable: DataTable) {
        const [ params ] = dataTable.transpose().hashes();
        const threshold = parseFloat(await memory.getValue(params.threshold));
        await compare(this, actual, expected, threshold);
    }
);
