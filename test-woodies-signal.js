import { backtestSignal } from './core/cryptoDogBacktest.js';

const testSignal = {
    symbol: 'ADAUSDT',
    timeframe: '1h',
    signalType: 'INDICATOR_Woodies',
    indicator: 'Woodies',
    indicatorArgs: {},
    evaluate: 'signalAgent.woodies'
};

console.log('Testing Woodies signal...');
backtestSignal(testSignal, 1, 100, 2, 5, 10000).then(results => {
    console.log('Backtest results:', results);
}).catch(error => {
    console.error('Error:', error);
});
