import { signalAgent } from '../core/cryptoDogSignalAgent.js';

console.log('Testing os function directly:');

// Test case 1: RSI below threshold (should trigger)
const testData1 = { value: 25 };
const testSignal1 = { value: 30 };
const result1 = signalAgent.os(testData1, testSignal1);
console.log('RSI 25 < 30:', result1);

// Test case 2: RSI above threshold (should not trigger)
const testData2 = { value: 35 };
const testSignal2 = { value: 30 };
const result2 = signalAgent.os(testData2, testSignal2);
console.log('RSI 35 < 30:', result2);
