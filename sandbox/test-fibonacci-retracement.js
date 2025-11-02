import { signalAgent } from '../core/cryptoDogSignalAgent.js';

// Create test data with a clear uptrend and retracement
const c = [];
const h = [];
const l = [];

// Create an uptrend from 100 to 120, then retracement back to 110
for (let i = 0; i < 50; i++) {
    const basePrice = 100 + (i / 49) * 20; // Trend from 100 to 120
    c.push(basePrice + Math.sin(i * 0.5) * 2); // Add some oscillation
    h.push(c[c.length - 1] + 1 + Math.random() * 2);
    l.push(c[c.length - 1] - 1 - Math.random() * 2);
}

// Add retracement phase
for (let i = 0; i < 30; i++) {
    const retracementProgress = i / 29; // 0 to 1
    const basePrice = 120 - retracementProgress * 10; // Retrace from 120 to 110 (Fib 0.5 level)
    c.push(basePrice + Math.sin(i * 0.3) * 1);
    h.push(c[c.length - 1] + 0.5 + Math.random() * 1);
    l.push(c[c.length - 1] - 0.5 - Math.random() * 1);
}

console.log('Testing Fibonacci Retracement signal...');
console.log(`Test data: ${c.length} candles`);
console.log(`Price range: ${Math.min(...l).toFixed(2)} - ${Math.max(...h).toFixed(2)}`);

// Test the Fibonacci retracement signal
let fibSignals = 0;
const lookback = 20;

for (let i = lookback; i < c.length; i++) {
    // Calculate recent high/low (same logic as in backtest)
    const startIdx = Math.max(0, i - lookback);
    const recentHigh = Math.max(...h.slice(startIdx, i + 1));
    const recentLow = Math.min(...l.slice(startIdx, i + 1));

    const dataModel = {
        high: recentHigh,
        low: recentLow,
        price: c[i]
    };

    const result = signalAgent.fibonacciRetracement(dataModel, {});
    if (result.signal) {
        fibSignals++;
        const range = recentHigh - recentLow;
        const currentLevel = (c[i] - recentLow) / range;
        console.log(`Fibonacci signal at index ${i}: price=${c[i].toFixed(2)}, level=${currentLevel.toFixed(3)}, range=${range.toFixed(2)}`);
    }
}

console.log(`\nTotal Fibonacci retracement signals: ${fibSignals}`);
