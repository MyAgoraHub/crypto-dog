import { loadCandleData } from '../../cryptoDogAgent.js';
import { createIndicatorData } from '../../cryptoDogTools.js';
import {  FloorPivots, 
    Woodies,
    SmaIndicator,
    SuperTrendIndicator,
    RsiIndicator,
    AtrIndicator,
    BollingerIndicator,
    MacdIndicator,
    PatternRecognitionIndicator,
    WilliamsRIndicator,
    KsiIndicator,
    MfiIndicator,
    ObvIndicator,
    Ema4Indicator,
    Ema3Indicator,
    Ema10And20,
    Sma3Indicator,
    AdlIndicator,
    AdxIndicator,
    AwesomeOscillatorIndicator,
    CciIndicator,
    StochasticIndicator,
    IchimokuCloudIndicator,
    WildersSmoothingWeighteMovingAvg,
    WeighteMovingAvg,
    VolumeProfile,
    VolumeWeightedAvgPrice,
    TrixIndicator,
    ForceIndexIndiactor,
    RocIndicator,
    PsarIndicator,
    IndicatorUtils,
    EMAIndicator,
    ZEMAIndicator,
    IndicatorList,
    ZScore,
    MultiDivergenceDetector,
    DynamicGridSignals,
    SupportAndResistance } from '../Indicators.js';

// Cache for storing loaded candle data
const dataCache = new Map();

// Configuration for auto-preloading
let autoPreloadConfig = {
    enabled: true,
    preloadVariants: [
        { iterations: 3, candles: 100 },   // Smaller dataset
        { iterations: 5, candles: 200 },   // Default dataset
        { iterations: 10, candles: 200 }   // Larger dataset
    ]
};

/**
 * Configure auto-preload behavior
 * @param {boolean} enabled - Enable/disable auto-preloading
 * @param {Array} variants - Array of {iterations, candles} combinations to preload
 */
export const configureAutoPreload = (enabled = true, variants = null) => {
    autoPreloadConfig.enabled = enabled;
    if (variants) {
        autoPreloadConfig.preloadVariants = variants;
    }
    console.log(`✓ Auto-preload ${enabled ? 'enabled' : 'disabled'}`);
};

/**
 * Set pre-loaded data in the cache
 * @param {string} category - spot, linear, inverse
 * @param {string} symbol - e.g., BTCUSDT
 * @param {string} interval - e.g., 15, 60, 240
 * @param {number} iterations - number of API calls
 * @param {number} candles - candles per call
 * @param {object} data - The pre-loaded data object {o, h, l, c, v, buffer}
 */
export const setPreloadedData = (category, symbol, interval, iterations, candles, data) => {
    const cacheKey = `${category}_${symbol}_${interval}_${iterations}_${candles}`;
    dataCache.set(cacheKey, {
        data,
        timestamp: Date.now()
    });
    console.log(`✓ Data cached for ${cacheKey}`);
};

/**
 * Clear cached data for specific parameters or all cache
 * @param {string} category - optional, if not provided clears all
 * @param {string} symbol - optional
 * @param {string} interval - optional
 */
export const clearCache = (category = null, symbol = null, interval = null) => {
    if (!category) {
        dataCache.clear();
        console.log('✓ All cache cleared');
        return;
    }
    const prefix = `${category}_${symbol || ''}_${interval || ''}`;
    const keysToDelete = Array.from(dataCache.keys()).filter(key => key.startsWith(prefix));
    keysToDelete.forEach(key => dataCache.delete(key));
    console.log(`✓ Cleared ${keysToDelete.length} cached entries`);
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
    const entries = Array.from(dataCache.entries()).map(([key, value]) => ({
        key,
        age: Math.round((Date.now() - value.timestamp) / 1000) + 's'
    }));
    return {
        size: dataCache.size,
        entries
    };
};

/**
 * Preload additional data variants in the background
 * @param {string} category 
 * @param {string} symbol 
 * @param {string} interval 
 * @param {number} currentIterations - Current request iterations to skip
 * @param {number} currentCandles - Current request candles to skip
 */
