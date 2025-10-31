import { IndicatorList } from './core/indicator/Indicators.js';
import { signalAgent } from './core/cryptoDogSignalAgent.js';

// Create test data
const c = [];
for (let i = 0; i < 100; i++) {
    c.push(100 + Math.sin(i * 0.1) * 10); // Price data with trend
}

const o = c.map(v => v - 0.5);
const h = c.map(v => v + 1);
const l = c.map(v => v - 1);
const v = Array(c.length).fill(1000);

console.log('Testing OBV signals...');
console.log(`Test data: ${c.length} candles`);

// Calculate OBV indicator
const indicatorData = IndicatorList.getIndicator('ObvIndicator')(o, h, l, c, v, {}, []);
console.log(`OBV data length: ${indicatorData.length}`);

// Test the OBV signals
let obvBullishCount = 0;
let obvBearishCount = 0;

for (let i = 1; i < indicatorData.length; i++) {
    // Create data model similar to what backtest does
    const dataModel = {
        obv: indicatorData[i],
        previousObv: indicatorData[i-1],
        price: c[i],
        previousPrice: c[i-1]
    };

    const obvBullishResult = signalAgent.obvBullish(dataModel, {});
    const obvBearishResult = signalAgent.obvBearish(dataModel, {});

    if (obvBullishResult.signal) {
        obvBullishCount++;
        console.log(`OBV Bullish at index ${i}: OBV=${indicatorData[i]}, Price=${c[i]}`);
    }
    if (obvBearishResult.signal) {
        obvBearishCount++;
        console.log(`OBV Bearish at index ${i}: OBV=${indicatorData[i]}, Price=${c[i]}`);
    }
}

console.log(`\nResults:`);
console.log(`OBV Bullish signals: ${obvBullishCount}`);
console.log(`OBV Bearish signals: ${obvBearishCount}`);
console.log(`Total OBV signals: ${obvBullishCount + obvBearishCount}`);
