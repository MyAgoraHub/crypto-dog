import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import { getTickers } from '../core/clients/cryptoDogRequestHandler.js';

export function registerTickersCommand(program) {
    program
        .command('tickers')
        .description('Get ticker data for a symbol')
        .requiredOption('-c, --category <category>', 'Market category (spot, linear, inverse, option)')
        .option('-s, --symbol <symbol>', 'Trading symbol (e.g., BTCUSDT)')
        .action(async (options) => {
            const spinner = ora('Fetching ticker data...').start();
            try {
                const tickers = await getTickers(options.category, options.symbol);
                spinner.succeed('Ticker data fetched successfully!');

                const table = new Table({
                    head: [chalk.cyan('Symbol'), chalk.cyan('Last Price'), chalk.cyan('24h Change'), chalk.cyan('24h Volume')],
                    colWidths: [15, 15, 15, 20]
                });

                if (tickers.result && tickers.result.list) {
                    tickers.result.list.slice(0, 10).forEach(ticker => {
                        const change = parseFloat(ticker.price24hPcnt || 0) * 100;
                        const changeColor = change >= 0 ? chalk.green : chalk.red;
                        table.push([
                            ticker.symbol,
                            ticker.lastPrice,
                            changeColor(`${change.toFixed(2)}%`),
                            ticker.volume24h
                        ]);
                    });
                }

                console.log(chalk.green('\n💰 Ticker Data:\n'));
                console.log(table.toString());
            } catch (error) {
                spinner.fail('Failed to fetch ticker data');
                console.error(chalk.red(error.message));
            }
        });
}
