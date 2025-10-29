import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import { backtestSignal } from '../core/cryptoDogBacktest.js';

function mapTypeToSignalType(type) {
    const signalTypes = {
        'rsi-ob': 'INDICATOR_RsiObSignal',
        'rsi-os': 'INDICATOR_RsiOsSignal',
        'crocodile-dive': 'INDICATOR_CrocodileDiveSignal',
        'crocodile': 'INDICATOR_CrocodileSignal',
        'cross-up': 'INDICATOR_CrossUpSignal',
        'cross-down': 'INDICATOR_CrossDownSignal',
        'multi-div': 'INDICATOR_DivergenceDetector',
        'uptrend': 'INDICATOR_UptrendSignal',
        'downtrend': 'INDICATOR_DownTrendSignal',
        'woodies': 'INDICATOR_Woodies',
        'supertrend-long': 'INDICATOR_SuperTrendSignal',
        'supertrend-short': 'INDICATOR_SuperTrendSignal',
        'price-gt': 'PRICE_ACTION_GT',
        'price-lt': 'PRICE_ACTION_LT',
        'price-gte': 'PRICE_ACTION_GTE',
        'price-lte': 'PRICE_ACTION_LTE',
        'price-eq': 'PRICE_ACTION_EQ'
    };
    return signalTypes[type] || type;
}

function getIndicatorForType(type) {
    const indicators = {
        'rsi-ob': 'RsiIndicator',
        'rsi-os': 'RsiIndicator',
        'crocodile-dive': 'ema',
        'crocodile': 'ema',
        'cross-up': 'ema',
        'cross-down': 'ema',
        'multi-div': 'divergence',
        'uptrend': 'trend',
        'downtrend': 'trend',
        'woodies': 'pivot',
        'supertrend-long': 'SuperTrendIndicator',
        'supertrend-short': 'SuperTrendIndicator',
        'price-gt': 'price',
        'price-lt': 'price',
        'price-gte': 'price',
        'price-lte': 'price',
        'price-eq': 'price'
    };
    return indicators[type] || 'unknown';
}

function getEvaluateFunctionForType(type) {
    // Return the string representation of the evaluation function
    // These match the functions in cryptoDogSignalAgent.js
    const evaluateFunctions = {
        'rsi-ob': `(data, model) => { return { signal: data.value > model.value, data:data }; }`,
        'rsi-os': `(data, model) => { return { signal: data.value < model.value, data:data }; }`,
        'crocodile-dive': `(data, model) => { return { signal: data.ema1 < data.ema2 && data.ema2 < data.ema3, data:data }; }`,
        'crocodile': `(data, model) => { return { signal: data.ema1 > data.ema2 && data.ema2 > data.ema3, data:data }; }`,
        'cross-up': `(data, model) => { return { signal: data.all.every(element => element < data.current), data:data }; }`,
        'cross-down': `(data, model) => { return { signal: data.all.every(element => element > data.current), data:data }; }`,
        'multi-div': `(data, model) => { return { signal: data.hasDivergence === true, divergence: data.divergence || [], data:data }; }`,
        'uptrend': `(data, model) => { return { signal: data.data > 0, data:data }; }`,
        'downtrend': `(data, model) => { return { signal: data.data < 0, data:data }; }`,
        'woodies': `(data, model) => { return { signal: true, data:data }; }`, // Woodies always signals when conditions met
        'supertrend-long': `(data, model) => { return { signal: data.trend === 'long' || data.trend === 'uptrend', trend: data.trend, data:data }; }`,
        'supertrend-short': `(data, model) => { return { signal: data.trend === 'short' || data.trend === 'downtrend', trend: data.trend, data:data }; }`,
        'price-gt': `(data, model) => { return { signal: data.value > model.value, data:data }; }`,
        'price-lt': `(data, model) => { return { signal: data.value < model.value, data:data }; }`,
        'price-gte': `(data, model) => { return { signal: data.value >= model.value, data:data }; }`,
        'price-lte': `(data, model) => { return { signal: data.value <= model.value, data:data }; }`,
        'price-eq': `(data, model) => { return { signal: data.value === model.value, data:data }; }`
    };
    
    return evaluateFunctions[type] || `(data, model) => { return { signal: false, data:data }; }`;
}

