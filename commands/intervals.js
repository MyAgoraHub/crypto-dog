import chalk from 'chalk';
import Table from 'cli-table3';
import { getIntervals } from '../core/clients/cryptoDogRequestHandler.js';

export function registerIntervalsCommand(program) {
    program
        .command('intervals')
        .description('List all available trading intervals')
        .action(() => {
            const intervals = getIntervals();
            const table = new Table({
                head: [chalk.cyan('Key'), chalk.cyan('Value'), chalk.cyan('Label')],
                colWidths: [10, 10, 30]
            });

            Object.entries(intervals).forEach(([key, data]) => {
                table.push([key, data.value, data.label]);
            });

            console.log(chalk.green('\n📊 Available Intervals:\n'));
            console.log(table.toString());
        });
}
