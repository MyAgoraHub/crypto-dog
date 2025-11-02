import { backtestSignal } from '../core/cryptoDogBacktest.js';

const testSignal = {
    symbol: 'ADAUSDT',
    timeframe: '1h',
    signalType: 'INDICATOR_CrocodileSignal',
    indicator: 'Ema3Indicator',
    indicatorArgs: { period1: 5, period2: 10, period3: 20 },
    evaluate: 'signalAgent.crocodile'
};

console.log('Testing crocodile signal...');
backtestSignal(testSignal, 1, 100, 2, 5, 10000).then(results => {
    console.log('Backtest results:', results);
}).catch(error => {
    console.error('Error:', error);
});
