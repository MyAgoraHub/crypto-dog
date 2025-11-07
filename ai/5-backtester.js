import { readCSV } from './utils/csv-reader.js';
import { predictTrade } from './4-predictor.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Backtesting configuration
 */
const CONFIG = {
    inputFile: './output/labeled_data.csv',
    outputFile: './output/backtest_results.json',
    
    // Trading parameters
    initialCapital: 10000,      // Starting capital in USDT
    positionSize: 0.95,         // Use 95% of capital per trade
    tradeFee: 0.001,            // 0.1% trading fee
    
    // Risk management
    stopLossPercent: 2.0,       // 2% stop loss
    takeProfitPercent: 3.0,     // 3% take profit
    
    // Signal filtering
    minConfidence: 50,          // Only trade signals above this confidence
    onlyStrongSignals: false    // Only trade STRONG_BUY/STRONG_SELL
};

/**
 * Simulate trading based on model predictions
 * @param {Array<Object>} data - Historical data with labels
 * @returns {Object} Backtest results
 */
function backtest(data) {
    console.log('🔄 Running backtest simulation...\n');
    
    let capital = CONFIG.initialCapital;
    let position = null;
    const trades = [];
    const equity = [];
    
    for (let i = 0; i < data.length - 1; i++) {
        const current = data[i];
        const next = data[i + 1];
        
        // Record equity
        const currentEquity = position 
            ? position.quantity * current.Close 
            : capital;
        equity.push({
            timestamp: current.Timestamp,
            value: currentEquity,
            price: current.Close
        });
        
        // Get prediction
        const prediction = predictTrade(current);
        
        // Skip if confidence too low
        if (prediction.confidence < CONFIG.minConfidence) {
            continue;
        }
        
        // Skip if only trading strong signals
        if (CONFIG.onlyStrongSignals && 
            !['STRONG_BUY', 'STRONG_SELL'].includes(prediction.action)) {
            continue;
        }
        
        // ENTRY LOGIC
        if (!position) {
            if (prediction.action === 'BUY' || prediction.action === 'STRONG_BUY') {
                // Enter LONG
                const investAmount = capital * CONFIG.positionSize;
                const fee = investAmount * CONFIG.tradeFee;
                const quantity = (investAmount - fee) / current.Close;
                
                position = {
                    type: 'LONG',
                    entryPrice: current.Close,
                    entryTime: current.Timestamp,
                    quantity: quantity,
                    stopLoss: current.Close * (1 - CONFIG.stopLossPercent / 100),
                    takeProfit: current.Close * (1 + CONFIG.takeProfitPercent / 100),
                    confidence: prediction.confidence
                };
                
                capital -= investAmount;
                
            } else if (prediction.action === 'SELL' || prediction.action === 'STRONG_SELL') {
                // Enter SHORT (simplified - assume we can short)
                const investAmount = capital * CONFIG.positionSize;
                const fee = investAmount * CONFIG.tradeFee;
                const quantity = (investAmount - fee) / current.Close;
                
                position = {
                    type: 'SHORT',
                    entryPrice: current.Close,
                    entryTime: current.Timestamp,
                    quantity: quantity,
                    stopLoss: current.Close * (1 + CONFIG.stopLossPercent / 100),
                    takeProfit: current.Close * (1 - CONFIG.takeProfitPercent / 100),
                    confidence: prediction.confidence
                };
                
                capital -= investAmount;
            }
        }
        
        // EXIT LOGIC
        if (position) {
            let exitReason = null;
            let exitPrice = null;
            
            // Check stop loss / take profit
            if (position.type === 'LONG') {
                if (next.Low <= position.stopLoss) {
                    exitReason = 'STOP_LOSS';
                    exitPrice = position.stopLoss;
                } else if (next.High >= position.takeProfit) {
                    exitReason = 'TAKE_PROFIT';
                    exitPrice = position.takeProfit;
                } else if (prediction.action === 'SELL' || prediction.action === 'STRONG_SELL') {
                    exitReason = 'SIGNAL_REVERSAL';
                    exitPrice = next.Close;
                }
            } else { // SHORT
                if (next.High >= position.stopLoss) {
                    exitReason = 'STOP_LOSS';
                    exitPrice = position.stopLoss;
                } else if (next.Low <= position.takeProfit) {
                    exitReason = 'TAKE_PROFIT';
                    exitPrice = position.takeProfit;
                } else if (prediction.action === 'BUY' || prediction.action === 'STRONG_BUY') {
                    exitReason = 'SIGNAL_REVERSAL';
                    exitPrice = next.Close;
                }
            }
            
            // Execute exit
            if (exitReason) {
                const exitValue = position.quantity * exitPrice;
                const fee = exitValue * CONFIG.tradeFee;
                const netValue = exitValue - fee;
                
                let profit;
                if (position.type === 'LONG') {
                    profit = netValue - (position.quantity * position.entryPrice);
                } else {
                    profit = (position.quantity * position.entryPrice) - netValue;
                }
                
                capital += netValue;
                
                const profitPercent = (profit / (position.quantity * position.entryPrice)) * 100;
                
                trades.push({
                    type: position.type,
                    entryPrice: position.entryPrice,
                    exitPrice: exitPrice,
                    entryTime: position.entryTime,
                    exitTime: next.Timestamp,
                    quantity: position.quantity,
                    profit: profit,
                    profitPercent: profitPercent,
                    exitReason: exitReason,
                    confidence: position.confidence
                });
                
                position = null;
            }
        }
    }
    
    // Close any open position at the end
    if (position) {
        const lastPrice = data[data.length - 1].Close;
        const exitValue = position.quantity * lastPrice;
        const fee = exitValue * CONFIG.tradeFee;
        capital += exitValue - fee;
    }
    
    return { trades, equity, finalCapital: capital };
}

