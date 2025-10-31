import { IndicatorList } from './core/indicator/Indicators.js';
import { signalAgent } from './core/cryptoDogSignalAgent.js';

// Create test data
const c = Array(200).fill(0).map((_, i) => 100 + Math.sin(i * 0.1) * 10);
const o = c.map(v => v - 0.5);
const h = c.map(v => v + 1);
const l = c.map(v => v - 1);
const v = Array(c.length).fill(1000);

console.log('Testing Ichimoku TK Cross Bullish signal...');

// Calculate Ichimoku data
const ichimokuData = IndicatorList.getIndicator('IchimokuCloudIndicator')(o, h, l, c, v, {}, []);

console.log(`Candles: ${c.length}, Ichimoku data length: ${ichimokuData.length}`);
console.log(`Difference: ${c.length - ichimokuData.length}`);

// Test the TK cross signal starting from where we have previous data
let bullishCrossSignals = 0;
const startIndex = 1; // Need at least 2 data points for previous values

for (let i = startIndex; i < ichimokuData.length; i++) {
    const dataModel = {
        tenkan: ichimokuData[i].conversion,
        kijun: ichimokuData[i].base,
        previousTenkan: ichimokuData[i-1].conversion,
        previousKijun: ichimokuData[i-1].base
    };

    const result = signalAgent.ichimokuTkCrossBullish(dataModel, {});
    if (result.signal) {
        bullishCrossSignals++;
        console.log(`TK Bullish Cross at index ${i}: tenkan=${dataModel.tenkan.toFixed(2)}, kijun=${dataModel.kijun.toFixed(2)} (prev: tenkan=${dataModel.previousTenkan.toFixed(2)}, kijun=${dataModel.previousKijun.toFixed(2)})`);
    }
}

console.log(`\nTotal TK bullish cross signals: ${bullishCrossSignals}`);
