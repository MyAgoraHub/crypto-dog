import { backtestSignal } from '../core/cryptoDogBacktest.js';

const signal = {
    symbol: 'ADAUSDT',
    timeframe: '5m',
    signalType: 'INDICATOR_DivergenceDetector',
    indicator: 'MultiDivergenceDetector',
    value: 0,
    evaluate: 'signalAgent.multiDiv'
};

console.log('Testing multi-div signal...');
try {
    const results = await backtestSignal(signal, 1, 50, 2, 5, 10000);
    console.log('✅ Multi-div backtest completed successfully!');
    console.log('Results:', {
        totalTrades: results.trades.total,
        wins: results.trades.wins,
        losses: results.trades.losses,
        winRate: results.trades.winRate,
        netProfit: results.performance.netProfit
    });
} catch (err) {
    console.error('❌ Multi-div backtest failed:', err.message);
    console.error(err.stack);
}
