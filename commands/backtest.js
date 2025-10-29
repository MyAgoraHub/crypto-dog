import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import { backtestSignal } from '../core/cryptoDogBacktest.js';
import { signalAgent } from '../core/cryptoDogSignalAgent.js';

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
        'price-eq': 'PRICE_ACTION_EQ',
        // MACD Signals
        'macd-bullish': 'INDICATOR_MacdBullishSignal',
        'macd-bearish': 'INDICATOR_MacdBearishSignal',
        // Bollinger Band Signals
        'bollinger-upper-touch': 'INDICATOR_BollingerUpperTouchSignal',
        'bollinger-lower-touch': 'INDICATOR_BollingerLowerTouchSignal',
        // Stochastic Signals
        'stochastic-overbought': 'INDICATOR_StochasticOverboughtSignal',
        'stochastic-oversold': 'INDICATOR_StochasticOversoldSignal',
        // Williams %R Signals
        'williams-overbought': 'INDICATOR_WilliamsOverboughtSignal',
        'williams-oversold': 'INDICATOR_WilliamsOversoldSignal',
        // Moving Average Signals
        'golden-cross': 'INDICATOR_GoldenCrossSignal',
        'death-cross': 'INDICATOR_DeathCrossSignal',
        // Volume Signals
        'volume-spike': 'INDICATOR_VolumeSpikeSignal',
        // Ichimoku Signals
        'ichimoku-bullish': 'INDICATOR_IchimokuBullishSignal',
        'ichimoku-bearish': 'INDICATOR_IchimokuBearishSignal',
        // ADX Signals
        'adx-strong-trend': 'INDICATOR_AdxStrongTrendSignal',
        // MFI Signals
        'mfi-overbought': 'INDICATOR_MfiOverboughtSignal',
        'mfi-oversold': 'INDICATOR_MfiOversoldSignal',
        // ATR Signals
        'atr-high-volatility': 'INDICATOR_AtrHighVolatilitySignal',
        // Parabolic SAR Signals
        'parabolic-sar-bullish': 'INDICATOR_ParabolicSarBullishSignal',
        'parabolic-sar-bearish': 'INDICATOR_ParabolicSarBearishSignal',
        // CCI Signals
        'cci-overbought': 'INDICATOR_CciOverboughtSignal',
        'cci-oversold': 'INDICATOR_CciOversoldSignal',
        // MACD Histogram Signals
        'macd-histogram-positive': 'INDICATOR_MacdHistogramPositiveSignal',
        'macd-histogram-negative': 'INDICATOR_MacdHistogramNegativeSignal',
        // Bollinger Advanced Signals
        'bollinger-squeeze': 'INDICATOR_BollingerSqueezeSignal',
        'bollinger-expansion': 'INDICATOR_BollingerExpansionSignal',
        // Stochastic Cross Signals
        'stochastic-bullish-cross': 'INDICATOR_StochasticBullishCrossSignal',
        'stochastic-bearish-cross': 'INDICATOR_StochasticBearishCrossSignal',
        // Moving Average Advanced Signals
        'ma-support': 'INDICATOR_MaSupportSignal',
        'ma-resistance': 'INDICATOR_MaResistanceSignal',
        // Volume Advanced Signals
        'obv-bullish': 'INDICATOR_ObvBullishSignal',
        'obv-bearish': 'INDICATOR_ObvBearishSignal',
        // Ichimoku Advanced Signals
        'ichimoku-tk-cross-bullish': 'INDICATOR_IchimokuTkCrossBullishSignal',
        'ichimoku-tk-cross-bearish': 'INDICATOR_IchimokuTkCrossBearishSignal',
        // Advanced Signals
        'fibonacci-retracement': 'INDICATOR_FibonacciRetracementSignal',
        'support-breakout': 'INDICATOR_SupportBreakoutSignal',
        'resistance-breakout': 'INDICATOR_ResistanceBreakoutSignal',
        'adx-weak-trend': 'INDICATOR_AdxWeakTrendSignal',
        'tema-bullish': 'INDICATOR_TemaBullishSignal',
        'tema-bearish': 'INDICATOR_TemaBearishSignal',
        'keltner-upper-breakout': 'INDICATOR_KeltnerUpperBreakoutSignal',
        'keltner-lower-breakout': 'INDICATOR_KeltnerLowerBreakoutSignal',
        'donchian-upper-breakout': 'INDICATOR_DonchianUpperBreakoutSignal',
        'donchian-lower-breakout': 'INDICATOR_DonchianLowerBreakoutSignal',
        'elder-impulse-bull': 'INDICATOR_ElderImpulseBullSignal',
        'elder-impulse-bear': 'INDICATOR_ElderImpulseBearSignal',
        'elder-impulse-blue': 'INDICATOR_ElderImpulseBlueSignal'
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
        'price-eq': 'price',
        // MACD Signals
        'macd-bullish': 'MacdIndicator',
        'macd-bearish': 'MacdIndicator',
        // Bollinger Band Signals
        'bollinger-upper-touch': 'BollingerIndicator',
        'bollinger-lower-touch': 'BollingerIndicator',
        // Stochastic Signals
        'stochastic-overbought': 'StochasticIndicator',
        'stochastic-oversold': 'StochasticIndicator',
        // Williams %R Signals
        'williams-overbought': 'WilliamsRIndicator',
        'williams-oversold': 'WilliamsRIndicator',
        // Moving Average Signals
        'golden-cross': 'EMAIndicator',
        'death-cross': 'EMAIndicator',
        // Volume Signals
        'volume-spike': 'ObvIndicator',
        // Ichimoku Signals
        'ichimoku-bullish': 'IchimokuCloudIndicator',
        'ichimoku-bearish': 'IchimokuCloudIndicator',
        // ADX Signals
        'adx-strong-trend': 'AdxIndicator',
        // MFI Signals
        'mfi-overbought': 'MfiIndicator',
        'mfi-oversold': 'MfiIndicator',
        // ATR Signals
        'atr-high-volatility': 'AtrIndicator',
        // Parabolic SAR Signals
        'parabolic-sar-bullish': 'PsarIndicator',
        'parabolic-sar-bearish': 'PsarIndicator',
        // CCI Signals
        'cci-overbought': 'CciIndicator',
        'cci-oversold': 'CciIndicator',
        // MACD Histogram Signals
        'macd-histogram-positive': 'MacdIndicator',
        'macd-histogram-negative': 'MacdIndicator',
        // Bollinger Advanced Signals
        'bollinger-squeeze': 'BollingerIndicator',
        'bollinger-expansion': 'BollingerIndicator',
        // Stochastic Cross Signals
        'stochastic-bullish-cross': 'StochasticIndicator',
        'stochastic-bearish-cross': 'StochasticIndicator',
        // Moving Average Advanced Signals
        'ma-support': 'EMAIndicator',
        'ma-resistance': 'EMAIndicator',
        // Volume Advanced Signals
        'obv-bullish': 'ObvIndicator',
        'obv-bearish': 'ObvIndicator',
        // Ichimoku Advanced Signals
        'ichimoku-tk-cross-bullish': 'IchimokuCloudIndicator',
        'ichimoku-tk-cross-bearish': 'IchimokuCloudIndicator',
        // Advanced Signals
        'fibonacci-retracement': 'price', // Uses price data
        'support-breakout': 'SupportAndResistance', // Custom indicator
        'resistance-breakout': 'SupportAndResistance', // Custom indicator
        'adx-weak-trend': 'AdxIndicator',
        'tema-bullish': 'TrixIndicator', // TEMA is Triple EMA, using TRIX as approximation
        'tema-bearish': 'TrixIndicator', // TEMA is Triple EMA, using TRIX as approximation
        'keltner-upper-breakout': 'AtrIndicator', // Keltner uses ATR
        'keltner-lower-breakout': 'AtrIndicator', // Keltner uses ATR
        'donchian-upper-breakout': 'price', // Donchian uses price highs/lows
        'donchian-lower-breakout': 'price', // Donchian uses price highs/lows
        'elder-impulse-bull': 'MacdIndicator', // Elder Impulse uses MACD + EMAs
        'elder-impulse-bear': 'MacdIndicator', // Elder Impulse uses MACD + EMAs
        'elder-impulse-blue': 'MacdIndicator' // Elder Impulse uses MACD + EMAs
    };
    return indicators[type] || 'unknown';
}

