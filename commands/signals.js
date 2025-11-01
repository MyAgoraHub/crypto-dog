import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import blessed from 'blessed';
import contrib from 'blessed-contrib';
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
    createKeltnerLowerBreakoutSignal,
    createIndicatorSignal
} from '../core/cryptoDogSignalManager.js';
import { signalAgent } from '../core/cryptoDogSignalAgent.js';
import { getAllSignals, deleteAll } from '../core/repository/dbManager.js';

async function showSignalSelector(options) {
    console.log(chalk.cyan(`\n🎯 Starting Interactive Signal Creation Selector`));
    console.log(chalk.gray(`Symbol: ${options.symbol} | Interval: ${options.interval}`));
    console.log(chalk.gray(`Press Ctrl+C to exit\n`));

    // Create blessed screen for signal selection
    const screen = blessed.screen({
        smartCSR: true,
        title: `CryptoDog Signal Creator - ${options.symbol}`
    });

    // Standard grid layout
    const gridRows = 12;
    const gridCols = 12;
    const headerRows = 2;
    const listRows = 8;
    const statusRows = 2;

    // Create grid layout for selection screen
    const grid = new contrib.grid({rows: gridRows, cols: gridCols, screen: screen});

    // Header
    const headerLog = grid.set(0, 0, headerRows, gridCols, contrib.log, {
        fg: 'cyan',
        selectedFg: 'cyan',
        label: 'Signal Creation Menu',
        border: {type: "line", fg: 'cyan'},
        width: '100%'
    });

    // Signals list
    const signalsList = grid.set(headerRows, 0, listRows, gridCols, blessed.list, {
        fg: 'white',
        selectedFg: 'black',
        selectedBg: 'cyan',
        label: 'Select a Signal to Create',
        border: {type: "line", fg: 'green'},
        scrollable: true,
        invertSelected: true,
        mouse: true,
        keys: true,
        width: '100%'
    });

    // Status bar
    const statusBar = grid.set(headerRows + listRows, 0, statusRows, gridCols, contrib.log, {
        fg: "green",
        selectedFg: "green",
        label: 'Status',
        width: '100%'
    });

    // Initialize header
    headerLog.log(`📊 Available Trading Signals for Creation`);
    headerLog.log(`Symbol: ${options.symbol} | Interval: ${options.interval}`);
    headerLog.log(`─`.repeat(40));

    // Get all available signal types
    const signalTypes = [
        // RSI Signals
        { key: 'rsi-os', name: 'RSI Oversold (Long)', desc: 'Enter LONG when RSI < value', needsValue: true, defaultValue: 30 },
        { key: 'rsi-ob', name: 'RSI Overbought (Short)', desc: 'Enter SHORT when RSI > value', needsValue: true, defaultValue: 70 },

        // SuperTrend Signals
        { key: 'supertrend-long', name: 'SuperTrend Long', desc: 'Enter LONG on uptrend', needsValue: false },
        { key: 'supertrend-short', name: 'SuperTrend Short', desc: 'Enter SHORT on downtrend', needsValue: false },

        // Price Action Signals
        { key: 'price-gt', name: 'Price Above Level', desc: 'Enter LONG when price > value', needsValue: true, defaultValue: 0 },
        { key: 'price-lt', name: 'Price Below Level', desc: 'Enter SHORT when price < value', needsValue: true, defaultValue: 0 },
        { key: 'price-gte', name: 'Price At/Above Level', desc: 'Enter LONG when price >= value', needsValue: true, defaultValue: 0 },
        { key: 'price-lte', name: 'Price At/Below Level', desc: 'Enter SHORT when price <= value', needsValue: true, defaultValue: 0 },
        { key: 'price-eq', name: 'Price Equal', desc: 'Enter when price == value', needsValue: true, defaultValue: 0 },

        // Pattern Signals
        { key: 'crocodile', name: 'Crocodile (EMA Pattern)', desc: 'EMA1 > EMA2 > EMA3 (Bullish)', needsValue: false },
        { key: 'crocodile-dive', name: 'Crocodile Dive', desc: 'EMA1 < EMA2 < EMA3 (Bearish)', needsValue: false },
        { key: 'cross-up', name: 'EMA Cross Up', desc: 'Fast EMA crosses above Slow EMA', needsValue: false },
        { key: 'cross-down', name: 'EMA Cross Down', desc: 'Fast EMA crosses below Slow EMA', needsValue: false },

        // Divergence Signals
        { key: 'multi-div', name: 'Multi-Divergence', desc: 'Detects divergences across indicators', needsValue: false },

        // Trend Signals
        { key: 'uptrend', name: 'Uptrend Signal', desc: 'SuperTrend uptrend detection', needsValue: false },
        { key: 'downtrend', name: 'Downtrend Signal', desc: 'SuperTrend downtrend detection', needsValue: false },

        // Pivot Points
        { key: 'woodies', name: 'Woodies Pivots', desc: 'Support/resistance pivot levels', needsValue: false },

        // MACD Signals
        { key: 'macd-bullish', name: 'MACD Bullish Cross', desc: 'MACD crosses above signal', needsValue: false },
        { key: 'macd-bearish', name: 'MACD Bearish Cross', desc: 'MACD crosses below signal', needsValue: false },
        { key: 'macd-histogram-positive', name: 'MACD Histogram Positive', desc: 'Histogram turns positive', needsValue: false },
        { key: 'macd-histogram-negative', name: 'MACD Histogram Negative', desc: 'Histogram turns negative', needsValue: false },

        // Bollinger Band Signals
        { key: 'bollinger-upper-touch', name: 'Bollinger Upper Touch', desc: 'Price touches upper band', needsValue: false },
        { key: 'bollinger-lower-touch', name: 'Bollinger Lower Touch', desc: 'Price touches lower band', needsValue: false },
        { key: 'bollinger-squeeze', name: 'Bollinger Squeeze', desc: 'Bands are squeezing', needsValue: false },
        { key: 'bollinger-expansion', name: 'Bollinger Expansion', desc: 'Bands are expanding', needsValue: false },

        // Stochastic Signals
        { key: 'stochastic-overbought', name: 'Stochastic Overbought', desc: 'Stochastic > 80', needsValue: false },
        { key: 'stochastic-oversold', name: 'Stochastic Oversold', desc: 'Stochastic < 20', needsValue: false },
        { key: 'stochastic-bullish-cross', name: 'Stochastic Bullish Cross', desc: '%K crosses above %D', needsValue: false },
        { key: 'stochastic-bearish-cross', name: 'Stochastic Bearish Cross', desc: '%K crosses below %D', needsValue: false },

        // Williams %R Signals
        { key: 'williams-overbought', name: 'Williams %R Overbought', desc: 'Williams %R > -20', needsValue: false },
        { key: 'williams-oversold', name: 'Williams %R Oversold', desc: 'Williams %R < -80', needsValue: false },

        // Moving Average Signals
        { key: 'golden-cross', name: 'Golden Cross', desc: 'Fast MA crosses above slow MA', needsValue: false },
        { key: 'death-cross', name: 'Death Cross', desc: 'Fast MA crosses below slow MA', needsValue: false },
        { key: 'ma-support', name: 'MA Support', desc: 'Price finds support at MA', needsValue: false },
        { key: 'ma-resistance', name: 'MA Resistance', desc: 'Price hits resistance at MA', needsValue: false },

        // Volume Signals
        { key: 'volume-spike', name: 'Volume Spike', desc: 'Volume significantly above average', needsValue: false },
        { key: 'obv-bullish', name: 'OBV Bullish', desc: 'On Balance Volume trending up', needsValue: false },
        { key: 'obv-bearish', name: 'OBV Bearish', desc: 'On Balance Volume trending down', needsValue: false },

        // Ichimoku Signals
        { key: 'ichimoku-bullish', name: 'Ichimoku Bullish', desc: 'Price above cloud, Tenkan > Kijun', needsValue: false },
        { key: 'ichimoku-bearish', name: 'Ichimoku Bearish', desc: 'Price below cloud, Tenkan < Kijun', needsValue: false },
        { key: 'ichimoku-tk-cross-bullish', name: 'Ichimoku TK Bullish Cross', desc: 'Tenkan crosses above Kijun', needsValue: false },
        { key: 'ichimoku-tk-cross-bearish', name: 'Ichimoku TK Bearish Cross', desc: 'Tenkan crosses below Kijun', needsValue: false },

        // ADX Signals
        { key: 'adx-strong-trend', name: 'ADX Strong Trend', desc: 'ADX > 25 (strong trend)', needsValue: false },
        { key: 'adx-weak-trend', name: 'ADX Weak Trend', desc: 'ADX < 20 (weak trend)', needsValue: false },

        // MFI Signals
        { key: 'mfi-overbought', name: 'MFI Overbought', desc: 'Money Flow Index > 80', needsValue: false },
        { key: 'mfi-oversold', name: 'MFI Oversold', desc: 'Money Flow Index < 20', needsValue: false },

        // ATR Signals
        { key: 'atr-high-volatility', name: 'ATR High Volatility', desc: 'ATR above moving average', needsValue: false },

        // Parabolic SAR Signals
        { key: 'parabolic-sar-bullish', name: 'Parabolic SAR Bullish', desc: 'PSAR below price', needsValue: false },
        { key: 'parabolic-sar-bearish', name: 'Parabolic SAR Bearish', desc: 'PSAR above price', needsValue: false },

        // CCI Signals
        { key: 'cci-overbought', name: 'CCI Overbought', desc: 'CCI > 100', needsValue: false },
        { key: 'cci-oversold', name: 'CCI Oversold', desc: 'CCI < -100', needsValue: false },

        // Advanced Signals
        { key: 'fibonacci-retracement', name: 'Fibonacci Retracement', desc: 'Price at Fibonacci levels', needsValue: false },
        { key: 'support-breakout', name: 'Support Breakout', desc: 'Price breaks above support', needsValue: false },
        { key: 'resistance-breakout', name: 'Resistance Breakout', desc: 'Price breaks above resistance', needsValue: false },
        { key: 'tema-bullish', name: 'TEMA Bullish', desc: 'Triple EMA bullish signal', needsValue: false },
        { key: 'tema-bearish', name: 'TEMA Bearish', desc: 'Triple EMA bearish signal', needsValue: false },
        { key: 'keltner-upper-breakout', name: 'Keltner Upper Breakout', desc: 'Price breaks above upper channel', needsValue: false },
        { key: 'keltner-lower-breakout', name: 'Keltner Lower Breakout', desc: 'Price breaks below lower channel', needsValue: false },
        { key: 'donchian-upper-breakout', name: 'Donchian Upper Breakout', desc: 'Price breaks above channel high', needsValue: false },
        { key: 'donchian-lower-breakout', name: 'Donchian Lower Breakout', desc: 'Price breaks below channel low', needsValue: false },
        { key: 'elder-impulse-bull', name: 'Elder Impulse Bull', desc: 'Green bar (bullish impulse)', needsValue: false },
        { key: 'elder-impulse-bear', name: 'Elder Impulse Bear', desc: 'Red bar (bearish impulse)', needsValue: false },
        { key: 'elder-impulse-blue', name: 'Elder Impulse Blue', desc: 'Blue bar (neutral impulse)', needsValue: false }
    ];

    // Populate the list
    const signalNames = signalTypes.map((signal, index) => {
        return `${index + 1}. ${signal.name} - ${signal.desc}`;
    });
    signalsList.setItems(signalNames);

    // Set status message
    statusBar.setContent('↑↓ to navigate | Enter to select | Esc to exit');
    screen.render();

    // Handle selection
    signalsList.on('select', async function(item, index) {
        const selectedSignal = signalTypes[index];
        screen.destroy();

        // Handle value input for signals that need it
        let value = null;
        if (selectedSignal.needsValue) {
            const readline = (await import('readline')).default;
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            const defaultVal = selectedSignal.defaultValue || 0;
            const question = `Enter value for ${selectedSignal.name} (default: ${defaultVal}): `;

            value = await new Promise((resolve) => {
                rl.question(question, (answer) => {
                    rl.close();
                    resolve(answer.trim() === '' ? defaultVal : parseFloat(answer));
                });
            });
        }

        await createSignalForType(selectedSignal, options, value);
    });

    // Key bindings
    screen.key(['escape', 'q', 'C-c'], function(ch, key) {
        screen.destroy();
        process.exit(0);
    });

    // Focus on the list
    signalsList.focus();
    screen.render();
}

