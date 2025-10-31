import { IndicatorList } from './core/indicator/Indicators.js';
import { signalAgent } from './core/cryptoDogSignalAgent.js';

// Create simple test data
const c = Array(100).fill(0).map((_, i) => 100 + Math.sin(i * 0.1) * 10);
const o = c.map(v => v - 0.5);
const h = c.map(v => v + 1);
const l = c.map(v => v - 1);
const v = Array(c.length).fill(1000);

console.log('Testing Ichimoku Bullish signal...');

// Calculate Ichimoku data
const ichimokuData = IndicatorList.getIndicator('IchimokuCloudIndicator')(o, h, l, c, v, {}, []);

console.log(`Ichimoku data length: ${ichimokuData.length}`);
console.log('Sample Ichimoku data:');
for (let i = 0; i < Math.min(10, ichimokuData.length); i++) {
    console.log(`Index ${i}:`, ichimokuData[i]);
}

// Test the signal starting from where Ichimoku is available
let bullishSignals = 0;
// Ichimoku data is shorter than candle data, so we need to offset
const offset = c.length - ichimokuData.length; // Calculate offset

for (let i = 0; i < ichimokuData.length; i++) {
    const candleIndex = i + offset; // Map Ichimoku index to candle index
    const dataModel = {
        price: c[candleIndex],
        spanA: ichimokuData[i].spanA,
        spanB: ichimokuData[i].spanB,
        tenkan: ichimokuData[i].conversion,
        kijun: ichimokuData[i].base
    };

    const result = signalAgent.ichimokuBullish(dataModel, {});
    if (result.signal) {
        bullishSignals++;
        console.log(`Bullish signal at candle ${candleIndex}: price=${c[candleIndex]}, spanA=${dataModel.spanA}, spanB=${dataModel.spanB}, tenkan=${dataModel.tenkan}, kijun=${dataModel.kijun}`);
    }
}

console.log(`\nTotal bullish signals: ${bullishSignals}`);