/**
 * Calculate performance metrics
 * @param {Object} backtestResults - Results from backtest
 * @returns {Object} Performance metrics
 */
function calculateMetrics(backtestResults) {
    const { trades, equity, finalCapital } = backtestResults;
    
    if (trades.length === 0) {
        return { error: 'No trades executed' };
    }
    
    const winningTrades = trades.filter(t => t.profit > 0);
    const losingTrades = trades.filter(t => t.profit < 0);
    
    const totalProfit = trades.reduce((sum, t) => sum + t.profit, 0);
    const totalReturn = ((finalCapital - CONFIG.initialCapital) / CONFIG.initialCapital) * 100;
    
    const avgWin = winningTrades.length > 0 
        ? winningTrades.reduce((sum, t) => sum + t.profit, 0) / winningTrades.length 
        : 0;
    const avgLoss = losingTrades.length > 0 
        ? Math.abs(losingTrades.reduce((sum, t) => sum + t.profit, 0) / losingTrades.length)
        : 0;
    
    const profitFactor = losingTrades.length > 0 
        ? Math.abs(winningTrades.reduce((sum, t) => sum + t.profit, 0) / 
                   losingTrades.reduce((sum, t) => sum + t.profit, 0))
        : Infinity;
    
    // Calculate max drawdown
    let maxEquity = CONFIG.initialCapital;
    let maxDrawdown = 0;
    equity.forEach(point => {
        if (point.value > maxEquity) maxEquity = point.value;
        const drawdown = ((maxEquity - point.value) / maxEquity) * 100;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });
    
    return {
        totalTrades: trades.length,
        winningTrades: winningTrades.length,
        losingTrades: losingTrades.length,
        winRate: (winningTrades.length / trades.length * 100).toFixed(2) + '%',
        
        totalProfit: totalProfit.toFixed(2),
        totalReturn: totalReturn.toFixed(2) + '%',
        
        avgWin: avgWin.toFixed(2),
        avgLoss: avgLoss.toFixed(2),
        profitFactor: profitFactor === Infinity ? '∞' : profitFactor.toFixed(2),
        
        maxDrawdown: maxDrawdown.toFixed(2) + '%',
        
        initialCapital: CONFIG.initialCapital,
        finalCapital: finalCapital.toFixed(2),
        
        bestTrade: Math.max(...trades.map(t => t.profitPercent)).toFixed(2) + '%',
        worstTrade: Math.min(...trades.map(t => t.profitPercent)).toFixed(2) + '%'
    };
}

