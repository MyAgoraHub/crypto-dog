import { IndicatorList } from './core/indicator/Indicators.js';
import { signalAgent } from './core/cryptoDogSignalAgent.js';

// Create simple oscillating data that will cause crossovers
const c = [];
for (let i = 0; i < 200; i++) {
    // Create a sine wave pattern that oscillates around 100
    const price = 100 + 20 * Math.sin(i * 0.1);
    c.push(price);
}

const o = c.map(v => v - 0.5);
const h = c.map(v => v + 1);
const l = c.map(v => v - 1);
const v = Array(c.length).fill(1000);

console.log('Testing Golden Cross and Death Cross signals...');
console.log(`Test data: ${c.length} candles`);

// Calculate Ema3Indicator with periods that will show crossovers
const indicatorData = IndicatorList.getIndicator('Ema3Indicator')(o, h, l, c, v, {period1: 3, period2: 8, period3: 15}, []);
console.log(`ema1 length: ${indicatorData.ema1?.length}`);
console.log(`ema2 length: ${indicatorData.ema2?.length}`);
console.log(`ema3 length: ${indicatorData.ema3?.length}`);

// Print some sample EMA values around the crossover points
console.log('\nSample EMA values:');
for (let i = 15; i < Math.min(80, indicatorData.ema2.length, indicatorData.ema3.length); i++) {
    const crossover = indicatorData.ema2[i] > indicatorData.ema3[i] ? 'FAST_ABOVE' : 'FAST_BELOW';
    console.log(`Index ${i}: ema2=${indicatorData.ema2[i]?.toFixed(2)}, ema3=${indicatorData.ema3[i]?.toFixed(2)} [${crossover}]`);
}

// Test the signals starting from where we have all EMAs
const startIndex = 15; // Where ema3 starts being available
let goldenCrossCount = 0;
let deathCrossCount = 0;

for (let i = startIndex + 1; i < Math.min(indicatorData.ema2.length, indicatorData.ema3.length); i++) {
    const dataModel = {
        fast: indicatorData.ema2[i], // 10-period EMA (fast)
        slow: indicatorData.ema3[i], // 20-period EMA (slow)
        previousFast: indicatorData.ema2[i-1],
        previousSlow: indicatorData.ema3[i-1]
    };

    const goldenCrossResult = signalAgent.goldenCross(dataModel, {});
    const deathCrossResult = signalAgent.deathCross(dataModel, {});

    // Debug logging
    if (i >= 38 && i <= 42) {
        console.log(`Index ${i}: fast=${dataModel.fast.toFixed(2)}, slow=${dataModel.slow.toFixed(2)}, prevFast=${dataModel.previousFast.toFixed(2)}, prevSlow=${dataModel.previousSlow.toFixed(2)}`);
        console.log(`  Golden: ${dataModel.fast > dataModel.slow && dataModel.previousFast <= dataModel.previousSlow}`);
        console.log(`  Death: ${dataModel.fast < dataModel.slow && dataModel.previousFast >= dataModel.previousSlow}`);
    }

    if (goldenCrossResult.signal) {
        goldenCrossCount++;
        console.log(`Golden Cross at index ${i}: fast=${dataModel.fast.toFixed(2)}, slow=${dataModel.slow.toFixed(2)} (prev: fast=${dataModel.previousFast.toFixed(2)}, slow=${dataModel.previousSlow.toFixed(2)})`);
    }
    if (deathCrossResult.signal) {
        deathCrossCount++;
        console.log(`Death Cross at index ${i}: fast=${dataModel.fast.toFixed(2)}, slow=${dataModel.slow.toFixed(2)} (prev: fast=${dataModel.previousFast.toFixed(2)}, slow=${dataModel.previousSlow.toFixed(2)})`);
    }

    // Additional debug
    if (i === 39) {
        console.log(`Index 39 debug: deathCrossResult =`, deathCrossResult);
    }
}

console.log(`\nResults:`);
console.log(`Golden Cross signals: ${goldenCrossCount}`);
console.log(`Death Cross signals: ${deathCrossCount}`);
console.log(`Total signals: ${goldenCrossCount + deathCrossCount}`);
