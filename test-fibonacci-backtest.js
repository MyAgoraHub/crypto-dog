import { backtestSignal } from './core/cryptoDogBacktest.js';

// Test Fibonacci Retracement signal
const fibSignal = {
    signalType: 'INDICATOR_FibonacciRetracementSignal',
    symbol: 'BTCUSDT',
    timeframe: '1h',
    indicator: 'EMAIndicator', // This doesn't matter since we skip indicator calculation
    evaluate: 'signalAgent.fibonacciRetracement',
    value: 0
};

console.log('Testing Fibonacci Retracement signal backtest...');

backtestSignal(fibSignal, 1, 100, 2, 5, 10000)
    .then(result => {
        console.log('\n📊 Fibonacci Retracement Backtest Results:');
        console.log(`Total trades: ${result.trades.total}`);
        console.log(`Win rate: ${result.trades.winRate}%`);
        console.log(`Net profit: $${result.performance.netProfit}`);
        console.log(`Return: ${result.performance.returnPercent}%`);
        console.log(`Max drawdown: ${result.performance.maxDrawdown}%`);

        if (result.trades.total > 0) {
            console.log('✅ Fibonacci Retracement signals are working!');
        } else {
            console.log('❌ No Fibonacci Retracement trades executed');
        }
    })
    .catch(err => {
        console.error('❌ Fibonacci Retracement backtest failed:', err.message);
    });