/**
 * Print backtest results
 */
function printResults(metrics, trades) {
    console.log('\n' + '='.repeat(70));
    console.log('📊 BACKTEST RESULTS');
    console.log('='.repeat(70) + '\n');
    
    console.log('💰 Performance Summary:');
    console.log(`   Initial Capital:    $${metrics.initialCapital}`);
    console.log(`   Final Capital:      $${metrics.finalCapital}`);
    console.log(`   Total Return:       ${metrics.totalReturn}`);
    console.log(`   Total Profit:       $${metrics.totalProfit}\n`);
    
    console.log('📈 Trading Statistics:');
    console.log(`   Total Trades:       ${metrics.totalTrades}`);
    console.log(`   Winning Trades:     ${metrics.winningTrades}`);
    console.log(`   Losing Trades:      ${metrics.losingTrades}`);
    console.log(`   Win Rate:           ${metrics.winRate}\n`);
    
    console.log('📊 Performance Metrics:');
    console.log(`   Average Win:        $${metrics.avgWin}`);
    console.log(`   Average Loss:       $${metrics.avgLoss}`);
    console.log(`   Profit Factor:      ${metrics.profitFactor}`);
    console.log(`   Max Drawdown:       ${metrics.maxDrawdown}\n`);
    
    console.log(`   Best Trade:         ${metrics.bestTrade}`);
    console.log(`   Worst Trade:        ${metrics.worstTrade}\n`);
    
    console.log('🔍 Recent Trades (last 10):');
    trades.slice(-10).forEach((trade, i) => {
        const profit = trade.profit > 0 ? '✅' : '❌';
        const type = trade.type === 'LONG' ? '🟢' : '🔴';
        console.log(`   ${i + 1}. ${profit} ${type} ${trade.type} @ $${trade.entryPrice.toFixed(2)} → $${trade.exitPrice.toFixed(2)}`);
        console.log(`      Profit: $${trade.profit.toFixed(2)} (${trade.profitPercent.toFixed(2)}%) - ${trade.exitReason}`);
    });
    
    console.log('\n' + '='.repeat(70) + '\n');
}

/**
 * Run backtest with custom data
 * @param {Array} data - Labeled data to backtest
 * @param {Object} config - Optional configuration override
 * @returns {Object} - { metrics, trades, equity }
 */
export function runBacktest(data, config = {}) {
    const backtestConfig = { ...CONFIG, ...config };
    
    // Update global CONFIG for backtest function
    Object.assign(CONFIG, backtestConfig);
    
    // Run backtest
    const results = backtest(data);
    
    // Calculate metrics
    const metrics = calculateMetrics(results);
    
    return {
        config: backtestConfig,
        metrics,
        trades: results.trades,
        equity: results.equity
    };
}

/**
 * Main execution
 */
async function main() {
    console.log('🎯 Starting Backtest Simulation\n');
    console.log(`⚙️  Configuration:`);
    console.log(`   Initial Capital:    $${CONFIG.initialCapital}`);
    console.log(`   Position Size:      ${CONFIG.positionSize * 100}%`);
    console.log(`   Trading Fee:        ${CONFIG.tradeFee * 100}%`);
    console.log(`   Stop Loss:          ${CONFIG.stopLossPercent}%`);
    console.log(`   Take Profit:        ${CONFIG.takeProfitPercent}%`);
    console.log(`   Min Confidence:     ${CONFIG.minConfidence}\n`);
    
    try {
        const dataPath = path.resolve(__dirname, CONFIG.inputFile);
        console.log(`📖 Loading data from: ${dataPath}`);
        const data = readCSV(dataPath);
        console.log(`✅ Loaded ${data.length} candles\n`);
        
        // Run backtest
        const results = runBacktest(data);
        
        // Print results
        printResults(results.metrics, results.trades);
        
        // Save detailed results
        const outputPath = path.resolve(__dirname, CONFIG.outputFile);
        fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
        
        console.log(`💾 Saved detailed results to: ${outputPath}\n`);
        console.log('✅ Backtest complete!\n');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Only run main if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
