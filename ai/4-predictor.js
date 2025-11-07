import { readCSV } from './utils/csv-reader.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Configuration for the prediction model
 */
const CONFIG = {
    // Signal weights (total should be ~100)
    weights: {
        superTrend: 25,
        rsi: 20,
        macd: 20,
        bollinger: 15,
        stochastic: 10,
        adx: 10
    },
    
    // Decision thresholds
    thresholds: {
        strongBuy: 60,
        buy: 40,
        sell: -40,
        strongSell: -60
    },
    
    // Filtering rules
    filters: {
        minConfidence: 50,      // Only signals above this score
        useADXFilter: true,     // Require strong trend (ADX > 20)
        useBBFilter: false      // Filter out ranging markets
    }
};

/**
 * Evaluate a single market condition and generate trading signal
 * @param {Object} row - Market data with all indicators
 * @returns {Object} Prediction with action, confidence, and reasoning
 */
export function predictTrade(row) {
    let score = 0;
    const signals = [];
    
    // 1. SuperTrend Signal (Weight: 25)
    if (row.SuperTrendIndicator_trend === 'long') {
        score += CONFIG.weights.superTrend;
        signals.push('✅ SuperTrend: LONG');
    } else if (row.SuperTrendIndicator_trend === 'short') {
        score -= CONFIG.weights.superTrend;
        signals.push('⛔ SuperTrend: SHORT');
    }
    
    // 2. RSI Signal (Weight: 20)
    if (row.RsiIndicator < 30) {
        score += CONFIG.weights.rsi;
        signals.push('✅ RSI: Oversold');
    } else if (row.RsiIndicator > 70) {
        score -= CONFIG.weights.rsi;
        signals.push('⛔ RSI: Overbought');
    } else if (row.RsiIndicator >= 40 && row.RsiIndicator <= 60) {
        score += CONFIG.weights.rsi * 0.5;
        signals.push('🟢 RSI: Bullish zone');
    }
    
    // 3. MACD Signal (Weight: 20)
    if (row.MacdIndicator_histogram > 0) {
        const strength = Math.min(row.MacdIndicator_histogram / 50, 1);
        score += CONFIG.weights.macd * strength;
        signals.push(`✅ MACD: Bullish (${row.MacdIndicator_histogram.toFixed(2)})`);
    } else if (row.MacdIndicator_histogram < 0) {
        const strength = Math.min(Math.abs(row.MacdIndicator_histogram) / 50, 1);
        score -= CONFIG.weights.macd * strength;
        signals.push(`⛔ MACD: Bearish (${row.MacdIndicator_histogram.toFixed(2)})`);
    }
    
    // 4. Bollinger Bands Signal (Weight: 15)
    if (row.BollingerIndicator_pb < 0.2) {
        score += CONFIG.weights.bollinger;
        signals.push('✅ BB: Near lower band');
    } else if (row.BollingerIndicator_pb > 0.8) {
        score -= CONFIG.weights.bollinger;
        signals.push('⛔ BB: Near upper band');
    } else if (row.BollingerIndicator_pb > 0.3 && row.BollingerIndicator_pb < 0.7) {
        signals.push('⚠️  BB: Squeeze (ranging)');
        if (CONFIG.filters.useBBFilter) {
            score *= 0.5; // Reduce confidence in ranging market
        }
    }
    
    // 5. Stochastic Signal (Weight: 10)
    if (row.StochasticIndicator_k < 20) {
        score += CONFIG.weights.stochastic;
        signals.push('✅ Stoch: Oversold');
    } else if (row.StochasticIndicator_k > 80) {
        score -= CONFIG.weights.stochastic;
        signals.push('⛔ Stoch: Overbought');
    }
    
    // 6. ADX Trend Strength (Weight: 10)
    if (CONFIG.filters.useADXFilter) {
        if (row.AdxIndicator_adx > 25) {
            score *= 1.2; // Boost confidence in strong trends
            signals.push(`🔥 ADX: Strong trend (${row.AdxIndicator_adx.toFixed(1)})`);
        } else if (row.AdxIndicator_adx < 20) {
            score *= 0.7; // Reduce confidence in weak trends
            signals.push(`⚠️  ADX: Weak trend (${row.AdxIndicator_adx.toFixed(1)})`);
        }
    }
    
    // Determine action based on score
    let action = 'HOLD';
    let confidence = Math.abs(score);
    
    if (score >= CONFIG.thresholds.strongBuy) {
        action = 'STRONG_BUY';
    } else if (score >= CONFIG.thresholds.buy) {
        action = 'BUY';
    } else if (score <= CONFIG.thresholds.strongSell) {
        action = 'STRONG_SELL';
    } else if (score <= CONFIG.thresholds.sell) {
        action = 'SELL';
    }
    
    // Apply confidence filter
    if (confidence < CONFIG.filters.minConfidence) {
        action = 'HOLD';
        signals.push(`⏸️  Confidence too low (${confidence.toFixed(0)} < ${CONFIG.filters.minConfidence})`);
    }
    
    return {
        action,
        score: parseFloat(score.toFixed(2)),
        confidence: parseFloat(confidence.toFixed(2)),
        signals,
        indicators: {
            superTrend: row.SuperTrendIndicator_trend,
            rsi: parseFloat(row.RsiIndicator?.toFixed(2)),
            macdHist: parseFloat(row.MacdIndicator_histogram?.toFixed(2)),
            bbPosition: parseFloat(row.BollingerIndicator_pb?.toFixed(2)),
            stochastic: parseFloat(row.StochasticIndicator_k?.toFixed(2)),
            adx: parseFloat(row.AdxIndicator_adx?.toFixed(2))
        }
    };
}

