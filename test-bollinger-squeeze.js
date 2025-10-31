import { backtestSignal } from './core/cryptoDogBacktest.js';

const testSignal = {
    symbol: 'BTCUSDT',
    timeframe: '1h',
    signalType: 'INDICATOR_BollingerSqueezeSignal',
    indicator: 'BollingerIndicator',
    indicatorArgs: {},
    evaluate: 'signalAgent.bollingerSqueeze'
};

console.log('Testing Bollinger Squeeze signal...');
backtestSignal(testSignal, 1, 100, 2, 5, 10000).then(results => {
    console.log('Backtest results:', results.performance);
    console.log('Trades:', results.trades.total);
}).catch(error => {
    console.error('Error:', error);
});