const preloadDataVariants = async (category, symbol, interval, currentIterations, currentCandles) => {
    if (!autoPreloadConfig.enabled) return;
    
    // Filter out the current request to avoid duplicate work
    const variantsToPreload = autoPreloadConfig.preloadVariants.filter(
        v => !(v.iterations === currentIterations && v.candles === currentCandles)
    );
    
    console.log(`🔄 Preloading ${variantsToPreload.length} data variants in background...`);
    
    // Preload in background without awaiting
    Promise.all(
        variantsToPreload.map(async (variant) => {
            const preloadKey = `${category}_${symbol}_${interval}_${variant.iterations}_${variant.candles}`;
            
            // Skip if already cached
            if (dataCache.has(preloadKey)) {
                return;
            }
            
            try {
                const dataBuffer = await loadCandleData(category, symbol, interval, variant.iterations, variant.candles);
                const { o, h, l, c, v, buffer } = createIndicatorData(dataBuffer, symbol);
                
                dataCache.set(preloadKey, {
                    data: { o, h, l, c, v, buffer },
                    timestamp: Date.now()
                });
                
                console.log(`✓ Preloaded: ${preloadKey}`);
            } catch (error) {
                console.error(`✗ Failed to preload ${preloadKey}:`, error.message);
            }
        })
    ).catch(err => {
        console.error('Preload error:', err);
    });
};

const fetchData = async (category, symbol, interval, iterations, candles) => {
    const cacheKey = `${category}_${symbol}_${interval}_${iterations}_${candles}`;
    
    // Check if data exists in cache
    if (dataCache.has(cacheKey)) {
        const cached = dataCache.get(cacheKey);
        console.log(`✓ Using cached data for ${cacheKey} (age: ${Math.round((Date.now() - cached.timestamp) / 1000)}s)`);
        return cached.data;
    }
    
    // Check if this is the first fetch for this symbol/interval
    const isFirstFetch = !Array.from(dataCache.keys()).some(
        key => key.startsWith(`${category}_${symbol}_${interval}_`)
    );
    
    // Fetch fresh data
    console.log(`⟳ Fetching fresh data for ${cacheKey}`);
    let dataBuffer = await loadCandleData(category, symbol, interval, iterations, candles);
    console.log('Candle Data Buffer:', dataBuffer);
    let { o,h,l,c,v, buffer } = createIndicatorData(dataBuffer, symbol);
    
    const data = {o,h,l,c,v,buffer};
    
    // Cache the fetched data
    dataCache.set(cacheKey, {
        data,
        timestamp: Date.now()
    });
    
    // If this is the first fetch for this symbol/interval, preload other variants
    if (isFirstFetch && autoPreloadConfig.enabled) {
        console.log(`📦 First fetch detected for ${category}_${symbol}_${interval}`);
        preloadDataVariants(category, symbol, interval, iterations, candles);
    }
    
    return data;
}
export const rsiMarketData = async (category, symbol ,interval, iterations=5, candles = 200, signalConfig = null ) => {
    let {o,h,l,c,v, buffer } = await fetchData(category, symbol, interval, iterations, candles);
    let indicatorData = RsiIndicator.getData(o,h,l,c,v, {period:14}, buffer);
    return {
        symbol: symbol,
        interval: interval,
        type: 'RSI',
        currentValue: indicatorData[indicatorData.length - 1],
        history: indicatorData,
        // signal config is a callback really we make it common so we check if it has a function called evaluate
        signal: signalConfig && typeof signalConfig.evaluate === 'function' ? signalConfig.evaluate(indicatorData[indicatorData.length - 1]) : "no-signal"
    }
}
export const superTrendMarketData = async (category, symbol ,interval , iterations=5, candles = 200, signalConfig = null ) => {
    let {o,h,l,c,v, buffer } = await fetchData(category, symbol, interval, iterations, candles);
    let indicatorData = SuperTrendIndicator.getData(o,h,l,c,v, {multiplier:3,period:7}, buffer);
    return {
        symbol: symbol,
        interval: interval,
        type: 'SuperTrend',
        currentValue: indicatorData[indicatorData.length - 1],
        history: indicatorData,
        signal: signalConfig && typeof signalConfig.evaluate === 'function' ? signalConfig.evaluate(indicatorData[indicatorData.length - 1]) : "no-signal"
    }
}

export const smaMarketData = async (category, symbol, interval, iterations=5, candles=200, signalConfig = null) => {
    let {o,h,l,c,v, buffer } = await fetchData(category, symbol, interval, iterations, candles);
    let indicatorData = SmaIndicator.getData(o,h,l,c,v, {period:20}, buffer);
    return {
        symbol: symbol,
        interval: interval,
        type: 'SMA',
        currentValue: indicatorData[indicatorData.length - 1],
        history: indicatorData,
        signal: signalConfig && typeof signalConfig.evaluate === 'function' ? signalConfig.evaluate(indicatorData[indicatorData.length - 1]) : "no-signal"
    }
}

