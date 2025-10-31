import { IndicatorList } from './core/indicator/Indicators.js';
import { signalAgent } from './core/cryptoDogSignalAgent.js';

// Create simple price data that might have support levels
const c = [];
for (let i = 0; i < 100; i++) {
    // Create a trending down pattern with some consolidation
    let price = 100 - i * 0.1; // Downtrend
    if (i > 40 && i < 60) {
        // Consolidation zone around 95-96
        price = 95 + Math.sin(i * 0.5) * 0.5;
    }
    c.push(price);
}

const o = c.map(v => v - 0.1);
const h = c.map(v => v + 0.2);
const l = c.map(v => v - 0.2);
const v = Array(c.length).fill(1000);

console.log('Testing Support Breakout signal...');
console.log(`Test data: ${c.length} candles`);

// Calculate SupportAndResistance indicator
const indicatorData = IndicatorList.getIndicator('SupportAndResistance')(o, h, l, c, v, {period: 25}, []);
console.log(`SupportAndResistance data length: ${indicatorData.length}`);
console.log('Sample indicator data:');
for (let i = 0; i < Math.min(10, indicatorData.length); i++) {
    console.log(`  Index ${i}:`, indicatorData[i]);
}

// Test the signal with different data structures
console.log('\nTesting supportBreakout signal function directly:');

// Test 1: What the signal expects
const expectedDataModel = {
    price: c[50],
    support: 95.5, // Hypothetical support level
    previousPrice: c[49]
};

console.log('Expected data model:', expectedDataModel);
const result1 = signalAgent.supportBreakout(expectedDataModel, {});
console.log('Result with expected data:', result1);

// Test 2: What we currently get from indicator
if (indicatorData.length > 50) {
    const currentIndicatorData = indicatorData[50];
    console.log('Current indicator data at index 50:', currentIndicatorData);

    // Try to use the indicator data directly
    const testDataModel = {
        price: c[50],
        support: currentIndicatorData?.level || 95,
        previousPrice: c[49]
    };

    console.log('Test data model from indicator:', testDataModel);
    const result2 = signalAgent.supportBreakout(testDataModel, {});
    console.log('Result with indicator data:', result2);
}

console.log('\nTesting breakout scenarios:');

// Test breakout above support
const breakoutData = {
    price: 96.5, // Above support
    support: 95.5,
    previousPrice: 95.2 // Was below support
};

console.log('Breakout scenario:', breakoutData);
const breakoutResult = signalAgent.supportBreakout(breakoutData, {});
console.log('Breakout result:', breakoutResult);

// Test no breakout
const noBreakoutData = {
    price: 95.2, // Below support
    support: 95.5,
    previousPrice: 95.1
};

console.log('No breakout scenario:', noBreakoutData);
const noBreakoutResult = signalAgent.supportBreakout(noBreakoutData, {});
console.log('No breakout result:', noBreakoutResult);