async function createSignalForType(selectedSignal, options, value = null) {
    const spinner = ora('Creating signal...').start();

    try {
        const symbol = options.symbol.toUpperCase();
        const interval = options.interval;
        const maxTriggers = options.maxTriggers || 3;

        let created = false;

        switch (selectedSignal.key) {
            case 'rsi-ob':
                await createRsiObSignal(symbol, interval, value || 70);
                created = true;
                break;

            case 'rsi-os':
                await createRsiOsSignal(symbol, interval, value || 30);
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
                await createPriceActionSignal(symbol, interval, value || 0, 'gt');
                created = true;
                break;

            case 'price-lt':
                await createPriceActionSignal(symbol, interval, value || 0, 'lt');
                created = true;
                break;

            case 'price-gte':
                await createPriceActionSignal(symbol, interval, value || 0, 'gte');
                created = true;
                break;

            case 'price-lte':
                await createPriceActionSignal(symbol, interval, value || 0, 'lte');
                created = true;
                break;

            case 'price-eq':
                await createPriceActionSignal(symbol, interval, value || 0, 'eq');
                created = true;
                break;

            default:
                // For signals not in the switch, try to create them using createIndicatorSignal
                await createSignalFromKey(selectedSignal.key, symbol, interval, value);
                created = true;
                break;
        }

        if (created) {
            spinner.succeed(chalk.green(`✓ Signal created successfully!`));
            console.log(chalk.cyan(`  Symbol: ${symbol}`));
            console.log(chalk.cyan(`  Interval: ${interval}`));
            console.log(chalk.cyan(`  Type: ${selectedSignal.name}`));
            if (value !== null) console.log(chalk.cyan(`  Value: ${value}`));
            console.log(chalk.cyan(`  Max Triggers: ${maxTriggers}\n`));
        }
    } catch (error) {
        spinner.fail('Failed to create signal');
        console.error(chalk.red(error.message));
    }
}