export const emaMarketData = async (category, symbol, interval, iterations=5, candles=200, signalConfig = null) => {
    let {o,h,l,c,v, buffer } = await fetchData(category, symbol, interval, iterations, candles);
    let indicatorData = EMAIndicator.getData(o,h,l,c,v, {period:20}, buffer);
    return {
        symbol: symbol,
        interval: interval,
        type: 'EMA',
        currentValue: indicatorData[indicatorData.length - 1],
        history: indicatorData,
        signal: signalConfig && typeof signalConfig.evaluate === 'function' ? signalConfig.evaluate(indicatorData[indicatorData.length - 1]) : "no-signal"
    }
}

export const atrMarketData = async (category, symbol, interval, iterations=5, candles=200, signalConfig = null) => {
    let {o,h,l,c,v, buffer } = await fetchData(category, symbol, interval, iterations, candles);
    let indicatorData = AtrIndicator.getData(o,h,l,c,v, {period:14}, buffer);
    return {
        symbol: symbol,
        interval: interval,
        type: 'ATR',
        currentValue: indicatorData[indicatorData.length - 1],
        history: indicatorData,
        signal: signalConfig && typeof signalConfig.evaluate === 'function' ? signalConfig.evaluate(indicatorData[indicatorData.length - 1]) : "no-signal"
    }
}

export const bollingerMarketData = async (category, symbol, interval, iterations=5, candles=200, signalConfig = null) => {
    let {o,h,l,c,v, buffer } = await fetchData(category, symbol, interval, iterations, candles);
    let indicatorData = BollingerIndicator.getData(o,h,l,c,v, {period:20, stdDev:2}, buffer);
    
    // Enhance Bollinger data with close prices for better visualization
    const enhancedHistory = indicatorData.map((bb, index) => ({
        ...bb,
        close: c[index] // Add actual price for context
    }));
    
    return {
        symbol: symbol,
        interval: interval,
        type: 'Bollinger Bands',
        currentValue: indicatorData[indicatorData.length - 1],
        history: enhancedHistory,
        signal: signalConfig && typeof signalConfig.evaluate === 'function' ? signalConfig.evaluate(indicatorData[indicatorData.length - 1]) : "no-signal"
    }
}

export const macdMarketData = async (category, symbol, interval, iterations=5, candles=200, signalConfig = null) => {
    let {o,h,l,c,v, buffer } = await fetchData(category, symbol, interval, iterations, candles);
    let indicatorData = MacdIndicator.getData(o,h,l,c,v, {fastPeriod:12, slowPeriod:26, signalPeriod:9}, buffer);
    return {
        symbol: symbol,
        interval: interval,
        type: 'MACD',
        currentValue: indicatorData[indicatorData.length - 1],
        history: indicatorData,
        signal: signalConfig && typeof signalConfig.evaluate === 'function' ? signalConfig.evaluate(indicatorData[indicatorData.length - 1]) : "no-signal"
    }
}

export const williamsRMarketData = async (category, symbol, interval, iterations=5, candles=200, signalConfig = null) => {
    let {o,h,l,c,v, buffer } = await fetchData(category, symbol, interval, iterations, candles);
    let indicatorData = WilliamsRIndicator.getData(o,h,l,c,v, {period:14}, buffer);
    return {
        symbol: symbol,
        interval: interval,
        type: 'Williams %R',
        currentValue: indicatorData[indicatorData.length - 1],
        history: indicatorData,
        signal: signalConfig && typeof signalConfig.evaluate === 'function' ? signalConfig.evaluate(indicatorData[indicatorData.length - 1]) : "no-signal"
    }
}

export const ksiMarketData = async (category, symbol, interval, iterations=5, candles=200, signalConfig = null) => {
    let {o,h,l,c,v, buffer } = await fetchData(category, symbol, interval, iterations, candles);
    let indicatorData = KsiIndicator.getData(o,h,l,c,v, {period:14}, buffer);
    return {
        symbol: symbol,
        interval: interval,
        type: 'KSI',
        currentValue: indicatorData[indicatorData.length - 1],
        history: indicatorData,
        signal: signalConfig && typeof signalConfig.evaluate === 'function' ? signalConfig.evaluate(indicatorData[indicatorData.length - 1]) : "no-signal"
    }
}