export function registerBacktestCommand(program) {
    program
        .command('backtest')
        .description('Backtest a signal strategy against historical data')
        .requiredOption('-s, --symbol <symbol>', 'Trading symbol (e.g., BTCUSDT)')
        .requiredOption('-i, --interval <interval>', 'Time interval (e.g., 1m, 5m, 15m, 1h, 4h)')
        .requiredOption('-t, --type <type>', 'Signal type (use "crypto-dog signal-types" to list)')
        .option('-v, --value <value>', 'Signal value (for RSI, price action, etc.)')
        .option('--iterations <number>', 'Number of historical data pulls', '10')
        .option('--candles <number>', 'Candles per pull', '200')
        .option('--risk <percent>', 'Risk per trade (%)', '2')
        .option('--reward <percent>', 'Reward per trade (%)', '5')
        .option('--capital <amount>', 'Initial capital', '10000')
        .option('--show-trades', 'Show all trade details')
        .addHelpText('after', `
${chalk.cyan('Examples:')}

  ${chalk.gray('# RSI Strategies')}
  ${chalk.yellow('crypto-dog backtest -s BTCUSDT -i 1h -t rsi-os -v 30')}
  ${chalk.gray('  → Long when RSI < 30 (oversold)')}

  ${chalk.yellow('crypto-dog backtest -s ETHUSDT -i 4h -t rsi-ob -v 70')}
  ${chalk.gray('  → Short when RSI > 70 (overbought)')}

  ${chalk.gray('# SuperTrend Strategies')}
  ${chalk.yellow('crypto-dog backtest -s BTCUSDT -i 15m -t supertrend-long')}
  ${chalk.gray('  → Long positions when SuperTrend shows uptrend')}

  ${chalk.yellow('crypto-dog backtest -s ADAUSDT -i 1h -t supertrend-short')}
  ${chalk.gray('  → Short positions when SuperTrend shows downtrend')}

  ${chalk.gray('# Price Action Strategies')}
  ${chalk.yellow('crypto-dog backtest -s BTCUSDT -i 5m -t price-gt -v 50000')}
  ${chalk.gray('  → Long when price breaks above $50,000')}

  ${chalk.yellow('crypto-dog backtest -s ETHUSDT -i 15m -t price-lt -v 3000')}
  ${chalk.gray('  → Short when price falls below $3,000')}

  ${chalk.gray('# Pattern Recognition')}
  ${chalk.yellow('crypto-dog backtest -s SOLUSDT -i 4h -t crocodile')}
  ${chalk.gray('  → Long on bullish EMA pattern (EMA1 > EMA2 > EMA3)')}

  ${chalk.yellow('crypto-dog backtest -s BNBUSDT -i 1h -t crocodile-dive')}
  ${chalk.gray('  → Short on bearish EMA pattern (EMA1 < EMA2 < EMA3)')}

  ${chalk.yellow('crypto-dog backtest -s BTCUSDT -i 15m -t cross-up')}
  ${chalk.gray('  → Long on EMA crossover (bullish cross)')}

  ${chalk.gray('# Divergence Detection')}
  ${chalk.yellow('crypto-dog backtest -s BTCUSDT -i 4h -t multi-div')}
  ${chalk.gray('  → Detects bullish/bearish divergences across RSI, MACD, Stochastic')}

  ${chalk.yellow('crypto-dog backtest -s ETHUSDT -i 1h -t woodies')}
  ${chalk.gray('  → Pivot point support/resistance levels')}

  ${chalk.gray('# Advanced Setups')}
  ${chalk.yellow('crypto-dog backtest -s BTCUSDT -i 1h -t rsi-os -v 25 --risk 1.5 --reward 6 --capital 50000')}
  ${chalk.gray('  → RSI strategy with 1:4 risk/reward ratio and $50k capital')}

  ${chalk.yellow('crypto-dog backtest -s ETHUSDT -i 4h -t supertrend-long --iterations 20 --show-trades')}
  ${chalk.gray('  → SuperTrend with more historical data + full trade log')}

  ${chalk.gray('# Quick Tests (fewer iterations for faster results)')}
  ${chalk.yellow('crypto-dog backtest -s ADAUSDT -i 15m -t rsi-os -v 30 --iterations 3')}
  ${chalk.gray('  → Quick backtest with 600 candles')}

${chalk.cyan('Notes:')}
  • ${chalk.gray('supertrend-long')} = Enters LONG when SuperTrend indicator trend = 'long'
  • ${chalk.gray('supertrend-short')} = Enters SHORT when SuperTrend indicator trend = 'short'
  • Default risk/reward is 2%/5% (2.5:1 ratio)
  • Use --iterations to control data amount (more = longer test period)
  • Use --show-trades to see every individual trade
    `)
        .action(async (options) => {
            const spinner = ora('Preparing backtest...').start();

            try {
                spinner.text = 'Fetching historical data...';

                const symbol = options.symbol.toUpperCase();
                const interval = options.interval;
                const risk = parseFloat(options.risk);
                const reward = parseFloat(options.reward);
                const capital = parseFloat(options.capital);
                const iterations = parseInt(options.iterations);
                const candles = parseInt(options.candles);

                // Determine signal value based on type
                let value;
                if (options.type === 'supertrend-long') {
                    value = 'long';
                } else if (options.type === 'supertrend-short') {
                    value = 'short';
                } else if (options.value) {
                    value = parseFloat(options.value);
                } else {
                    value = 0;
                }

                // Create temporary signal for backtesting
                const signalType = mapTypeToSignalType(options.type);
                const indicator = getIndicatorForType(options.type);
                const evaluate = getEvaluateFunctionForType(options.type);

                const signal = {
                    symbol,
                    timeframe: interval,
                    signalType,
                    indicator,
                    value,
                    evaluate,
                    indicatorArgs: options.type === 'cross-up' || options.type === 'cross-down' ? { period: 200 } : {}
                };

                spinner.text = 'Running backtest simulation...';
                const results = await backtestSignal(signal, iterations, candles, risk, reward, capital);

                spinner.succeed('Backtest completed!');

                // Display results
                console.log(chalk.green('\n📊 BACKTEST RESULTS\n'));
                console.log(chalk.cyan('Signal Configuration:'));
                console.log(`  Symbol: ${results.signal.symbol}`);
                console.log(`  Timeframe: ${results.signal.timeframe}`);
                console.log(`  Type: ${results.signal.type}`);
                if (options.value) console.log(`  Value: ${value}`);

                console.log(chalk.cyan('\nTest Period:'));
                console.log(`  Start: ${results.period.start}`);
                console.log(`  End: ${results.period.end}`);
                console.log(`  Candles Analyzed: ${results.period.candles}`);
                console.log(`  Data Points: ${iterations} iterations × ${candles} candles`);

                console.log(chalk.cyan('\nPerformance:'));
                const profitColor = parseFloat(results.performance.returnPercent) >= 0 ? chalk.green : chalk.red;
                console.log(`  Initial Capital: $${results.performance.initialCapital}`);
                console.log(`  Final Capital: ${profitColor('$' + results.performance.finalCapital)}`);
                console.log(`  Net Profit: ${profitColor(results.performance.netProfit >= 0 ? '+' : '')}${profitColor('$' + results.performance.netProfit)}`);
                console.log(`  Return: ${profitColor(results.performance.returnPercent + '%')}`);
                console.log(`  Max Drawdown: ${chalk.red(results.performance.maxDrawdown + '%')}`);

                console.log(chalk.cyan('\nTrade Statistics:'));
                const winRateColor = parseFloat(results.trades.winRate) >= 50 ? chalk.green : chalk.red;
                console.log(`  Total Trades: ${results.trades.total}`);
                console.log(`  Wins: ${chalk.green(results.trades.wins)}`);
                console.log(`  Losses: ${chalk.red(results.trades.losses)}`);
                console.log(`  Win Rate: ${winRateColor(results.trades.winRate + '%')}`);
                console.log(`  Avg Win: ${chalk.green('$' + results.trades.avgWin)}`);
                console.log(`  Avg Loss: ${chalk.red('$' + results.trades.avgLoss)}`);
                console.log(`  Profit Factor: ${results.trades.profitFactor}`);

                if (options.showTrades && results.tradeHistory.length > 0) {
                    console.log(chalk.cyan('\n📈 Trade History:\n'));

                    const table = new Table({
                        head: [
                            chalk.cyan('Entry'),
                            chalk.cyan('Position'),
                            chalk.cyan('Entry Price'),
                            chalk.cyan('Exit Price'),
                            chalk.cyan('Exit Reason'),
                            chalk.cyan('P/L %'),
                            chalk.cyan('P/L $')
                        ],
                        colWidths: [20, 10, 12, 12, 15, 10, 12]
                    });

                    results.tradeHistory.forEach(trade => {
                        const plColor = parseFloat(trade.profitLoss) >= 0 ? chalk.green : chalk.red;
                        table.push([
                            trade.entry.timestamp.slice(0, 19).replace('T', ' '),
                            trade.entry.position,
                            trade.entry.price.toFixed(2),
                            trade.exit.price.toFixed(2),
                            trade.exit.reason,
                            plColor(trade.profitLossPercent + '%'),
                            plColor((parseFloat(trade.profitLoss) >= 0 ? '+' : '') + '$' + trade.profitLoss)
                        ]);
                    });

                    console.log(table.toString());
                }

                console.log('');
            } catch (error) {
                spinner.fail('Backtest failed');
                console.error(chalk.red(error.message));
                console.error(error.stack);
            }
        });
}