async function createSignalFromKey(key, symbol, interval, value = null) {
    // Special handling for signals that don't need traditional indicators
    if (key === 'fibonacci-retracement') {
        // Fibonacci retracement doesn't need an indicator, it works with price data directly
        await createIndicatorSignal(symbol, interval, value || 0, 'EMAIndicator', signalAgent.fibonacciRetracement, {}, 'FibonacciRetracementSignal');
        return;
    }
    
    // Handle signals that use 'price' as indicator - map to EMAIndicator as a placeholder
    const priceBasedSignals = ['donchian-upper-breakout', 'donchian-lower-breakout'];
    if (priceBasedSignals.includes(key)) {
        const mapping = {
            'donchian-upper-breakout': { func: signalAgent.donchianUpperBreakout, strategy: 'DonchianUpperBreakoutSignal' },
            'donchian-lower-breakout': { func: signalAgent.donchianLowerBreakout, strategy: 'DonchianLowerBreakoutSignal' }
        };
        await createIndicatorSignal(symbol, interval, value || 0, 'EMAIndicator', mapping[key].func, {}, mapping[key].strategy);
        return;
    }
    
    // Standard signal mappings
    const signalMappings = {
        'macd-bullish': { indicator: 'MacdIndicator', func: signalAgent.macdBullish, strategy: 'MacdBullishSignal' },
        'macd-bearish': { indicator: 'MacdIndicator', func: signalAgent.macdBearish, strategy: 'MacdBearishSignal' },
        'macd-histogram-positive': { indicator: 'MacdIndicator', func: signalAgent.macdHistogramPositive, strategy: 'MacdHistogramPositiveSignal' },
        'macd-histogram-negative': { indicator: 'MacdIndicator', func: signalAgent.macdHistogramNegative, strategy: 'MacdHistogramNegativeSignal' },
        'bollinger-upper-touch': { indicator: 'BollingerIndicator', func: signalAgent.bollingerUpperTouch, strategy: 'BollingerUpperTouchSignal' },
        'bollinger-lower-touch': { indicator: 'BollingerIndicator', func: signalAgent.bollingerLowerTouch, strategy: 'BollingerLowerTouchSignal' },
        'bollinger-squeeze': { indicator: 'BollingerIndicator', func: signalAgent.bollingerSqueeze, strategy: 'BollingerSqueezeSignal' },
        'bollinger-expansion': { indicator: 'BollingerIndicator', func: signalAgent.bollingerExpansion, strategy: 'BollingerExpansionSignal' },
        'stochastic-overbought': { indicator: 'StochasticIndicator', func: signalAgent.stochasticOverbought, strategy: 'StochasticOverboughtSignal' },
        'stochastic-oversold': { indicator: 'StochasticIndicator', func: signalAgent.stochasticOversold, strategy: 'StochasticOversoldSignal' },
        'stochastic-bullish-cross': { indicator: 'StochasticIndicator', func: signalAgent.stochasticBullishCross, strategy: 'StochasticBullishCrossSignal' },
        'stochastic-bearish-cross': { indicator: 'StochasticIndicator', func: signalAgent.stochasticBearishCross, strategy: 'StochasticBearishCrossSignal' },
        'williams-overbought': { indicator: 'WilliamsRIndicator', func: signalAgent.williamsOverbought, strategy: 'WilliamsOverboughtSignal' },
        'williams-oversold': { indicator: 'WilliamsRIndicator', func: signalAgent.williamsOversold, strategy: 'WilliamsOversoldSignal' },
        'golden-cross': { indicator: 'Ema3Indicator', func: signalAgent.goldenCross, strategy: 'GoldenCrossSignal' },
        'death-cross': { indicator: 'Ema3Indicator', func: signalAgent.deathCross, strategy: 'DeathCrossSignal' },
        'ma-support': { indicator: 'EMAIndicator', func: signalAgent.maSupport, strategy: 'MaSupportSignal' },
        'ma-resistance': { indicator: 'EMAIndicator', func: signalAgent.maResistance, strategy: 'MaResistanceSignal' },
        'volume-spike': { indicator: 'ObvIndicator', func: signalAgent.volumeSpike, strategy: 'VolumeSpikeSignal' },
        'obv-bullish': { indicator: 'ObvIndicator', func: signalAgent.obvBullish, strategy: 'ObvBullishSignal' },
        'obv-bearish': { indicator: 'ObvIndicator', func: signalAgent.obvBearish, strategy: 'ObvBearishSignal' },
        'ichimoku-bullish': { indicator: 'IchimokuCloudIndicator', func: signalAgent.ichimokuBullish, strategy: 'IchimokuBullishSignal' },
        'ichimoku-bearish': { indicator: 'IchimokuCloudIndicator', func: signalAgent.ichimokuBearish, strategy: 'IchimokuBearishSignal' },
        'ichimoku-tk-cross-bullish': { indicator: 'IchimokuCloudIndicator', func: signalAgent.ichimokuTkCrossBullish, strategy: 'IchimokuTkCrossBullishSignal' },
        'ichimoku-tk-cross-bearish': { indicator: 'IchimokuCloudIndicator', func: signalAgent.ichimokuTkCrossBearish, strategy: 'IchimokuTkCrossBearishSignal' },
        'adx-strong-trend': { indicator: 'AdxIndicator', func: signalAgent.adxStrongTrend, strategy: 'AdxStrongTrendSignal' },
        'adx-weak-trend': { indicator: 'AdxIndicator', func: signalAgent.adxWeakTrend, strategy: 'AdxWeakTrendSignal' },
        'mfi-overbought': { indicator: 'MfiIndicator', func: signalAgent.mfiOverbought, strategy: 'MfiOverboughtSignal' },
        'mfi-oversold': { indicator: 'MfiIndicator', func: signalAgent.mfiOversold, strategy: 'MfiOversoldSignal' },
        'atr-high-volatility': { indicator: 'AtrIndicator', func: signalAgent.atrHighVolatility, strategy: 'AtrHighVolatilitySignal' },
        'parabolic-sar-bullish': { indicator: 'PsarIndicator', func: signalAgent.parabolicSarBullish, strategy: 'ParabolicSarBullishSignal' },
        'parabolic-sar-bearish': { indicator: 'PsarIndicator', func: signalAgent.parabolicSarBearish, strategy: 'ParabolicSarBearishSignal' },
        'cci-overbought': { indicator: 'CciIndicator', func: signalAgent.cciOverbought, strategy: 'CciOverboughtSignal' },
        'cci-oversold': { indicator: 'CciIndicator', func: signalAgent.cciOversold, strategy: 'CciOversoldSignal' },
        'fibonacci-retracement': { indicator: 'price', func: signalAgent.fibonacciRetracement, strategy: 'FibonacciRetracementSignal' },
        'support-breakout': { indicator: 'SupportAndResistance', func: signalAgent.supportBreakout, strategy: 'SupportBreakoutSignal' },
        'resistance-breakout': { indicator: 'SupportAndResistance', func: signalAgent.resistanceBreakout, strategy: 'ResistanceBreakoutSignal' },
        'tema-bullish': { indicator: 'TrixIndicator', func: signalAgent.temaBullish, strategy: 'TemaBullishSignal' },
        'tema-bearish': { indicator: 'TrixIndicator', func: signalAgent.temaBearish, strategy: 'TemaBearishSignal' },
        'keltner-upper-breakout': { indicator: 'KeltnerIndicator', func: signalAgent.keltnerUpperBreakout, strategy: 'KeltnerUpperBreakoutSignal' },
        'keltner-lower-breakout': { indicator: 'KeltnerIndicator', func: signalAgent.keltnerLowerBreakout, strategy: 'KeltnerLowerBreakoutSignal' },
        'donchian-upper-breakout': { indicator: 'price', func: signalAgent.donchianUpperBreakout, strategy: 'DonchianUpperBreakoutSignal' },
        'donchian-lower-breakout': { indicator: 'price', func: signalAgent.donchianLowerBreakout, strategy: 'DonchianLowerBreakoutSignal' },
        'elder-impulse-bull': { indicator: 'MacdIndicator', func: signalAgent.elderImpulseBull, strategy: 'ElderImpulseBullSignal' },
        'elder-impulse-bear': { indicator: 'MacdIndicator', func: signalAgent.elderImpulseBear, strategy: 'ElderImpulseBearSignal' },
        'elder-impulse-blue': { indicator: 'MacdIndicator', func: signalAgent.elderImpulseBlue, strategy: 'ElderImpulseBlueSignal' }
    };

    const mapping = signalMappings[key];
    if (!mapping) {
        throw new Error(`Unknown signal type: ${key}`);
    }

    await createIndicatorSignal(symbol, interval, value || 0, mapping.indicator, mapping.func, {}, mapping.strategy);
}

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
            console.log('  tema-bullish           - Triple EMA Bullish');
            console.log('  tema-bearish           - Triple EMA Bearish');
            console.log('  keltner-upper-breakout  - Keltner Channel Upper Breakout');
            console.log('  keltner-lower-breakout  - Keltner Channel Lower Breakout');
            console.log('  donchian-upper-breakout - Donchian Channel Upper Breakout');
            console.log('  donchian-lower-breakout - Donchian Channel Lower Breakout');
            console.log('  elder-impulse-bull     - Elder Impulse System Bullish');
            console.log('  elder-impulse-bear     - Elder Impulse System Bearish');
            console.log('  elder-impulse-blue     - Elder Impulse System Blue (Neutral)');
        });

    program
        .command('create-signal')
        .description('Create a new trading signal (interactive selector)')
        .requiredOption('-s, --symbol <symbol>', 'Trading symbol (e.g., BTCUSDT)')
        .requiredOption('-i, --interval <interval>', 'Time interval (e.g., 1m, 5m, 15m, 1h, 4h)')
        .option('-m, --max-triggers <number>', 'Max trigger times', '3')
        .action(async (options) => {
            // Normalize interval - if it's a number, append 'm'
            if (options.interval && /^\d+$/.test(options.interval)) {
                options.interval = options.interval + 'm';
            }
            await showSignalSelector(options);
        });

    program
        .command('list-signals')
        .description('List all active trading signals')
        .action(async () => {
            const signals = await getAllSignals();
            if (signals.length === 0) {
                console.log(chalk.yellow('No active signals found.'));
                return;
            }

            const table = new Table({
                head: ['ID', 'Symbol', 'Interval', 'Type', 'Value', 'Max Triggers'],
                colWidths: [10, 15, 10, 20, 10, 15]
            });

            signals.forEach(signal => {
                table.push([
                    signal.id.substring(0, 10) + '...',
                    signal.symbol,
                    signal.timeframe,
                    signal.signalType,
                    signal.value !== null ? signal.value : '',
                    signal.maxTriggerTimes
                ]);
            });

            console.log(table.toString());
        });

    program
        .command('delete-signals')
        .description('Delete all trading signals')
        .action(async () => {
            const spinner = ora('Deleting all signals...').start();
            try {
                await deleteAll();
                spinner.succeed('All signals deleted successfully.');
            } catch (error) {
                spinner.fail('Failed to delete signals');
                console.error(chalk.red(error.message));
            }
        });
}
