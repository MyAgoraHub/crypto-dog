import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import {
    createRsiObSignal,
    createRsiOsSignal,
    createCrocodileDiveSignal,
    createCrocodileSignal,
    createCrossUpSignal,
    createCrossDownSignal,
    createPriceActionSignal,
    createMultiDivSignal,
    createUptrendSignal,
    createDownTrendSignal,
    createWoodiesSignal,
    createSuperTrendSignal
} from '../core/cryptoDogSignalManager.js';
import { getAllSignals, deleteAll } from '../core/repository/dbManager.js';

export function registerSignalCommands(program) {
    program
        .command('signal-types')
        .description('List all available signal types')
        .action(() => {
            console.log(chalk.green('\n📋 Available Signal Types:\n'));
            console.log(chalk.cyan('Indicator-Based Signals:'));
            console.log('  rsi-ob          - RSI Overbought (requires --value, e.g., 70)');
            console.log('  rsi-os          - RSI Oversold (requires --value, e.g., 30)');
            console.log('  crocodile-dive  - Crocodile Dive (Bearish EMA pattern)');
            console.log('  crocodile       - Crocodile (Bullish EMA pattern)');
            console.log('  cross-up        - EMA Cross Up');
            console.log('  cross-down      - EMA Cross Down');
            console.log('  multi-div       - Multi Divergence Detector');
            console.log('  uptrend         - Uptrend Signal');
            console.log('  downtrend       - Downtrend Signal');
            console.log('  woodies         - Woodies Pivot Signal');
            console.log('  supertrend-long - SuperTrend Long');
            console.log('  supertrend-short- SuperTrend Short');

            console.log(chalk.cyan('\nPrice Action Signals:'));
            console.log('  price-gt        - Price Greater Than (requires --value)');
            console.log('  price-lt        - Price Less Than (requires --value)');
            console.log('  price-gte       - Price Greater Than or Equal (requires --value)');
            console.log('  price-lte       - Price Less Than or Equal (requires --value)');
            console.log('  price-eq        - Price Equal (requires --value)');

            console.log(chalk.green('\n💡 Example Usage:'));
            console.log(chalk.gray('  crypto-dog create-signal -s BTCUSDT -i 1h -t rsi-ob -v 70'));
            console.log(chalk.gray('  crypto-dog create-signal -s ETHUSDT -i 15m -t cross-up'));
            console.log(chalk.gray('  crypto-dog create-signal -s ADAUSDT -i 5m -t price-gt -v 0.5\n'));
        });

    program
        .command('create-signal')
        .description('Create a new trading signal')
        .requiredOption('-s, --symbol <symbol>', 'Trading symbol (e.g., BTCUSDT)')
        .requiredOption('-i, --interval <interval>', 'Time interval (e.g., 1m, 5m, 15m, 1h, 4h)')
        .requiredOption('-t, --type <type>', 'Signal type (use "crypto-dog signal-types" to list)')
        .option('-v, --value <value>', 'Signal value (for RSI, price action, etc.)')
        .option('-m, --max-triggers <number>', 'Max trigger times', '3')
        .action(async (options) => {
            const spinner = ora('Creating signal...').start();

            try {
                const symbol = options.symbol.toUpperCase();
                const interval = options.interval;
                const maxTriggers = parseInt(options.maxTriggers);
                const value = options.value ? parseFloat(options.value) : 0;

                let created = false;

                switch (options.type.toLowerCase()) {
                    case 'rsi-ob':
                        if (!options.value) throw new Error('--value required for RSI Overbought (e.g., 70)');
                        await createRsiObSignal(symbol, interval, value, {});
                        created = true;
                        break;

                    case 'rsi-os':
                        if (!options.value) throw new Error('--value required for RSI Oversold (e.g., 30)');
                        await createRsiOsSignal(symbol, interval, value, {});
                        created = true;
                        break;

                    case 'crocodile-dive':
                        await createCrocodileDiveSignal(symbol, interval, 0, {});
                        created = true;
                        break;

                    case 'crocodile':
                        await createCrocodileSignal(symbol, interval, 0, {});
                        created = true;
                        break;

                    case 'cross-up':
                        await createCrossUpSignal(symbol, interval, 0, { period: 200 });
                        created = true;
                        break;

                    case 'cross-down':
                        await createCrossDownSignal(symbol, interval, 0, { period: 200 });
                        created = true;
                        break;

                    case 'multi-div':
                        await createMultiDivSignal(symbol, interval, 0, {});
                        created = true;
                        break;

                    case 'uptrend':
                        await createUptrendSignal(symbol, interval, 0, {});
                        created = true;
                        break;

                    case 'downtrend':
                        await createDownTrendSignal(symbol, interval, 0, {});
                        created = true;
                        break;

                    case 'woodies':
                        await createWoodiesSignal(symbol, interval, 0, {});
                        created = true;
                        break;

                    case 'supertrend-long':
                        await createSuperTrendSignal(symbol, interval, 'long', {});
                        created = true;
                        break;

                    case 'supertrend-short':
                        await createSuperTrendSignal(symbol, interval, 'short', {});
                        created = true;
                        break;

                    case 'price-gt':
                        if (!options.value) throw new Error('--value required for price-gt');
                        await createPriceActionSignal(symbol, interval, value, 'gt');
                        created = true;
                        break;

                    case 'price-lt':
                        if (!options.value) throw new Error('--value required for price-lt');
                        await createPriceActionSignal(symbol, interval, value, 'lt');
                        created = true;
                        break;

                    case 'price-gte':
                        if (!options.value) throw new Error('--value required for price-gte');
                        await createPriceActionSignal(symbol, interval, value, 'gte');
                        created = true;
                        break;

                    case 'price-lte':
                        if (!options.value) throw new Error('--value required for price-lte');
                        await createPriceActionSignal(symbol, interval, value, 'lte');
                        created = true;
                        break;

                    case 'price-eq':
                        if (!options.value) throw new Error('--value required for price-eq');
                        await createPriceActionSignal(symbol, interval, value, 'eq');
                        created = true;
                        break;

                    default:
                        throw new Error(`Unknown signal type: ${options.type}. Use --list-types to see available types.`);
                }

                if (created) {
                    spinner.succeed(chalk.green(`✓ Signal created successfully!`));
                    console.log(chalk.cyan(`  Symbol: ${symbol}`));
                    console.log(chalk.cyan(`  Interval: ${interval}`));
                    console.log(chalk.cyan(`  Type: ${options.type}`));
                    if (options.value) console.log(chalk.cyan(`  Value: ${value}`));
                    console.log(chalk.cyan(`  Max Triggers: ${maxTriggers}\n`));
                }
            } catch (error) {
                spinner.fail('Failed to create signal');
                console.error(chalk.red(error.message));
            }
        });

    program
        .command('list-signals')
        .description('List all configured signals')
        .option('-a, --active', 'Show only active signals')
        .option('-t, --triggered', 'Show only triggered signals')
        .action(async (options) => {
            const spinner = ora('Fetching signals...').start();

            try {
                let signals = await getAllSignals();

                if (options.active) {
                    signals = signals.filter(s => s.isActive);
                }

                if (options.triggered) {
                    signals = signals.filter(s => s.triggerCount > 0);
                }

                spinner.succeed(`Found ${signals.length} signal(s)`);

                if (signals.length === 0) {
                    console.log(chalk.yellow('\nNo signals found. Create one with: crypto-dog create-signal\n'));
                    return;
                }

                const table = new Table({
                    head: [
                        chalk.cyan('Symbol'),
                        chalk.cyan('Interval'),
                        chalk.cyan('Type'),
                        chalk.cyan('Triggers'),
                        chalk.cyan('Status')
                    ],
                    colWidths: [12, 10, 30, 12, 10]
                });

                signals.forEach(signal => {
                    const statusColor = signal.isActive ? chalk.green : chalk.gray;
                    const triggerColor = signal.triggerCount > 0 ? chalk.yellow : chalk.gray;

                    table.push([
                        signal.symbol,
                        signal.timeframe,
                        signal.signalType,
                        triggerColor(`${signal.triggerCount}/${signal.maxTriggerTimes}`),
                        statusColor(signal.isActive ? 'Active' : 'Inactive')
                    ]);
                });

                console.log(chalk.green('\n📊 Configured Signals:\n'));
                console.log(table.toString());
                console.log('');
            } catch (error) {
                spinner.fail('Failed to fetch signals');
                console.error(chalk.red(error.message));
            }
        });

    program
        .command('clear-signals')
        .description('Delete all signals from database')
        .option('-y, --yes', 'Skip confirmation')
        .action(async (options) => {
            if (!options.yes) {
                console.log(chalk.yellow('\n⚠️  This will delete ALL signals. Use --yes to confirm.\n'));
                return;
            }

            const spinner = ora('Deleting all signals...').start();

            try {
                await deleteAll();
                spinner.succeed(chalk.green('✓ All signals deleted successfully!\n'));
            } catch (error) {
                spinner.fail('Failed to delete signals');
                console.error(chalk.red(error.message));
            }
        });
}
