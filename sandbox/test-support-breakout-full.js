import { IndicatorList } from '../core/indicator/Indicators.js';
import { signalAgent } from '../core/cryptoDogSignalAgent.js';

// Create price data with a clear support level and breakout
const c = [];
for (let i = 0; i < 100; i++) {
    let price;
    if (i < 50) {
        // Establish support around 95, price stays below
        price = 94.5 + Math.sin(i * 0.2) * 0.3;
    } else if (i < 58) {
        // Drop to support level
        price = 94.8 - (i - 50) * 0.05;
    } else if (i === 58) {
        // At support
        price = 94.75;
    } else {
        // Sharp breakout above support
        price = 95.2 + (i - 58) * 0.15;
    }
    c.push(price);
}

const o = c.map(v => v - 0.1);
const h = c.map(v => v + 0.2);
const l = c.map(v => v - 0.2);
const v = Array(c.length).fill(1000);

console.log('Testing Support Breakout signal with breakout scenario...');
console.log(`Test data: ${c.length} candles`);

// Calculate SupportAndResistance indicator
const indicatorData = IndicatorList.getIndicator('SupportAndResistance')(o, h, l, c, v, {period: 25}, []);
console.log(`SupportAndResistance data length: ${indicatorData.length}`);

// Show support levels found
console.log('\nSupport levels found:');
indicatorData.forEach((zone, index) => {
    if (zone.type === 'Support') {
        console.log(`  Index ${index}: Support at ${zone.level.toFixed(2)}`);
    }
});

// Show all zone types found
console.log('\nAll zones found:');
const zoneCounts = { Support: 0, Resistance: 0, discovery: 0 };
indicatorData.forEach((zone, index) => {
    zoneCounts[zone.type] = (zoneCounts[zone.type] || 0) + 1;
    if (zone.type !== 'discovery') {
        console.log(`  Index ${index}: ${zone.type} at ${zone.level.toFixed(2)}`);
    }
});
console.log(`Zone counts: Support=${zoneCounts.Support}, Resistance=${zoneCounts.Resistance}, Discovery=${zoneCounts.discovery}`);

// Simulate the data model building logic for SupportBreakoutSignal
console.log('\nSimulating backtest data model building:');
let breakoutSignals = 0;

for (let i = 50; i < c.length; i++) {
    // Use a fixed support level based on the consolidation zone
    const supportLevel = 94.8; // Fixed support level from consolidation

    const dataModel = {
        price: c[i],
        support: supportLevel,
        previousPrice: c[i-1]
    };

    // Test the signal
    const result = signalAgent.supportBreakout(dataModel, {});

    if (result.signal) {
        breakoutSignals++;
        console.log(`Support Breakout at index ${i}: price=${c[i].toFixed(2)}, support=${supportLevel}, prev=${c[i-1].toFixed(2)}`);
    }

    // Debug around breakout area
    if (i >= 57 && i <= 62) {
        const condition1 = c[i] > supportLevel;
        const condition2 = c[i-1] <= supportLevel;
        console.log(`Index ${i}: price=${c[i].toFixed(2)}, support=${supportLevel}, prev=${c[i-1].toFixed(2)}`);
        console.log(`  Condition: ${condition1} && ${condition2} = ${condition1 && condition2}`);
    }
}

console.log(`\nResults:`);
console.log(`Support Breakout signals: ${breakoutSignals}`);
console.log(`Total signals: ${breakoutSignals}`);

console.log('\nTesting manual breakout scenario:');

// Test the exact breakout condition
const manualTestData = {
    price: 95.5,      // Above support
    support: 94.8,    // Support level
    previousPrice: 94.7  // Below support
};

const manualResult = signalAgent.supportBreakout(manualTestData, {});
console.log('Manual breakout test:', manualTestData);
console.log('Manual result:', manualResult);

// Test no breakout
const noBreakoutData = {
    price: 94.9,      // Above support
    support: 94.8,    // Support level
    previousPrice: 95.0  // Also above support
};

const noBreakoutResult = signalAgent.supportBreakout(noBreakoutData, {});
console.log('No breakout test:', noBreakoutData);
console.log('No breakout result:', noBreakoutResult);
