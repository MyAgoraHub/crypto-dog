import { backtestSignal } from './core/cryptoDogBacktest.js';

// Test Volume Spike signal in backtest
const signal = {
    signalType: 'INDICATOR_VolumeSpikeSignal',
    indicator: 'ObvIndicator',
    indicatorArgs: {},
    symbol: 'BTCUSDT',
    timeframe: '1h',
    evaluate: 'signalAgent.volumeSpike'
};

console.log('Testing Volume Spike Signal in Backtest...');

try {
    const results = await backtestSignal(signal, 1, 200, 2, 5, 10000);
    console.log('Backtest Results:');
    console.log(`Total Trades: ${results.trades.total}`);
    console.log(`Wins: ${results.trades.wins}`);
    console.log(`Losses: ${results.trades.losses}`);
    console.log(`Win Rate: ${results.trades.winRate}%`);
    console.log(`Total Profit: $${results.performance.netProfit}`);
    console.log(`Max Drawdown: ${results.performance.maxDrawdown}%`);
} catch (error) {
    console.error('Backtest error:', error);
}
