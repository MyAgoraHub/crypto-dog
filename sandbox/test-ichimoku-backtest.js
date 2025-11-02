import { backtestSignal } from '../core/cryptoDogBacktest.js';

// Test Ichimoku TK cross bullish signal in backtest
const signal = {
    signalType: 'INDICATOR_IchimokuTkCrossBullishSignal',
    indicator: 'IchimokuCloudIndicator',
    indicatorArgs: {},
    symbol: 'BTCUSDT',
    timeframe: '1h'
};

console.log('Testing Ichimoku TK Cross Bullish Signal in Backtest...');

try {
    const results = await backtestSignal(signal, 1, 200, 2, 5, 10000);
    console.log('Backtest Results:');
    console.log(`Total Trades: ${results.totalTrades}`);
    console.log(`Wins: ${results.wins}`);
    console.log(`Losses: ${results.losses}`);
    console.log(`Win Rate: ${results.winRate}%`);
    console.log(`Total Profit: $${results.totalProfit}`);
    console.log(`Max Drawdown: ${results.maxDrawdown}%`);
} catch (error) {
    console.error('Backtest error:', error);
}
