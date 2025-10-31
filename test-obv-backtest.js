import { backtestSignal } from './core/cryptoDogBacktest.js';

// Test OBV Bullish signal
const obvBullishSignal = {
    signalType: 'INDICATOR_ObvBullishSignal',
    symbol: 'BTCUSDT',
    timeframe: '1h',
    indicator: 'ObvIndicator',
    evaluate: 'signalAgent.obvBullish',
    value: 0
};

console.log('Testing OBV Bullish signal backtest...');

backtestSignal(obvBullishSignal, 1, 100, 2, 5, 10000)
    .then(result => {
        console.log('\n📊 OBV Bullish Backtest Results:');
        console.log(`Total trades: ${result.trades.total}`);
        console.log(`Win rate: ${result.trades.winRate}%`);
        console.log(`Net profit: $${result.performance.netProfit}`);
        console.log(`Return: ${result.performance.returnPercent}%`);
        console.log(`Max drawdown: ${result.performance.maxDrawdown}%`);

        if (result.trades.total > 0) {
            console.log('✅ OBV Bullish signals are working!');
        } else {
            console.log('❌ No OBV Bullish trades executed');
        }
    })
    .catch(err => {
        console.error('❌ OBV Bullish backtest failed:', err.message);
    });
