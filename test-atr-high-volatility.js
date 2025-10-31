import { IndicatorList } from './core/indicator/Indicators.js';
import { signalAgent } from './core/cryptoDogSignalAgent.js';

// Create test data with some volatility
const c = Array(100).fill(0).map((_, i) => 100 + Math.sin(i * 0.1) * 10 + Math.random() * 5);
const o = c.map(v => v - 0.5);
const h = c.map(v => v + 1 + Math.random() * 2);
const l = c.map(v => v - 1 - Math.random() * 2);
const v = Array(c.length).fill(1000);

console.log('Testing ATR High Volatility signal...');

// Calculate ATR data
const atrData = IndicatorList.getIndicator('AtrIndicator')(o, h, l, c, v, {period: 14}, []);

console.log(`ATR data length: ${atrData.length}`);
console.log('Sample ATR values:');
for (let i = 20; i < Math.min(30, atrData.length); i++) {
    console.log(`Index ${i}: ATR=${atrData[i]?.toFixed(4)}`);
}

// Test the ATR high volatility signal
let highVolatilitySignals = 0;
const startIndex = 20; // Need some data for ATR calculation

for (let i = startIndex; i < atrData.length; i++) {
    // Calculate ATR moving average (same logic as in backtest)
    const atrPeriod = 10;
    const atrValues = atrData.slice(Math.max(0, i - atrPeriod + 1), i + 1);
    const atrMa = atrValues.length > 0 ? atrValues.reduce((sum, val) => sum + val, 0) / atrValues.length : 0;

    const dataModel = {
        atr: atrData[i],
        atrMa: atrMa
    };

    const result = signalAgent.atrHighVolatility(dataModel, {});
    if (result.signal) {
        highVolatilitySignals++;
        console.log(`High Volatility at index ${i}: ATR=${dataModel.atr.toFixed(4)}, ATR_MA=${dataModel.atrMa.toFixed(4)}`);
    }
}

console.log(`\nTotal high volatility signals: ${highVolatilitySignals}`);