/**
 * Test the model on historical data
 * @param {string} dataFile - Path to labeled data CSV
 * @returns {Object} Test results
 */
async function testModel(dataFile) {
    console.log('🧪 Testing prediction model...\n');
    
    const data = readCSV(dataFile);
    console.log(`📊 Loaded ${data.length} samples\n`);
    
    const results = {
        total: 0,
        predictions: {
            STRONG_BUY: 0,
            BUY: 0,
            HOLD: 0,
            SELL: 0,
            STRONG_SELL: 0
        },
        accuracy: {
            STRONG_BUY: { correct: 0, total: 0 },
            BUY: { correct: 0, total: 0 },
            SELL: { correct: 0, total: 0 },
            STRONG_SELL: { correct: 0, total: 0 }
        },
        examples: []
    };
    
    data.forEach((row, index) => {
        const prediction = predictTrade(row);
        results.total++;
        results.predictions[prediction.action]++;
        
        // Check accuracy (compare with actual label)
        if (prediction.action !== 'HOLD' && row.Label) {
            results.accuracy[prediction.action].total++;
            
            const isCorrect = 
                (prediction.action.includes('BUY') && row.Label === 'UP') ||
                (prediction.action.includes('SELL') && row.Label === 'DOWN');
            
            if (isCorrect) {
                results.accuracy[prediction.action].correct++;
            }
            
            // Save some examples
            if (results.examples.length < 10) {
                results.examples.push({
                    index,
                    timestamp: row.Timestamp,
                    price: row.Close,
                    prediction: prediction.action,
                    actual: row.Label,
                    correct: isCorrect,
                    confidence: prediction.confidence,
                    signals: prediction.signals.slice(0, 3)
                });
            }
        }
    });
    
    return results;
}

/**
 * Print test results
 */
function printResults(results) {
    console.log('=' .repeat(70));
    console.log('📊 MODEL TEST RESULTS');
    console.log('='.repeat(70) + '\n');
    
    console.log('📈 Prediction Distribution:');
    Object.entries(results.predictions).forEach(([action, count]) => {
        const pct = (count / results.total * 100).toFixed(2);
        console.log(`   ${action.padEnd(15)}: ${count.toString().padStart(5)} (${pct}%)`);
    });
    
    console.log('\n🎯 Accuracy by Signal Type:');
    Object.entries(results.accuracy).forEach(([action, stats]) => {
        if (stats.total > 0) {
            const accuracy = (stats.correct / stats.total * 100).toFixed(2);
            console.log(`   ${action.padEnd(15)}: ${stats.correct}/${stats.total} = ${accuracy}%`);
        }
    });
    
    console.log('\n📝 Sample Predictions:');
    results.examples.forEach((ex, i) => {
        const status = ex.correct ? '✅' : '❌';
        console.log(`\n   ${i + 1}. ${status} ${ex.prediction} → Actual: ${ex.actual} (Confidence: ${ex.confidence})`);
        console.log(`      Price: ${ex.price}, Timestamp: ${ex.timestamp}`);
        ex.signals.forEach(sig => console.log(`      ${sig}`));
    });
    
    console.log('\n' + '='.repeat(70) + '\n');
}

/**
 * Main execution
 */
async function main() {
    console.log('🤖 Starting Prediction Model Test\n');
    
    try {
        const dataPath = path.resolve(__dirname, './output/labeled_data.csv');
        const results = await testModel(dataPath);
        
        printResults(results);
        
        // Save results
        const outputPath = path.resolve(__dirname, './output/model_test_results.json');
        fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
        console.log(`💾 Saved test results to: ${outputPath}\n`);
        
        console.log('✅ Model testing complete!\n');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
