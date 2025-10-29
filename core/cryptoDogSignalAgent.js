export const signalAgent = {


    /** usage example
     * @param data {Object} The data object containing values to evaluate
     * @param model {Object} The signal model containing the evaluation criteria
     * @returns {boolean} The result of the evaluation
     *
     * gt({value1: 15}, {value: 10}) => true if data.value1 > 10
     */
    gt: (data, model) => {
        return { signal: data.value > model.value, data:data};
    },
    lt: (data, model) => {
        return { signal: data.value < model.value, data:data};
    },
    eq: (data, model) => {
        return { signal: data.value === model.value, data:data};
    },
    lte: (data, model) => {
        return { signal: data.value <= model.value, data:data};
    },
    gte: (data, model) => {
        return data.value >= model.value;
    },
    crossOver: (data, value) => {
        // Ensure all items are greater than the signal value
        return { signal:  data.all.every(element => element > data.current), data:data }
    },
    crossUnder: (data, value) => {
         return { signal: data.all.every(element => element < data.current), data:data };
    },
    ob: (data, model) => {
        return { signal: data.value > model.value, data:data};
    },
    os: (data, model) => {
        return { signal: data.value < model.value, data:data};
    },
    superTrend: (data, model) => {
        return { signal: data.trend === model.value , trend: data.trend, data:data };
    },
    multiDiv: (data, model) => {
        const confirmedDivergences = data.divergence
            .filter(div => div.type !== 'Pending Divergence')
            .map(div => div.indicator);

            console.log('Confirmed Divergences:', confirmedDivergences);
            if (data.c && data.hasDivergence) {
                return { signal: true, divergence: confirmedDivergences, data:data };
            }
            return { signal: false, divergence: "pending", data:data };
    },
    crocodile: (data, model) => {
        // ema1 fast Moving 
        // ema2 mid lag
        // ema3 long lag
         return { signal: (data.ema2 > data.ema3) && (data.ema1 > data.ema2), data:data}
    },
    crocodileDive: (data, model) => {
        // ema1 fast Moving 
        // ema2 mid lag
        // ema3 long lag
        
        // make  
        return { signal: (data.ema2 < data.ema3) && (data.ema1 < data.ema2), data:data}
    },
    uptrendTrend: (data, model) => {
        // ema1 fast Moving 
        // ema2 long lag
        return { signal: data.c > data, data:data}
    },
    downTrend: (data, model) => {
        return { signal: data.c < data, data:data}
    },

    woodies: (data, model) => {
        // data is the Price Action and indicator Data
        let currentPrice = data.c
        let woodie = data.data.woodies;
        if(currentPrice <= woodie.s2 ) {return {signal:true, type:"strong support", data:data}}
        if(currentPrice <= woodie.s1 ) {return {signal:true, type:"first support", data:data}}
        if(currentPrice >= woodie.r2 ) {return {signal:true, type:"strong resistance", data:data}}
        if(currentPrice >= woodie.r1 ) {return {signal:true, type:"first resistance", data:data}}
        return {signal: false, data:data}
    },

    // MACD Signals
    macdBullish: (data, model) => {
        // MACD line crosses above signal line
        const result = data.macd > data.signal && data.previousMacd <= data.previousSignal;
        return { signal: result, data:data };
    },
    macdBearish: (data, model) => {
        // MACD line crosses below signal line
        return { signal: data.macd < data.signal && data.previousMacd >= data.previousSignal, data:data };
    },
    macdHistogramPositive: (data, model) => {
        // MACD histogram turns positive
        return { signal: data.histogram > 0 && data.previousHistogram <= 0, data:data };
    },
    macdHistogramNegative: (data, model) => {
        // MACD histogram turns negative
        return { signal: data.histogram < 0 && data.previousHistogram >= 0, data:data };
    },

    // Bollinger Band Signals
    bollingerUpperTouch: (data, model) => {
        // Price touches upper Bollinger Band
        return { signal: data.price >= data.upper, data:data };
    },
    bollingerLowerTouch: (data, model) => {
        // Price touches lower Bollinger Band
        return { signal: data.price <= data.lower, data:data };
    },
    bollingerSqueeze: (data, model) => {
        // Bollinger Bands are squeezing (low volatility)
        const bandwidth = (data.upper - data.lower) / data.middle;
        return { signal: bandwidth < 0.05, data:data }; // Less than 5% bandwidth
    },
    bollingerExpansion: (data, model) => {
        // Bollinger Bands are expanding (high volatility)
        const bandwidth = (data.upper - data.lower) / data.middle;
        return { signal: bandwidth > 0.15, data:data }; // More than 15% bandwidth
    },

    // Stochastic Signals
    stochasticOverbought: (data, model) => {
        return { signal: data.k > 80 && data.d > 80, data:data };
    },
    stochasticOversold: (data, model) => {
        return { signal: data.k < 20 && data.d < 20, data:data };
    },
    stochasticBullishCross: (data, model) => {
        // %K crosses above %D
        return { signal: data.k > data.d && data.previousK <= data.previousD, data:data };
    },
    stochasticBearishCross: (data, model) => {
        // %K crosses below %D
        return { signal: data.k < data.d && data.previousK >= data.previousD, data:data };
    },

    // Williams %R Signals
    williamsOverbought: (data, model) => {
        return { signal: data.value > -20, data:data };
    },
    williamsOversold: (data, model) => {
        return { signal: data.value < -80, data:data };
    },

    // Moving Average Signals
    goldenCross: (data, model) => {
        // Fast MA crosses above slow MA (bullish)
        return { signal: data.fast > data.slow && data.previousFast <= data.previousSlow, data:data };
    },
    deathCross: (data, model) => {
        // Fast MA crosses below slow MA (bearish)
        return { signal: data.fast < data.slow && data.previousFast >= data.previousSlow, data:data };
    },
    maSupport: (data, model) => {
        // Price finds support at moving average
        return { signal: data.price > data.ma && data.previousPrice <= data.previousMa, data:data };
    },
    maResistance: (data, model) => {
        // Price hits resistance at moving average
        return { signal: data.price < data.ma && data.previousPrice >= data.previousMa, data:data };
    },

    // Volume Signals
    volumeSpike: (data, model) => {
        // Volume is significantly above average
        const avgVolume = data.volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
        return { signal: data.currentVolume > avgVolume * 2, data:data };
    },
    obvBullish: (data, model) => {
        // OBV trending up while price is up
        return { signal: data.obv > data.previousObv && data.price > data.previousPrice, data:data };
    },
    obvBearish: (data, model) => {
        // OBV trending down while price is down
        return { signal: data.obv < data.previousObv && data.price < data.previousPrice, data:data };
    },

    // Ichimoku Signals
    ichimokuBullish: (data, model) => {
        // Price above cloud, Tenkan above Kijun
        return { signal: data.price > data.spanA && data.price > data.spanB && data.tenkan > data.kijun, data:data };
    },
    ichimokuBearish: (data, model) => {
        // Price below cloud, Tenkan below Kijun
        return { signal: data.price < data.spanA && data.price < data.spanB && data.tenkan < data.kijun, data:data };
    },
    ichimokuTkCrossBullish: (data, model) => {
        // Tenkan crosses above Kijun
        return { signal: data.tenkan > data.kijun && data.previousTenkan <= data.previousKijun, data:data };
    },
    ichimokuTkCrossBearish: (data, model) => {
        // Tenkan crosses below Kijun
        return { signal: data.tenkan < data.kijun && data.previousTenkan >= data.previousKijun, data:data };
    },

    // Fibonacci Signals
    fibonacciRetracement: (data, model) => {
        // Price reaches Fibonacci retracement level
        const fibLevels = [0.236, 0.382, 0.5, 0.618, 0.786];
        const range = data.high - data.low;
        const currentLevel = (data.price - data.low) / range;
        return { signal: fibLevels.some(level => Math.abs(currentLevel - level) < 0.01), data:data };
    },

    // Support/Resistance Signals
    supportBreakout: (data, model) => {
        // Price breaks above identified support level
        return { signal: data.price > data.support && data.previousPrice <= data.support, data:data };
    },
    resistanceBreakout: (data, model) => {
        // Price breaks above identified resistance level
        return { signal: data.price > data.resistance && data.previousPrice <= data.resistance, data:data };
    },

    // ADX Signals (Trend Strength)
    adxStrongTrend: (data, model) => {
        return { signal: data.adx > 25, data:data };
    },
    adxWeakTrend: (data, model) => {
        return { signal: data.adx < 20, data:data };
    },

    // MFI Signals (Money Flow Index)
    mfiOverbought: (data, model) => {
        return { signal: data.value > 80, data:data };
    },
    mfiOversold: (data, model) => {
        return { signal: data.value < 20, data:data };
    },

    // ATR Signals (Average True Range)
    atrHighVolatility: (data, model) => {
        // ATR is above its moving average (high volatility)
        return { signal: data.atr > data.atrMa, data:data };
    },
    atrLowVolatility: (data, model) => {
        // ATR is below its moving average (low volatility)
        return { signal: data.atr < data.atrMa, data:data };
    },

    // Parabolic SAR Signals
    parabolicSarBullish: (data, model) => {
        // PSAR below price (bullish signal)
        return { signal: data.sar < data.price, data:data };
    },
    parabolicSarBearish: (data, model) => {
        // PSAR above price (bearish signal)
        return { signal: data.sar > data.price, data:data };
    },

    // Commodity Channel Index (CCI)
    cciOverbought: (data, model) => {
        return { signal: data.value > 100, data:data };
    },
    cciOversold: (data, model) => {
        return { signal: data.value < -100, data:data };
    },

    // Triple EMA (TEMA) Signals
    temaBullish: (data, model) => {
        // Price above TEMA and TEMA trending up
        return { signal: data.price > data.tema && data.tema > data.previousTema, data:data };
    },
    temaBearish: (data, model) => {
        // Price below TEMA and TEMA trending down
        return { signal: data.price < data.tema && data.tema < data.previousTema, data:data };
    },

    // Keltner Channel Signals
    keltnerUpperBreakout: (data, model) => {
        return { signal: data.price > data.upper && data.previousPrice <= data.upper, data:data };
    },
    keltnerLowerBreakout: (data, model) => {
        return { signal: data.price < data.lower && data.previousPrice >= data.lower, data:data };
    },

    // Donchian Channel Signals
    donchianUpperBreakout: (data, model) => {
        return { signal: data.price > data.upper && data.previousPrice <= data.upper, data:data };
    },
    donchianLowerBreakout: (data, model) => {
        return { signal: data.price < data.lower && data.previousPrice >= data.lower, data:data };
    },

    // Elder Impulse System
    elderImpulseBull: (data, model) => {
        // MACD > Signal, EMA fast > EMA slow (green bar)
        return { signal: data.macd > data.signal && data.emaFast > data.emaSlow, data:data };
    },
    elderImpulseBear: (data, model) => {
        // MACD < Signal, EMA fast < EMA slow (red bar)
        return { signal: data.macd < data.signal && data.emaFast < data.emaSlow, data:data };
    },
    elderImpulseBlue: (data, model) => {
        // Neutral impulse
        return { signal: (data.macd > data.signal && data.emaFast < data.emaSlow) || (data.macd < data.signal && data.emaFast > data.emaSlow), data:data };
    }
}

