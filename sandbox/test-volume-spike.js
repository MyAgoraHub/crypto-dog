import { IndicatorList } from '../core/indicator/Indicators.js';
import { signalAgent } from '../core/cryptoDogSignalAgent.js';

// Create test data with varying volume
const c = [];
const v = [];
for (let i = 0; i < 100; i++) {
    c.push(100 + Math.sin(i * 0.1) * 10); // Price data

    // Create volume with some spikes
    let volume = 1000;
    if (i === 30 || i === 60 || i === 80) {
        volume = 5000; // Volume spikes
    } else if (i > 25 && i < 35) {
        volume = 2000; // Moderate increase
    }
    v.push(volume);
}

const o = c.map(v => v - 0.5);
const h = c.map(v => v + 1);
const l = c.map(v => v - 1);

console.log('Testing Volume Spike signals...');
console.log(`Test data: ${c.length} candles`);

// Test the volume spike signal
let volumeSpikeCount = 0;

for (let i = 20; i < v.length; i++) {
    // Create data model similar to what backtest does
    const dataModel = {
        volumes: v.slice(Math.max(0, i-20), i+1), // Last 20 volumes including current
        currentVolume: v[i]
    };

    const volumeSpikeResult = signalAgent.volumeSpike(dataModel, {});

    if (volumeSpikeResult.signal) {
        volumeSpikeCount++;
        console.log(`Volume Spike at index ${i}: currentVolume=${v[i]}, avgVolume=${(dataModel.volumes.slice(0, -1).reduce((a, b) => a + b, 0) / Math.min(20, dataModel.volumes.length - 1)).toFixed(0)}`);
    }
}

console.log(`\nResults:`);
console.log(`Volume Spike signals: ${volumeSpikeCount}`);