export const mfiMarketData = async (category, symbol, interval, iterations=5, candles=200, signalConfig = null) => {
    let {o,h,l,c,v, buffer } = await fetchData(category, symbol, interval, iterations, candles);
    let indicatorData = MfiIndicator.getData(o,h,l,c,v, {period:14}, buffer);
    return {
        symbol: symbol,
        interval: interval,
        type: 'MFI',
        currentValue: indicatorData[indicatorData.length - 1],
        history: indicatorData,
        signal: signalConfig && typeof signalConfig.evaluate === 'function' ? signalConfig.evaluate(indicatorData[indicatorData.length - 1]) : "no-signal"
    }
}

export const obvMarketData = async (category, symbol, interval, iterations=5, candles=200, signalConfig = null) => {
    let {o,h,l,c,v, buffer } = await fetchData(category, symbol, interval, iterations, candles);
    let indicatorData = ObvIndicator.getData(o,h,l,c,v, {}, buffer);
    return {
        symbol: symbol,
        interval: interval,
        type: 'OBV',
        currentValue: indicatorData[indicatorData.length - 1],
        history: indicatorData,
        signal: signalConfig && typeof signalConfig.evaluate === 'function' ? signalConfig.evaluate(indicatorData[indicatorData.length - 1]) : "no-signal"
    }
}

export const ema4MarketData = async (category, symbol, interval, iterations=5, candles=200, signalConfig = null) => {
    let {o,h,l,c,v, buffer } = await fetchData(category, symbol, interval, iterations, candles);
    let indicatorData = Ema4Indicator.getData(o,h,l,c,v, {}, buffer);
    return {
        symbol: symbol,
        interval: interval,
        type: 'EMA4',
        currentValue: indicatorData[indicatorData.length - 1],
        history: indicatorData,
        signal: signalConfig && typeof signalConfig.evaluate === 'function' ? signalConfig.evaluate(indicatorData[indicatorData.length - 1]) : "no-signal"
    }
}

export const ema3MarketData = async (category, symbol, interval, iterations=5, candles=200, signalConfig = null) => {
    let {o,h,l,c,v, buffer } = await fetchData(category, symbol, interval, iterations, candles);
    let indicatorData = Ema3Indicator.getData(o,h,l,c,v, {}, buffer);
    return {
        symbol: symbol,
        interval: interval,
        type: 'EMA3',
        currentValue: indicatorData[indicatorData.length - 1],
        history: indicatorData,
        signal: signalConfig && typeof signalConfig.evaluate === 'function' ? signalConfig.evaluate(indicatorData[indicatorData.length - 1]) : "no-signal"
    }
}

export const ema10And20MarketData = async (category, symbol, interval, iterations=5, candles=200, signalConfig = null) => {
    let {o,h,l,c,v, buffer } = await fetchData(category, symbol, interval, iterations, candles);
    let indicatorData = Ema10And20.getData(o,h,l,c,v, {}, buffer);
    return {
        symbol: symbol,
        interval: interval,
        type: 'EMA10/20',
        currentValue: indicatorData[indicatorData.length - 1],
        history: indicatorData,
        signal: signalConfig && typeof signalConfig.evaluate === 'function' ? signalConfig.evaluate(indicatorData[indicatorData.length - 1]) : "no-signal"
    }
}

export const sma3MarketData = async (category, symbol, interval, iterations=5, candles=200, signalConfig = null) => {
    let {o,h,l,c,v, buffer } = await fetchData(category, symbol, interval, iterations, candles);
    let indicatorData = Sma3Indicator.getData(o,h,l,c,v, {}, buffer);
    return {
        symbol: symbol,
        interval: interval,
        type: 'SMA3',
        currentValue: indicatorData[indicatorData.length - 1],
        history: indicatorData,
        signal: signalConfig && typeof signalConfig.evaluate === 'function' ? signalConfig.evaluate(indicatorData[indicatorData.length - 1]) : "no-signal"
    }
}

