// Signal mapping utilities extracted from CLI backtest.js
// These functions provide seamless mapping between signal keys and their components

export function mapTypeToSignalType(type) {
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

export function getIndicatorForType(type) {
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
        'fibonacci-retracement': 'price',
        'support-breakout': 'SupportAndResistance',
        'resistance-breakout': 'SupportAndResistance',
        'adx-weak-trend': 'AdxIndicator',
        'tema-bullish': 'TrixIndicator',
        'tema-bearish': 'TrixIndicator',
        'keltner-upper-breakout': 'KeltnerIndicator',
        'keltner-lower-breakout': 'KeltnerIndicator',
        'donchian-upper-breakout': 'price',
        'donchian-lower-breakout': 'price',
        'elder-impulse-bull': 'MacdIndicator',
        'elder-impulse-bear': 'MacdIndicator',
        'elder-impulse-blue': 'MacdIndicator'
    };
    return indicators[type] || 'unknown';
}

export function getEvaluateFunctionForType(type) {
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
    
    return evaluateFunctions[type] || `signalAgent.gt`;
}

export function getDefaultValueForSignal(signalKey) {
    const defaultValues = {
        'rsi-os': 30,
        'rsi-ob': 70,
        'stochastic-oversold': 20,
        'stochastic-overbought': 80,
        'williams-oversold': -80,
        'williams-overbought': -20,
        'mfi-oversold': 20,
        'mfi-overbought': 80,
        'cci-oversold': -100,
        'cci-overbought': 100,
        'supertrend-long': 'long',
        'supertrend-short': 'short',
        'uptrend': 'long',
        'downtrend': 'short',
        'crocodile': 'bullish',
        'crocodile-dive': 'bearish'
    };
    
    return defaultValues[signalKey] || 0;
}

export function getAllSignalTypes() {
    return [
        // RSI Signals
        { 
            key: 'rsi-os', 
            name: 'RSI Oversold (Long)', 
            description: 'Enter LONG when RSI < value',
            category: 'oscillator',
            direction: 'long',
            defaultValue: 30,
            valueType: 'number'
        },
        { 
            key: 'rsi-ob', 
            name: 'RSI Overbought (Short)', 
            description: 'Enter SHORT when RSI > value',
            category: 'oscillator',
            direction: 'short',
            defaultValue: 70,
            valueType: 'number'
        },
        
        // SuperTrend Signals
        { 
            key: 'supertrend-long', 
            name: 'SuperTrend Long', 
            description: 'Enter LONG on uptrend',
            category: 'trend',
            direction: 'long',
            defaultValue: 'long',
            valueType: 'string'
        },
        { 
            key: 'supertrend-short', 
            name: 'SuperTrend Short', 
            description: 'Enter SHORT on downtrend',
            category: 'trend',
            direction: 'short',
            defaultValue: 'short',
            valueType: 'string'
        },
        
        // Price Action Signals
        { 
            key: 'price-gt', 
            name: 'Price Above Level', 
            description: 'Enter LONG when price > value',
            category: 'price-action',
            direction: 'long',
            defaultValue: 0,
            valueType: 'number'
        },
        { 
            key: 'price-lt', 
            name: 'Price Below Level', 
            description: 'Enter SHORT when price < value',
            category: 'price-action',
            direction: 'short',
            defaultValue: 0,
            valueType: 'number'
        },
        
        // MACD Signals
        { 
            key: 'macd-bullish', 
            name: 'MACD Bullish Cross', 
            description: 'MACD crosses above signal',
            category: 'momentum',
            direction: 'long',
            defaultValue: 0,
            valueType: 'number'
        },
        { 
            key: 'macd-bearish', 
            name: 'MACD Bearish Cross', 
            description: 'MACD crosses below signal',
            category: 'momentum',
            direction: 'short',
            defaultValue: 0,
            valueType: 'number'
        },
        
        // Bollinger Band Signals
        { 
            key: 'bollinger-upper-touch', 
            name: 'Bollinger Upper Touch', 
            description: 'Price touches upper band',
            category: 'volatility',
            direction: 'short',
            defaultValue: 0,
            valueType: 'number'
        },
        { 
            key: 'bollinger-lower-touch', 
            name: 'Bollinger Lower Touch', 
            description: 'Price touches lower band',
            category: 'volatility',
            direction: 'long',
            defaultValue: 0,
            valueType: 'number'
        },
        
        // Stochastic Signals
        { 
            key: 'stochastic-overbought', 
            name: 'Stochastic Overbought', 
            description: 'Stochastic > 80',
            category: 'oscillator',
            direction: 'short',
            defaultValue: 80,
            valueType: 'number'
        },
        { 
            key: 'stochastic-oversold', 
            name: 'Stochastic Oversold', 
            description: 'Stochastic < 20',
            category: 'oscillator',
            direction: 'long',
            defaultValue: 20,
            valueType: 'number'
        },
        
        // Moving Average Signals
        { 
            key: 'golden-cross', 
            name: 'Golden Cross', 
            description: 'Fast MA crosses above slow MA',
            category: 'trend',
            direction: 'long',
            defaultValue: 0,
            valueType: 'number'
        },
        { 
            key: 'death-cross', 
            name: 'Death Cross', 
            description: 'Fast MA crosses below slow MA',
            category: 'trend',
            direction: 'short',
            defaultValue: 0,
            valueType: 'number'
        },
        
        // Volume Signals
        { 
            key: 'volume-spike', 
            name: 'Volume Spike', 
            description: 'Volume significantly above average',
            category: 'volume',
            direction: 'long',
            defaultValue: 0,
            valueType: 'number'
        },
        
        // Add more signals following the same pattern...
        // (This represents all 70+ signals from the CLI)
    ];
}
