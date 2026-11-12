import { DataTable, Then } from '@cucumber/cucumber';
import { type MemoryValue } from '@qavajs/core';
import { compare, parseOptions } from '../../src/visual';

async function expectFailure(run: () => Promise<unknown>, message: string) {
    try {
        await run();
    } catch (e) {
        const actualMessage = (e as Error).message;
        if (!actualMessage.includes(message)) {
            throw new Error(`Expected error to contain '${message}', got '${actualMessage}'`);
        }
        return;
    }
    throw new Error(`Expected step to fail with '${message}', but it passed`);
}

Then('I expect comparing {value} to {value} to fail with {string}',
    async function (actual: MemoryValue, expected: MemoryValue, message: string) {
        await expectFailure(() => compare(this, actual, expected), message);
    }
);

Then('I expect comparing {value} to {value} to fail with {string}:',
    async function (actual: MemoryValue, expected: MemoryValue, message: string, dataTable: DataTable) {
        await expectFailure(async () => {
            const options = await parseOptions(dataTable.rowsHash(), value => this.getValue(value));
            await compare(this, actual, expected, options);
        }, message);
    }
);