export const adlMarketData = async (category, symbol, interval, iterations=5, candles=200, signalConfig = null) => {
    let {o,h,l,c,v, buffer } = await fetchData(category, symbol, interval, iterations, candles);
    let indicatorData = AdlIndicator.getData(o,h,l,c,v, {}, buffer);
    return {
        symbol: symbol,
        interval: interval,
        type: 'ADL',
        currentValue: indicatorData[indicatorData.length - 1],
        history: indicatorData,
        signal: signalConfig && typeof signalConfig.evaluate === 'function' ? signalConfig.evaluate(indicatorData[indicatorData.length - 1]) : "no-signal"
    }
}

export const adxMarketData = async (category, symbol, interval, iterations=5, candles=200, signalConfig = null) => {
    let {o,h,l,c,v, buffer } = await fetchData(category, symbol, interval, iterations, candles);
    let indicatorData = AdxIndicator.getData(o,h,l,c,v, {period:14}, buffer);
    return {
        symbol: symbol,
        interval: interval,
        type: 'ADX',
        currentValue: indicatorData[indicatorData.length - 1],
        history: indicatorData,
        signal: signalConfig && typeof signalConfig.evaluate === 'function' ? signalConfig.evaluate(indicatorData[indicatorData.length - 1]) : "no-signal"
    }
}

export const awesomeOscillatorMarketData = async (category, symbol, interval, iterations=5, candles=200, signalConfig = null) => {
    let {o,h,l,c,v, buffer } = await fetchData(category, symbol, interval, iterations, candles);
    let indicatorData = AwesomeOscillatorIndicator.getData(o,h,l,c,v, {fastPeriod:5, slowPeriod:34}, buffer);
    return {
        symbol: symbol,
        interval: interval,
        type: 'Awesome Oscillator',
        currentValue: indicatorData[indicatorData.length - 1],
        history: indicatorData,
        signal: signalConfig && typeof signalConfig.evaluate === 'function' ? signalConfig.evaluate(indicatorData[indicatorData.length - 1]) : "no-signal"
    }
}

export const cciMarketData = async (category, symbol, interval, iterations=5, candles=200, signalConfig = null) => {
    let {o,h,l,c,v, buffer } = await fetchData(category, symbol, interval, iterations, candles);
    let indicatorData = CciIndicator.getData(o,h,l,c,v, {period:20}, buffer);
    return {
        symbol: symbol,
        interval: interval,
        type: 'CCI',
        currentValue: indicatorData[indicatorData.length - 1],
        history: indicatorData,
        signal: signalConfig && typeof signalConfig.evaluate === 'function' ? signalConfig.evaluate(indicatorData[indicatorData.length - 1]) : "no-signal"
    }
}

export const stochasticMarketData = async (category, symbol, interval, iterations=5, candles=200, signalConfig = null) => {
    let {o,h,l,c,v, buffer } = await fetchData(category, symbol, interval, iterations, candles);
    let indicatorData = StochasticIndicator.getData(o,h,l,c,v, {period:14, signalPeriod:3}, buffer);
    return {
        symbol: symbol,
        interval: interval,
        type: 'Stochastic',
        currentValue: indicatorData[indicatorData.length - 1],
        history: indicatorData,
        signal: signalConfig && typeof signalConfig.evaluate === 'function' ? signalConfig.evaluate(indicatorData[indicatorData.length - 1]) : "no-signal"
    }
}

export const ichimokuCloudMarketData = async (category, symbol, interval, iterations=5, candles=200, signalConfig = null) => {
    let {o,h,l,c,v, buffer } = await fetchData(category, symbol, interval, iterations, candles);
    let indicatorData = IchimokuCloudIndicator.getData(o,h,l,c,v, {conversionPeriod:9, basePeriod:26, spanPeriod:52, displacement:26}, buffer);
    return {
        symbol: symbol,
        interval: interval,
        type: 'Ichimoku Cloud',
        currentValue: indicatorData[indicatorData.length - 1],
        history: indicatorData,
        signal: signalConfig && typeof signalConfig.evaluate === 'function' ? signalConfig.evaluate(indicatorData[indicatorData.length - 1]) : "no-signal"
    }
}

export const wmaMarketData = async (category, symbol, interval, iterations=5, candles=200, signalConfig = null) => {
    let {o,h,l,c,v, buffer } = await fetchData(category, symbol, interval, iterations, candles);
    let indicatorData = WeighteMovingAvg.getData(o,h,l,c,v, {period:20}, buffer);
    return {
        symbol: symbol,
        interval: interval,
        type: 'WMA',
        currentValue: indicatorData[indicatorData.length - 1],
        history: indicatorData,
        signal: signalConfig && typeof signalConfig.evaluate === 'function' ? signalConfig.evaluate(indicatorData[indicatorData.length - 1]) : "no-signal"
    }
}