function getEvaluateFunctionForType(type) {
    // Return the string representation of the evaluation function from signalAgent
    // These match the functions in cryptoDogSignalAgent.js
    const evaluateFunctions = {
        'rsi-ob': `signalAgent.ob`,
        'rsi-os': `signalAgent.os`,
        'crocodile-dive': `signalAgent.crocodileDive`,
        'crocodile': `signalAgent.crocodile`,
        'cross-up': `signalAgent.crossOver`,
        'cross-down': `signalAgent.crossUnder`,
        'multi-div': `signalAgent.multiDiv`,
        'uptrend': `signalAgent.uptrendTrend`,
        'downtrend': `signalAgent.downTrend`,
        'woodies': `signalAgent.woodies`,
        'supertrend-long': `signalAgent.superTrend`,
        'supertrend-short': `signalAgent.superTrend`,
        'price-gt': `signalAgent.gt`,
        'price-lt': `signalAgent.lt`,
        'price-gte': `signalAgent.gte`,
        'price-lte': `signalAgent.lte`,
        'price-eq': `signalAgent.eq`,
        // MACD Signals
        'macd-bullish': `signalAgent.macdBullish`,
        'macd-bearish': `signalAgent.macdBearish`,
        // Bollinger Band Signals
        'bollinger-upper-touch': `signalAgent.bollingerUpperTouch`,
        'bollinger-lower-touch': `signalAgent.bollingerLowerTouch`,
        // Stochastic Signals
        'stochastic-overbought': `signalAgent.stochasticOverbought`,
        'stochastic-oversold': `signalAgent.stochasticOversold`,
        // Williams %R Signals
        'williams-overbought': `signalAgent.williamsOverbought`,
        'williams-oversold': `signalAgent.williamsOversold`,
        // Moving Average Signals
        'golden-cross': `signalAgent.goldenCross`,
        'death-cross': `signalAgent.deathCross`,
        // Volume Signals
        'volume-spike': `signalAgent.volumeSpike`,
        // Ichimoku Signals
        'ichimoku-bullish': `signalAgent.ichimokuBullish`,
        'ichimoku-bearish': `signalAgent.ichimokuBearish`,
        // ADX Signals
        'adx-strong-trend': `signalAgent.adxStrongTrend`,
        // MFI Signals
        'mfi-overbought': `signalAgent.mfiOverbought`,
        'mfi-oversold': `signalAgent.mfiOversold`,
        // ATR Signals
        'atr-high-volatility': `signalAgent.atrHighVolatility`,
        // Parabolic SAR Signals
        'parabolic-sar-bullish': `signalAgent.parabolicSarBullish`,
        'parabolic-sar-bearish': `signalAgent.parabolicSarBearish`,
        // CCI Signals
        'cci-overbought': `signalAgent.cciOverbought`,
        'cci-oversold': `signalAgent.cciOversold`,
        // MACD Histogram Signals
        'macd-histogram-positive': `signalAgent.macdHistogramPositive`,
        'macd-histogram-negative': `signalAgent.macdHistogramNegative`,
        // Bollinger Advanced Signals
        'bollinger-squeeze': `signalAgent.bollingerSqueeze`,
        'bollinger-expansion': `signalAgent.bollingerExpansion`,
        // Stochastic Cross Signals
        'stochastic-bullish-cross': `signalAgent.stochasticBullishCross`,
        'stochastic-bearish-cross': `signalAgent.stochasticBearishCross`,
        // Moving Average Advanced Signals
        'ma-support': `signalAgent.maSupport`,
        'ma-resistance': `signalAgent.maResistance`,
        // Volume Advanced Signals
        'obv-bullish': `signalAgent.obvBullish`,
        'obv-bearish': `signalAgent.obvBearish`,
        // Ichimoku Advanced Signals
        'ichimoku-tk-cross-bullish': `signalAgent.ichimokuTkCrossBullish`,
        'ichimoku-tk-cross-bearish': `signalAgent.ichimokuTkCrossBearish`,
        // Advanced Signals
        'fibonacci-retracement': `signalAgent.fibonacciRetracement`,
        'support-breakout': `signalAgent.supportBreakout`,
        'resistance-breakout': `signalAgent.resistanceBreakout`,
        'adx-weak-trend': `signalAgent.adxWeakTrend`,
        'tema-bullish': `signalAgent.temaBullish`,
        'tema-bearish': `signalAgent.temaBearish`,
        'keltner-upper-breakout': `signalAgent.keltnerUpperBreakout`,
        'keltner-lower-breakout': `signalAgent.keltnerLowerBreakout`,
        'donchian-upper-breakout': `signalAgent.donchianUpperBreakout`,
        'donchian-lower-breakout': `signalAgent.donchianLowerBreakout`,
        'elder-impulse-bull': `signalAgent.elderImpulseBull`,
        'elder-impulse-bear': `signalAgent.elderImpulseBear`,
        'elder-impulse-blue': `signalAgent.elderImpulseBlue`
    };
    
    return evaluateFunctions[type] || `signalAgent.gt`; // fallback
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
                const evaluateFuncName = getEvaluateFunctionForType(options.type);

                const signal = {
                    symbol,
                    timeframe: interval,
                    signalType,
                    indicator,
                    value,
                    evaluate: evaluateFuncName, // Store function name instead of string
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
