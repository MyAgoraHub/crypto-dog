import { backtestSignal } from './core/cryptoDogBacktest.js';

const testSignal = {
    symbol: 'BTCUSDT',
    timeframe: '1h',
    signalType: 'INDICATOR_BollingerExpansionSignal',
    indicator: 'BollingerIndicator',
    indicatorArgs: {},
    evaluate: 'signalAgent.bollingerExpansion'
};

console.log('Testing Bollinger Expansion signal...');

// Override the backtest to add debug logging
const originalBacktest = backtestSignal;
const debugBacktest = async (signal, iterations = 1, candles = 100) => {
    console.log(`\n🔄 Backtesting ${signal.signalType} on ${signal.symbol} (${signal.timeframe})...`);

    // Load historical data
    const interval = { '1h': { value: '1h' } }; // Mock interval
    const candleBuffer = [
        [Date.now() - 100*60*60*1000, 100, 105, 95, 102, 1000], // mock candle data
        [Date.now() - 99*60*60*1000, 101, 106, 96, 103, 1000],
        // ... more mock data
    ].slice(0, candles);

    const { o, h, l, c, v, buffer } = {
        o: candleBuffer.map(c => c[1]),
        h: candleBuffer.map(c => c[2]),
        l: candleBuffer.map(c => c[3]),
        c: candleBuffer.map(c => c[4]),
        v: candleBuffer.map(c => c[5]),
        buffer: candleBuffer
    };

    console.log(`📊 Loaded ${c.length} candles`);

    // Calculate indicators
    const IndicatorList = (await import('./core/indicator/Indicators.js')).IndicatorList;
    const getData = IndicatorList.getIndicator(signal.indicator);
    const indicatorData = getData(o, h, l, c, v, signal.indicatorArgs || {}, buffer);

    console.log(`📈 Calculated ${Array.isArray(indicatorData) ? indicatorData.length : 'object'} indicator values`);
    console.log(`📈 First 5 indicator values:`, Array.isArray(indicatorData) ? indicatorData.slice(0, 5) : 'Not an array');

    // Check bandwidth values
    if (Array.isArray(indicatorData)) {
        console.log('Bandwidth analysis:');
        indicatorData.forEach((data, i) => {
            if (data.upper && data.lower && data.middle) {
                const bandwidth = (data.upper - data.lower) / data.middle;
                console.log(`Index ${i}: bandwidth = ${bandwidth.toFixed(4)} (upper: ${data.upper.toFixed(2)}, lower: ${data.lower.toFixed(2)}, middle: ${data.middle.toFixed(2)})`);
            }
        });
    }

    return { indicatorData, c };
};

debugBacktest(testSignal, 1, 50).then(results => {
    console.log('Debug complete');
}).catch(error => {
    console.error('Error:', error);
});