export const wildersWmaMarketData = async (category, symbol, interval, iterations=5, candles=200, signalConfig = null) => {
    let {o,h,l,c,v, buffer } = await fetchData(category, symbol, interval, iterations, candles);
    let indicatorData = WildersSmoothingWeighteMovingAvg.getData(o,h,l,c,v, {period:20}, buffer);
    return {
        symbol: symbol,
        interval: interval,
        type: 'Wilders WMA',
        currentValue: indicatorData[indicatorData.length - 1],
        history: indicatorData,
        signal: signalConfig && typeof signalConfig.evaluate === 'function' ? signalConfig.evaluate(indicatorData[indicatorData.length - 1]) : "no-signal"
    }
}

export const volumeProfileMarketData = async (category, symbol, interval, iterations=5, candles=200, signalConfig = null) => {
    let {o,h,l,c,v, buffer } = await fetchData(category, symbol, interval, iterations, candles);
    let indicatorData = VolumeProfile.getData(o,h,l,c,v, {numberOfBins:24}, buffer);
    return {
        symbol: symbol,
        interval: interval,
        type: 'Volume Profile',
        currentValue: indicatorData[indicatorData.length - 1],
        history: indicatorData,
        signal: signalConfig && typeof signalConfig.evaluate === 'function' ? signalConfig.evaluate(indicatorData[indicatorData.length - 1]) : "no-signal"
    }
}

export const vwapMarketData = async (category, symbol, interval, iterations=5, candles=200, signalConfig = null) => {
    let {o,h,l,c,v, buffer } = await fetchData(category, symbol, interval, iterations, candles);
    let indicatorData = VolumeWeightedAvgPrice.getData(o,h,l,c,v, {}, buffer);
    return {
        symbol: symbol,
        interval: interval,
        type: 'VWAP',
        currentValue: indicatorData[indicatorData.length - 1],
        history: indicatorData,
        signal: signalConfig && typeof signalConfig.evaluate === 'function' ? signalConfig.evaluate(indicatorData[indicatorData.length - 1]) : "no-signal"
    }
}

export const trixMarketData = async(category, symbol, interval, iterations=5, candles=200, signalConfig = null) => {
    let {o,h,l,c,v, buffer } = await fetchData(category, symbol, interval, iterations, candles);
    let indicatorData = TrixIndicator.getData(o,h,l,c,v, {period:18}, buffer);
    return {
        symbol: symbol,
        interval: interval,
        type: 'TRIX',
        currentValue: indicatorData[indicatorData.length - 1],
        history: indicatorData,
        signal: signalConfig && typeof signalConfig.evaluate === 'function' ? signalConfig.evaluate(indicatorData[indicatorData.length - 1]) : "no-signal"
    }
}

export const forceIndexMarketData = async (category, symbol, interval, iterations=5, candles=200, signalConfig = null) => {
    let {o,h,l,c,v, buffer } = await fetchData(category, symbol, interval, iterations, candles);
    let indicatorData = ForceIndexIndiactor.getData(o,h,l,c,v, {period:13}, buffer);
    return {
        symbol: symbol,
        interval: interval,
        type: 'Force Index',
        currentValue: indicatorData[indicatorData.length - 1],
        history: indicatorData,
        signal: signalConfig && typeof signalConfig.evaluate === 'function' ? signalConfig.evaluate(indicatorData[indicatorData.length - 1]) : "no-signal"
    }
}

export const rocMarketData = async (category, symbol, interval, iterations=5, candles=200, signalConfig = null) => {
    let {o,h,l,c,v, buffer } = await fetchData(category, symbol, interval, iterations, candles);
    let indicatorData = RocIndicator.getData(o,h,l,c,v, {period:12}, buffer);
    return {
        symbol: symbol,
        interval: interval,
        type: 'ROC',
        currentValue: indicatorData[indicatorData.length - 1],
        history: indicatorData,
        signal: signalConfig && typeof signalConfig.evaluate === 'function' ? signalConfig.evaluate(indicatorData[indicatorData.length - 1]) : "no-signal"
    }
}

