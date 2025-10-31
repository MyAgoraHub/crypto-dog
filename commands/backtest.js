import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import blessed from 'blessed';
import contrib from 'blessed-contrib';
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
        'crocodile-dive': 'Ema3Indicator',
        'crocodile': 'Ema3Indicator',
        'cross-up': 'EMAIndicator',
        'cross-down': 'EMAIndicator',
        'multi-div': 'MultiDivergenceDetector',
        'uptrend': 'SuperTrendIndicator',
        'downtrend': 'SuperTrendIndicator',
        'woodies': 'Woodies',
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
        'golden-cross': 'Ema3Indicator',
        'death-cross': 'Ema3Indicator',
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

async function showSignalSelector(options) {
    console.log(chalk.cyan(`\n🎯 Starting Interactive Backtest Signal Selector`));
    console.log(chalk.gray(`Symbol: ${options.symbol} | Interval: ${options.interval}`));
    console.log(chalk.gray(`Press Ctrl+C to exit\n`));

    // Create blessed screen for signal selection
    const screen = blessed.screen({
        smartCSR: true,
        title: `CryptoDog Backtest Signal Selector - ${options.symbol}`
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
        label: 'Signal Backtest Menu',
        border: {type: "line", fg: 'cyan'},
        width: '100%'
    });

    // Signals list
    const signalsList = grid.set(headerRows, 0, listRows, gridCols, blessed.list, {
        fg: 'white',
        selectedFg: 'black',
        selectedBg: 'cyan',
        label: 'Select a Signal to Backtest',
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
    headerLog.log(`📊 Available Trading Signals for Backtesting`);
    headerLog.log(`Symbol: ${options.symbol} | Interval: ${options.interval}`);
    headerLog.log(`─`.repeat(40));

    // Get all available signal types
    const signalTypes = [
        // RSI Signals
        { key: 'rsi-os', name: 'RSI Oversold (Long)', desc: 'Enter LONG when RSI < value' },
        { key: 'rsi-ob', name: 'RSI Overbought (Short)', desc: 'Enter SHORT when RSI > value' },
        
        // SuperTrend Signals
        { key: 'supertrend-long', name: 'SuperTrend Long', desc: 'Enter LONG on uptrend' },
        { key: 'supertrend-short', name: 'SuperTrend Short', desc: 'Enter SHORT on downtrend' },
        
        // Price Action Signals
        { key: 'price-gt', name: 'Price Above Level', desc: 'Enter LONG when price > value' },
        { key: 'price-lt', name: 'Price Below Level', desc: 'Enter SHORT when price < value' },
        { key: 'price-gte', name: 'Price At/Above Level', desc: 'Enter LONG when price >= value' },
        { key: 'price-lte', name: 'Price At/Below Level', desc: 'Enter SHORT when price <= value' },
        
        // Pattern Signals
        { key: 'crocodile', name: 'Crocodile (EMA Pattern)', desc: 'EMA1 > EMA2 > EMA3 (Bullish)' },
        { key: 'crocodile-dive', name: 'Crocodile Dive', desc: 'EMA1 < EMA2 < EMA3 (Bearish)' },
        { key: 'cross-up', name: 'EMA Cross Up', desc: 'Fast EMA crosses above Slow EMA' },
        { key: 'cross-down', name: 'EMA Cross Down', desc: 'Fast EMA crosses below Slow EMA' },
        
        // Divergence Signals
        { key: 'multi-div', name: 'Multi-Divergence', desc: 'Detects divergences across indicators' },
        
        // Trend Signals
        { key: 'uptrend', name: 'Uptrend Signal', desc: 'SuperTrend uptrend detection' },
        { key: 'downtrend', name: 'Downtrend Signal', desc: 'SuperTrend downtrend detection' },
        
        // Pivot Points
        { key: 'woodies', name: 'Woodies Pivots', desc: 'Support/resistance pivot levels' },
        
        // MACD Signals
        { key: 'macd-bullish', name: 'MACD Bullish Cross', desc: 'MACD crosses above signal' },
        { key: 'macd-bearish', name: 'MACD Bearish Cross', desc: 'MACD crosses below signal' },
        { key: 'macd-histogram-positive', name: 'MACD Histogram Positive', desc: 'Histogram turns positive' },
        { key: 'macd-histogram-negative', name: 'MACD Histogram Negative', desc: 'Histogram turns negative' },
        
        // Bollinger Band Signals
        { key: 'bollinger-upper-touch', name: 'Bollinger Upper Touch', desc: 'Price touches upper band' },
        { key: 'bollinger-lower-touch', name: 'Bollinger Lower Touch', desc: 'Price touches lower band' },
        { key: 'bollinger-squeeze', name: 'Bollinger Squeeze', desc: 'Bands are squeezing' },
        { key: 'bollinger-expansion', name: 'Bollinger Expansion', desc: 'Bands are expanding' },
        
        // Stochastic Signals
        { key: 'stochastic-overbought', name: 'Stochastic Overbought', desc: 'Stochastic > 80' },
        { key: 'stochastic-oversold', name: 'Stochastic Oversold', desc: 'Stochastic < 20' },
        { key: 'stochastic-bullish-cross', name: 'Stochastic Bullish Cross', desc: '%K crosses above %D' },
        { key: 'stochastic-bearish-cross', name: 'Stochastic Bearish Cross', desc: '%K crosses below %D' },
        
        // Williams %R Signals
        { key: 'williams-overbought', name: 'Williams %R Overbought', desc: 'Williams %R > -20' },
        { key: 'williams-oversold', name: 'Williams %R Oversold', desc: 'Williams %R < -80' },
        
        // Moving Average Signals
        { key: 'golden-cross', name: 'Golden Cross', desc: 'Fast MA crosses above slow MA' },
        { key: 'death-cross', name: 'Death Cross', desc: 'Fast MA crosses below slow MA' },
        { key: 'ma-support', name: 'MA Support', desc: 'Price finds support at MA' },
        { key: 'ma-resistance', name: 'MA Resistance', desc: 'Price hits resistance at MA' },
        
        // Volume Signals
        { key: 'volume-spike', name: 'Volume Spike', desc: 'Volume significantly above average' },
        { key: 'obv-bullish', name: 'OBV Bullish', desc: 'On Balance Volume trending up' },
        { key: 'obv-bearish', name: 'OBV Bearish', desc: 'On Balance Volume trending down' },
        
        // Ichimoku Signals
        { key: 'ichimoku-bullish', name: 'Ichimoku Bullish', desc: 'Price above cloud, Tenkan > Kijun' },
        { key: 'ichimoku-bearish', name: 'Ichimoku Bearish', desc: 'Price below cloud, Tenkan < Kijun' },
        { key: 'ichimoku-tk-cross-bullish', name: 'Ichimoku TK Bullish Cross', desc: 'Tenkan crosses above Kijun' },
        { key: 'ichimoku-tk-cross-bearish', name: 'Ichimoku TK Bearish Cross', desc: 'Tenkan crosses below Kijun' },
        
        // ADX Signals
        { key: 'adx-strong-trend', name: 'ADX Strong Trend', desc: 'ADX > 25 (strong trend)' },
        { key: 'adx-weak-trend', name: 'ADX Weak Trend', desc: 'ADX < 20 (weak trend)' },
        
        // MFI Signals
        { key: 'mfi-overbought', name: 'MFI Overbought', desc: 'Money Flow Index > 80' },
        { key: 'mfi-oversold', name: 'MFI Oversold', desc: 'Money Flow Index < 20' },
        
        // ATR Signals
        { key: 'atr-high-volatility', name: 'ATR High Volatility', desc: 'ATR above moving average' },
        
        // Parabolic SAR Signals
        { key: 'parabolic-sar-bullish', name: 'Parabolic SAR Bullish', desc: 'PSAR below price' },
        { key: 'parabolic-sar-bearish', name: 'Parabolic SAR Bearish', desc: 'PSAR above price' },
        
        // CCI Signals
        { key: 'cci-overbought', name: 'CCI Overbought', desc: 'CCI > 100' },
        { key: 'cci-oversold', name: 'CCI Oversold', desc: 'CCI < -100' },
        
        // Advanced Signals
        { key: 'fibonacci-retracement', name: 'Fibonacci Retracement', desc: 'Price at Fibonacci levels' },
        { key: 'support-breakout', name: 'Support Breakout', desc: 'Price breaks above support' },
        { key: 'resistance-breakout', name: 'Resistance Breakout', desc: 'Price breaks above resistance' },
        { key: 'tema-bullish', name: 'TEMA Bullish', desc: 'Triple EMA bullish signal' },
        { key: 'tema-bearish', name: 'TEMA Bearish', desc: 'Triple EMA bearish signal' },
        { key: 'keltner-upper-breakout', name: 'Keltner Upper Breakout', desc: 'Price breaks above upper channel' },
        { key: 'keltner-lower-breakout', name: 'Keltner Lower Breakout', desc: 'Price breaks below lower channel' },
        { key: 'donchian-upper-breakout', name: 'Donchian Upper Breakout', desc: 'Price breaks above channel high' },
        { key: 'donchian-lower-breakout', name: 'Donchian Lower Breakout', desc: 'Price breaks below channel low' },
        { key: 'elder-impulse-bull', name: 'Elder Impulse Bull', desc: 'Green bar (bullish impulse)' },
        { key: 'elder-impulse-bear', name: 'Elder Impulse Bear', desc: 'Red bar (bearish impulse)' },
        { key: 'elder-impulse-blue', name: 'Elder Impulse Blue', desc: 'Blue bar (neutral impulse)' }
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
        await runBacktestForSignal(selectedSignal, options);
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

async function runBacktestForSignal(selectedSignal, options) {
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
        if (selectedSignal.key === 'supertrend-long') {
            value = 'long';
        } else if (selectedSignal.key === 'supertrend-short') {
            value = 'short';
        } else if (selectedSignal.key === 'rsi-os') {
            value = 30; // RSI oversold threshold
        } else if (selectedSignal.key === 'rsi-ob') {
            value = 70; // RSI overbought threshold
        } else {
            value = 0;
        }

        // Create signal for backtesting
        const signalType = mapTypeToSignalType(selectedSignal.key);
        const indicator = getIndicatorForType(selectedSignal.key);
        const evaluateFuncName = getEvaluateFunctionForType(selectedSignal.key);

        const signal = {
            symbol,
            timeframe: interval,
            signalType,
            indicator,
            value,
            evaluate: evaluateFuncName, // Store function name instead of string
            indicatorArgs: selectedSignal.key === 'cross-up' || selectedSignal.key === 'cross-down' ? { period: 200 } : {}
        };

        spinner.text = 'Running backtest simulation...';
        const results = await backtestSignal(signal, iterations, candles, risk, reward, capital);

        spinner.succeed('Backtest completed!');

        // Display results
        console.log(chalk.green('\n📊 BACKTEST RESULTS\n'));
        console.log(chalk.cyan('Signal Configuration:'));
        console.log(`  Symbol: ${signal.symbol}`);
        console.log(`  Timeframe: ${signal.timeframe}`);
        console.log(`  Type: ${signal.signalType}`);
        if (value !== 0) console.log(`  Value: ${value}`);

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

        console.log('');
    } catch (error) {
        spinner.fail('Backtest failed');
        console.error(chalk.red(error.message));
        console.error(error.stack);
    }
}

export function registerBacktestCommand(program) {
    program
        .command('backtest')
        .description('Interactive backtest signal strategy selector')
        .option('-s, --symbol <symbol>', 'Trading symbol (default: BTCUSDT)', 'BTCUSDT')
        .option('-i, --interval <interval>', 'Time interval (default: 1h)', '1h')
        .option('--iterations <number>', 'Number of historical data pulls', '10')
        .option('--candles <number>', 'Candles per pull', '200')
        .option('--risk <percent>', 'Risk per trade (%)', '2')
        .option('--reward <percent>', 'Reward per trade (%)', '5')
        .option('--capital <amount>', 'Initial capital', '10000')
        .action(async (options) => {
            await showSignalSelector(options);
        });
}
