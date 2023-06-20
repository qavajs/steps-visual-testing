import { When } from '@cucumber/cucumber';
import memory from '@qavajs/memory';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
/**
 * Compare two screenshots saved in memory as base64 string
 * @param {string} actual - alias of actual screenshot
 * @param {string} alias - alias of expected screenshot
 * @example I expect '$actual' screenshot to equal '$expected'
 */
When(
    'I expect {string} screenshot to equal {string}',
    async function (actual: string, expected: string) {
        const actualScreenshot = memory.getValue(actual);
        const expectedScreenshot = memory.getValue(expected);
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
            { threshold: 0.1 }
        );
        if (delta > 0) {
            this.attach(actualScreenshot, 'base64:image/png');
            this.attach(expectedScreenshot, 'base64:image/png');
            this.attach(PNG.sync.write(diff).toString('base64'), 'base64:image/png');
            throw new Error('Images are not equal');
        }
    }
);