export const psarMarketData = async (category, symbol, interval, iterations=5, candles=200, signalConfig = null) => {
    let {o,h,l,c,v, buffer } = await fetchData(category, symbol, interval, iterations, candles);
    let indicatorData = PsarIndicator.getData(o,h,l,c,v, {step:0.02, max:0.2}, buffer);
    return {
        symbol: symbol,
        interval: interval,
        type: 'PSAR',
        currentValue: indicatorData[indicatorData.length - 1],
        history: indicatorData,
        signal: signalConfig && typeof signalConfig.evaluate === 'function' ? signalConfig.evaluate(indicatorData[indicatorData.length - 1]) : "no-signal"
    }
}

export const zemaMarketData = async (category, symbol, interval, iterations=5, candles=200, signalConfig = null) => {
    let {o,h,l,c,v, buffer } = await fetchData(category, symbol, interval, iterations, candles);
    let indicatorData = ZEMAIndicator.getData(o,h,l,c,v, {period:20}, buffer);
    return {
        symbol: symbol,
        interval: interval,
        type: 'ZEMA',
        currentValue: indicatorData[indicatorData.length - 1],
        history: indicatorData,
        signal: signalConfig && typeof signalConfig.evaluate === 'function' ? signalConfig.evaluate(indicatorData[indicatorData.length - 1]) : "no-signal"
    }
}

export const zScoreMarketData = async (category, symbol, interval, iterations=5, candles=200, signalConfig = null) => {
    let {o,h,l,c,v, buffer } = await fetchData(category, symbol, interval, iterations, candles);
    let indicatorData = ZScore.getData(o,h,l,c,v, {period:20}, buffer);
    return {
        symbol: symbol,
        interval: interval,
        type: 'Z-Score',
        currentValue: indicatorData[indicatorData.length - 1],
        history: indicatorData,
        signal: signalConfig && typeof signalConfig.evaluate === 'function' ? signalConfig.evaluate(indicatorData[indicatorData.length - 1]) : "no-signal"
    }
}

export const patternRecognitionMarketData = async (category, symbol, interval, iterations=5, candles=200, signalConfig = null) => {
    let {o,h,l,c,v, buffer } = await fetchData(category, symbol, interval, iterations, candles);
    let indicatorData = PatternRecognitionIndicator.getData(o,h,l,c,v, {}, buffer);
    return {
        symbol: symbol,
        interval: interval,
        type: 'Pattern Recognition',
        currentValue: indicatorData[indicatorData.length - 1],
        history: indicatorData,
        signal: signalConfig && typeof signalConfig.evaluate === 'function' ? signalConfig.evaluate(indicatorData[indicatorData.length - 1]) : "no-signal"
    }
}

export const floorPivotsMarketData = async (category, symbol, interval, iterations=5, candles=200, signalConfig = null) => {
    let {o,h,l,c,v, buffer } = await fetchData(category, symbol, interval, iterations, candles);
    let indicatorData = FloorPivots.getData(o,h,l,c,v, {}, buffer);
    return {
        symbol: symbol,
        interval: interval,
        type: 'Floor Pivots',
        currentValue: indicatorData[indicatorData.length - 1],
        history: indicatorData,
        signal: signalConfig && typeof signalConfig.evaluate === 'function' ? signalConfig.evaluate(indicatorData[indicatorData.length - 1]) : "no-signal"
    }
}

export const woodiesMarketData = async (category, symbol, interval, iterations=5, candles=200, signalConfig = null) => {
    let {o,h,l,c,v, buffer } = await fetchData(category, symbol, interval, iterations, candles);
    let indicatorData = Woodies.getData(o,h,l,c,v, {}, buffer);
    return {
        symbol: symbol,
        interval: interval,
        type: 'Woodies Pivots',
        currentValue: indicatorData[indicatorData.length - 1],
        history: indicatorData,
        signal: signalConfig && typeof signalConfig.evaluate === 'function' ? signalConfig.evaluate(indicatorData[indicatorData.length - 1]) : "no-signal"
    }
}

export const multiDivergenceDetectorMarketData = async (category, symbol, interval, iterations=5, candles=200, signalConfig = null) => {
    let {o,h,l,c,v, buffer } = await fetchData(category, symbol, interval, iterations, candles);
    let indicatorData = MultiDivergenceDetector.getData(o,h,l,c,v, {lookback:15}, buffer);
    return {
        symbol: symbol,
        interval: interval,
        type: 'Multi Divergence Detector',
        currentValue: indicatorData[indicatorData.length - 1],
        history: indicatorData,
        signal: signalConfig && typeof signalConfig.evaluate === 'function' ? signalConfig.evaluate(indicatorData[indicatorData.length - 1]) : "no-signal"
    }
}

