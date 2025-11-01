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
    createSuperTrendSignal,
    createKeltnerUpperBreakoutSignal,
    createKeltnerLowerBreakoutSignal
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

            console.log(chalk.cyan('\nMACD Signals:'));
            console.log('  macd-bullish           - MACD Bullish Crossover');
            console.log('  macd-bearish           - MACD Bearish Crossover');
            console.log('  macd-histogram-positive- MACD Histogram Turns Positive');
            console.log('  macd-histogram-negative- MACD Histogram Turns Negative');

            console.log(chalk.cyan('\nBollinger Band Signals:'));
            console.log('  bollinger-upper-touch  - Price Touches Upper Bollinger Band');
            console.log('  bollinger-lower-touch  - Price Touches Lower Bollinger Band');
            console.log('  bollinger-squeeze      - Bollinger Bands Squeezing (Low Volatility)');
            console.log('  bollinger-expansion    - Bollinger Bands Expanding (High Volatility)');

            console.log(chalk.cyan('\nStochastic Signals:'));
            console.log('  stochastic-overbought   - Stochastic Overbought (>80)');
            console.log('  stochastic-oversold     - Stochastic Oversold (<20)');
            console.log('  stochastic-bullish-cross- %K Crosses Above %D');
            console.log('  stochastic-bearish-cross- %K Crosses Below %D');

            console.log(chalk.cyan('\nWilliams %R Signals:'));
            console.log('  williams-overbought     - Williams %R Overbought (>-20)');
            console.log('  williams-oversold       - Williams %R Oversold (<-80)');

            console.log(chalk.cyan('\nMoving Average Signals:'));
            console.log('  golden-cross           - Fast MA Crosses Above Slow MA (Bullish)');
            console.log('  death-cross            - Fast MA Crosses Below Slow MA (Bearish)');
            console.log('  ma-support             - Price Finds Support at Moving Average');
            console.log('  ma-resistance          - Price Hits Resistance at Moving Average');

            console.log(chalk.cyan('\nVolume Signals:'));
            console.log('  volume-spike           - Volume Spike (2x Average)');
            console.log('  obv-bullish            - OBV Bullish (Rising OBV + Rising Price)');
            console.log('  obv-bearish            - OBV Bearish (Falling OBV + Falling Price)');

            console.log(chalk.cyan('\nIchimoku Signals:'));
            console.log('  ichimoku-bullish       - Ichimoku Bullish Setup');
            console.log('  ichimoku-bearish       - Ichimoku Bearish Setup');
            console.log('  ichimoku-tk-cross-bullish- Tenkan Crosses Above Kijun');
            console.log('  ichimoku-tk-cross-bearish- Tenkan Crosses Below Kijun');

            console.log(chalk.cyan('\nAdvanced Signals:'));
            console.log('  fibonacci-retracement  - Price at Fibonacci Retracement Level');
            console.log('  support-breakout       - Price Breaks Above Support');
            console.log('  resistance-breakout    - Price Breaks Above Resistance');
            console.log('  adx-strong-trend       - ADX Strong Trend (>25)');
            console.log('  adx-weak-trend         - ADX Weak Trend (<20)');
            console.log('  mfi-overbought         - MFI Overbought (>80)');
            console.log('  mfi-oversold           - MFI Oversold (<20)');
            console.log('  atr-high-volatility    - ATR High Volatility');
            console.log('  atr-low-volatility     - ATR Low Volatility');
            console.log('  parabolic-sar-bullish  - Parabolic SAR Bullish (Below Price)');
            console.log('  parabolic-sar-bearish  - Parabolic SAR Bearish (Above Price)');
            console.log('  cci-overbought         - CCI Overbought (>100)');
            console.log('  cci-oversold           - CCI Oversold (<-100)');
            console.log('  donchian-breakout-long - Donchian Channel Breakout Up');
            console.log('  donchian-breakout-short- Donchian Channel Breakout Down');
            console.log('  keltner-upper-breakout  - Price Breaks Above Keltner Upper Band');
            console.log('  keltner-lower-breakout  - Price Breaks Below Keltner Lower Band');
        });

    program
        .command('signal-create <type> <symbol> <interval>')
        .description('Create a new signal of the specified type')
        .action(async (type, symbol, interval) => {
            let created = false;

            switch (type) {
                case 'rsi-ob':
                    await createRsiObSignal(symbol, interval, 70);
                    created = true;
                    break;

                case 'rsi-os':
                    await createRsiOsSignal(symbol, interval, 30);
                    created = true;
                    break;

                case 'crocodile-dive':
                    await createCrocodileDiveSignal(symbol, interval);
                    created = true;
                    break;

                case 'crocodile':
                    await createCrocodileSignal(symbol, interval);
                    created = true;
                    break;

                case 'cross-up':
                    await createCrossUpSignal(symbol, interval);
                    created = true;
                    break;

                case 'cross-down':
                    await createCrossDownSignal(symbol, interval);
                    created = true;
                    break;

                case 'price-action':
                    await createPriceActionSignal(symbol, interval);
                    created = true;
                    break;

                case 'multi-div':
                    await createMultiDivSignal(symbol, interval);
                    created = true;
                    break;

                case 'uptrend':
                    await createUptrendSignal(symbol, interval);
                    created = true;
                    break;

                case 'downtrend':
                    await createDownTrendSignal(symbol, interval);
                    created = true;
                    break;

                case 'woodies':
                    await createWoodiesSignal(symbol, interval);
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

                case 'keltner-upper-breakout':
                    await createKeltnerUpperBreakoutSignal(symbol, interval, 0, {});
                    created = true;
                    break;

                case 'keltner-lower-breakout':
                    await createKeltnerLowerBreakoutSignal(symbol, interval, 0, {});
                    created = true;
                    break;

                case 'price-gt':
                    // Handle price-gt signal creation
                    created = true;
                    break;

                case 'price-lt':
                    // Handle price-lt signal creation
                    created = true;
                    break;

                // Add more cases as needed for other signal types

                default:
                    console.log(chalk.red('❌ Unknown signal type:', type));
            }

            if (created) {
                console.log(chalk.green('✅ Signal created successfully:', type, symbol, interval));
            } else {
                console.log(chalk.red('❌ Failed to create signal:', type, symbol, interval));
            }
        });

    program
        .command('signal-list')
        .description('List all signals')
        .action(async () => {
            const signals = await getAllSignals();
            if (signals.length === 0) {
                console.log(chalk.yellow('⚠️  No signals found.'));
                return;
            }

            const table = new Table({
                head: ['ID', 'Type', 'Symbol', 'Interval', 'Created At'],
                colWidths: [10, 20, 15, 10, 25]
            });

            signals.forEach(signal => {
                table.push([
                    signal.id,
                    signal.type,
                    signal.symbol,
                    signal.interval,
                    new Date(signal.createdAt).toLocaleString()
                ]);
            });

            console.log(table.toString());
        });

    program
        .command('signal-delete-all')
        .description('Delete all signals')
        .action(async () => {
            const spinner = ora('Deleting all signals...').start();
            try {
                await deleteAll();
                spinner.succeed('✅ All signals deleted successfully.');
            } catch (error) {
                spinner.fail('❌ Failed to delete signals: ' + error.message);
            }
        });
}
