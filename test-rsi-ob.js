import { backtestSignal } from './core/cryptoDogBacktest.js';

const testSignal = {
    symbol: 'ADAUSDT',
    timeframe: '1h',
    signalType: 'INDICATOR_RsiObSignal',
    indicator: 'RsiIndicator',
    indicatorArgs: {},
    value: 70,
    evaluate: 'signalAgent.ob'
};

console.log('Testing RSI overbought signal on ADAUSDT...');
backtestSignal(testSignal, 2, 200, 2, 5, 10000).then(results => {
    console.log('Backtest results:', results);
}).catch(error => {
    console.error('Error:', error);
});