export const dynamicGridSignalsMarketData = async (category, symbol, interval, iterations=5, candles=200, signalConfig = null) => {
    let {o,h,l,c,v, buffer } = await fetchData(category, symbol, interval, iterations, candles);
    let indicatorData = DynamicGridSignals.getData(o,h,l,c,v, {gridLevels:10}, buffer);
    return {
        symbol: symbol,
        interval: interval,
        type: 'Dynamic Grid Signals',
        currentValue: indicatorData[indicatorData.length - 1],
        history: indicatorData,
        signal: signalConfig && typeof signalConfig.evaluate === 'function' ? signalConfig.evaluate(indicatorData[indicatorData.length - 1]) : "no-signal"
    }
}

export const supportAndResistanceMarketData = async (category, symbol, interval, iterations=5, candles=200, signalConfig = null) => {
    let {o,h,l,c,v, buffer } = await fetchData(category, symbol, interval, iterations, candles);
    let indicatorData = SupportAndResistance.getData(o,h,l,c,v, {lookback:50}, buffer);
    return {
        symbol: symbol,
        interval: interval,
        type: 'Support and Resistance',
        currentValue: indicatorData[indicatorData.length - 1],
        history: indicatorData,
        signal: signalConfig && typeof signalConfig.evaluate === 'function' ? signalConfig.evaluate(indicatorData[indicatorData.length - 1]) : "no-signal"
    }
}

// Combined EMA with multiple periods (20, 50, 200) for trend analysis
export const emaMultiPeriodMarketData = async (category, symbol, interval, iterations=5, candles=200, signalConfig = null) => {
    let {o,h,l,c,v, buffer } = await fetchData(category, symbol, interval, iterations, candles);
    
    // Calculate EMA for each period
    let ema20Data = EMAIndicator.getData(o,h,l,c,v, {period:20}, buffer);
    let ema50Data = EMAIndicator.getData(o,h,l,c,v, {period:50}, buffer);
    let ema200Data = EMAIndicator.getData(o,h,l,c,v, {period:200}, buffer);
    
    // Combine into a single array of objects
    let combinedData = ema20Data.map((ema20, index) => ({
        ema20: ema20,
        ema50: ema50Data[index],
        ema200: ema200Data[index]
    }));
    
    return {
        symbol: symbol,
        interval: interval,
        type: 'EMA Multi-Period',
        currentValue: combinedData[combinedData.length - 1],
        history: combinedData,
        signal: signalConfig && typeof signalConfig.evaluate === 'function' ? signalConfig.evaluate(combinedData[combinedData.length - 1]) : "no-signal"
    }
}

// Combined SMA with multiple periods (20, 50, 200) for trend analysis
export const smaMultiPeriodMarketData = async (category, symbol, interval, iterations=5, candles=200, signalConfig = null) => {
    let {o,h,l,c,v, buffer } = await fetchData(category, symbol, interval, iterations, candles);
    
    // Calculate SMA for each period
    let sma20Data = SmaIndicator.getData(o,h,l,c,v, {period:20}, buffer);
    let sma50Data = SmaIndicator.getData(o,h,l,c,v, {period:50}, buffer);
    let sma200Data = SmaIndicator.getData(o,h,l,c,v, {period:200}, buffer);
    
    // Combine into a single array of objects
    let combinedData = sma20Data.map((sma20, index) => ({
        sma20: sma20,
        sma50: sma50Data[index],
        sma200: sma200Data[index]
    }));
    
    return {
        symbol: symbol,
        interval: interval,
        type: 'SMA Multi-Period',
        currentValue: combinedData[combinedData.length - 1],
        history: combinedData,
        signal: signalConfig && typeof signalConfig.evaluate === 'function' ? signalConfig.evaluate(combinedData[combinedData.length - 1]) : "no-signal"
    }
}

export const getKlineData = async (category, symbol, interval, iterations=2, candles=200,) => {
    let {o,h,l,c,v, buffer } = await fetchData(category, symbol, interval, iterations, candles);
    return  {o,h,l,c,v, buffer };
}




