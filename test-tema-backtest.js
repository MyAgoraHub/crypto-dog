import { backtestSignal } from './core/cryptoDogBacktest.js';

// Test TEMA Bullish signal
const temaBullishSignal = {
    signalType: 'INDICATOR_TemaBullishSignal',
    symbol: 'BTCUSDT',
    timeframe: '1h',
    indicator: 'TemaIndicator',
    evaluate: 'signalAgent.temaBullish',
    value: 0
};

console.log('Testing TEMA Bullish signal backtest...');

backtestSignal(temaBullishSignal, 1, 100, 2, 5, 10000)
    .then(result => {
        console.log('\n📊 TEMA Bullish Backtest Results:');
        console.log(`Total trades: ${result.trades.total}`);
        console.log(`Win rate: ${result.trades.winRate}%`);
        console.log(`Net profit: $${result.performance.netProfit}`);
        console.log(`Return: ${result.performance.returnPercent}%`);
        console.log(`Max drawdown: ${result.performance.maxDrawdown}%`);

        if (result.trades.total > 0) {
            console.log('✅ TEMA Bullish signals are working!');
        } else {
            console.log('❌ No TEMA Bullish trades executed');
        }
    })
    .catch(err => {
        console.error('❌ TEMA Bullish backtest failed:', err.message);
    });
