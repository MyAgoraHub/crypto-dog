import { backtestSignal } from '../core/cryptoDogBacktest.js';

// Test OBV Bearish signal
const obvBearishSignal = {
    signalType: 'INDICATOR_ObvBearishSignal',
    symbol: 'BTCUSDT',
    timeframe: '1h',
    indicator: 'ObvIndicator',
    evaluate: 'signalAgent.obvBearish',
    value: 0
};

console.log('Testing OBV Bearish signal backtest...');

backtestSignal(obvBearishSignal, 1, 100, 2, 5, 10000)
    .then(result => {
        console.log('\n📊 OBV Bearish Backtest Results:');
        console.log(`Total trades: ${result.trades.total}`);
        console.log(`Win rate: ${result.trades.winRate}%`);
        console.log(`Net profit: $${result.performance.netProfit}`);
        console.log(`Return: ${result.performance.returnPercent}%`);
        console.log(`Max drawdown: ${result.performance.maxDrawdown}%`);

        if (result.trades.total > 0) {
            console.log('✅ OBV Bearish signals are working!');
        } else {
            console.log('❌ No OBV Bearish trades executed');
        }
    })
    .catch(err => {
        console.error('❌ OBV Bearish backtest failed:', err.message);
    });
