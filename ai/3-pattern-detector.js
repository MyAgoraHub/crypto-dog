import { readCSV } from './utils/csv-reader.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Configuration
 */
const CONFIG = {
    inputFile: './output/labeled_data.csv',
    outputFile: './output/pattern_analysis.json',
    minSupport: 0.05,      // Minimum 5% of data must match pattern
    minConfidence: 0.65    // Pattern must predict correctly 65% of the time
};

/**
 * Define indicator patterns to test
 */
const PATTERNS = [
    // RSI Patterns
    {
        name: 'RSI Oversold',
        condition: (row) => row.RsiIndicator < 30,
        expectedLabel: 'UP'
    },
    {
        name: 'RSI Overbought',
        condition: (row) => row.RsiIndicator > 70,
        expectedLabel: 'DOWN'
    },
    {
        name: 'RSI Bullish',
        condition: (row) => row.RsiIndicator >= 40 && row.RsiIndicator <= 60,
        expectedLabel: 'UP'
    },
    
    // MACD Patterns
    {
        name: 'MACD Bullish Histogram',
        condition: (row) => row.MacdIndicator_histogram > 0,
        expectedLabel: 'UP'
    },
    {
        name: 'MACD Bearish Histogram',
        condition: (row) => row.MacdIndicator_histogram < 0,
        expectedLabel: 'DOWN'
    },
    {
        name: 'MACD Strong Bullish',
        condition: (row) => row.MacdIndicator_histogram > 50,
        expectedLabel: 'UP'
    },
    
    // SuperTrend Patterns
    {
        name: 'SuperTrend Long',
        condition: (row) => row.SuperTrendIndicator_trend === 'long',
        expectedLabel: 'UP'
    },
    {
        name: 'SuperTrend Short',
        condition: (row) => row.SuperTrendIndicator_trend === 'short',
        expectedLabel: 'DOWN'
    },
    
    // Bollinger Bands Patterns
    {
        name: 'BB Near Lower Band',
        condition: (row) => row.BollingerIndicator_pb < 0.2,
        expectedLabel: 'UP'
    },
    {
        name: 'BB Near Upper Band',
        condition: (row) => row.BollingerIndicator_pb > 0.8,
        expectedLabel: 'DOWN'
    },
    {
        name: 'BB Squeeze (Breakout Ready)',
        condition: (row) => row.BollingerIndicator_pb > 0.3 && row.BollingerIndicator_pb < 0.7,
        expectedLabel: 'NEUTRAL'
    },
    
    // Stochastic Patterns
    {
        name: 'Stochastic Oversold',
        condition: (row) => row.StochasticIndicator_k < 20,
        expectedLabel: 'UP'
    },
    {
        name: 'Stochastic Overbought',
        condition: (row) => row.StochasticIndicator_k > 80,
        expectedLabel: 'DOWN'
    },
    
    // ADX Patterns
    {
        name: 'ADX Strong Trend',
        condition: (row) => row.AdxIndicator_adx > 25,
        expectedLabel: 'UP'
    },
    {
        name: 'ADX Weak Trend',
        condition: (row) => row.AdxIndicator_adx < 20,
        expectedLabel: 'NEUTRAL'
    },
    
    // Multi-Indicator Combinations
    {
        name: 'Bullish Convergence (RSI + MACD)',
        condition: (row) => row.RsiIndicator < 40 && row.MacdIndicator_histogram > 0,
        expectedLabel: 'UP'
    },
    {
        name: 'Bearish Convergence (RSI + MACD)',
        condition: (row) => row.RsiIndicator > 60 && row.MacdIndicator_histogram < 0,
        expectedLabel: 'DOWN'
    },
    {
        name: 'Strong Bullish (SuperTrend + MACD + RSI)',
        condition: (row) => row.SuperTrendIndicator_trend === 'long' && 
                          row.MacdIndicator_histogram > 0 && 
                          row.RsiIndicator >= 40 && row.RsiIndicator <= 70,
        expectedLabel: 'UP'
    },
    {
        name: 'Strong Bearish (SuperTrend + MACD + RSI)',
        condition: (row) => row.SuperTrendIndicator_trend === 'short' && 
                          row.MacdIndicator_histogram < 0 && 
                          row.RsiIndicator >= 30 && row.RsiIndicator <= 60,
        expectedLabel: 'DOWN'
    },
    {
        name: 'Reversal Signal (Oversold RSI + Bullish Stoch)',
        condition: (row) => row.RsiIndicator < 35 && row.StochasticIndicator_k < 30,
        expectedLabel: 'UP'
    },
    {
        name: 'High Volume Bullish',
        condition: (row) => row.MfiIndicator > 50 && row.MacdIndicator_histogram > 0,
        expectedLabel: 'UP'
    }
];

/**
 * Analyze pattern effectiveness
 * @param {Array<Object>} data - Labeled data
 * @param {Array<Object>} patterns - Patterns to test
 * @returns {Object} Pattern analysis results
 */
function analyzePatterns(data, patterns) {
    console.log(`🔍 Testing ${patterns.length} patterns...\n`);
    
    const results = [];
    const minSupportCount = Math.floor(data.length * CONFIG.minSupport);
    
    patterns.forEach((pattern, index) => {
        let matches = 0;
        let correct = 0;
        let labelCounts = { UP: 0, DOWN: 0, NEUTRAL: 0 };
        
        // Test pattern against all data
        data.forEach(row => {
            try {
                if (pattern.condition(row)) {
                    matches++;
                    labelCounts[row.Label]++;
                    if (row.Label === pattern.expectedLabel) {
                        correct++;
                    }
                }
            } catch (error) {
                // Skip rows with missing data
            }
        });
        
        if (matches > 0) {
            const support = matches / data.length;
            const confidence = correct / matches;
            
            results.push({
                name: pattern.name,
                expectedLabel: pattern.expectedLabel,
                matches: matches,
                correct: correct,
                support: parseFloat((support * 100).toFixed(2)),
                confidence: parseFloat((confidence * 100).toFixed(2)),
                labelDistribution: labelCounts,
                meetsThreshold: support >= CONFIG.minSupport && confidence >= CONFIG.minConfidence
            });
        }
        
        if ((index + 1) % 5 === 0) {
            console.log(`   Tested ${index + 1}/${patterns.length} patterns...`);
        }
    });
    
    // Sort by confidence * support (effectiveness)
    results.sort((a, b) => (b.confidence * b.support) - (a.confidence * a.support));
    
    return results;
}

/**
 * Print pattern analysis results
 * @param {Array<Object>} results - Pattern results
 */
function printResults(results) {
    console.log('\n' + '='.repeat(80));
    console.log('🎯 PATTERN ANALYSIS RESULTS');
    console.log('='.repeat(80) + '\n');
    
    // Filter patterns that meet threshold
    const effectivePatterns = results.filter(r => r.meetsThreshold);
    
    console.log(`📊 Summary:`);
    console.log(`   Total patterns tested:     ${results.length}`);
    console.log(`   Effective patterns found:  ${effectivePatterns.length}`);
    console.log(`   Minimum support:           ${(CONFIG.minSupport * 100).toFixed(0)}%`);
    console.log(`   Minimum confidence:        ${(CONFIG.minConfidence * 100).toFixed(0)}%\n`);
    
    if (effectivePatterns.length > 0) {
        console.log('✅ Top Effective Patterns:');
        console.log('   ' + '-'.repeat(76));
        console.log('   ' + 'Pattern'.padEnd(42) + 'Predict'.padEnd(8) + 
                    'Support'.padEnd(10) + 'Confidence'.padEnd(12) + 'Matches');
        console.log('   ' + '-'.repeat(76));
        
        effectivePatterns.slice(0, 15).forEach((pattern, i) => {
            const num = (i + 1).toString().padStart(2);
            const name = pattern.name.substring(0, 38).padEnd(42);
            const label = pattern.expectedLabel.padEnd(8);
            const support = (pattern.support + '%').padEnd(10);
            const conf = (pattern.confidence + '%').padEnd(12);
            const matches = pattern.matches.toString();
            
            console.log(`   ${num}. ${name}${label}${support}${conf}${matches}`);
        });
    }
    
    console.log('\n📈 All Patterns (sorted by effectiveness):');
    console.log('   ' + '-'.repeat(76));
    results.forEach((pattern, i) => {
        const num = (i + 1).toString().padStart(2);
        const name = pattern.name.substring(0, 38).padEnd(42);
        const label = pattern.expectedLabel.padEnd(8);
        const support = (pattern.support + '%').padEnd(10);
        const conf = (pattern.confidence + '%').padEnd(12);
        const status = pattern.meetsThreshold ? '✅' : '  ';
        
        console.log(`   ${num}. ${name}${label}${support}${conf}${status}`);
    });
    
    console.log('\n' + '='.repeat(80) + '\n');
}

/**
 * Main execution
 */
async function main() {
    console.log('🎯 Starting Pattern Detection...\n');
    
    try {
        // Read labeled data
        const inputPath = path.resolve(__dirname, CONFIG.inputFile);
        console.log(`📖 Reading labeled data from: ${inputPath}`);
        const data = readCSV(inputPath);
        console.log(`✅ Loaded ${data.length} labeled rows\n`);
        
        // Analyze patterns
        const results = analyzePatterns(data, PATTERNS);
        
        // Print results
        printResults(results);
        
        // Save to JSON
        const outputPath = path.resolve(__dirname, CONFIG.outputFile);
        fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
        console.log(`💾 Saved pattern analysis to: ${outputPath}\n`);
        
        console.log('✅ Pattern detection complete!\n');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

/**
 * Export function for programmatic use
 * @param {Array<Object>} data - Labeled data
 * @returns {Array<Object>} Pattern analysis results
 */
export function detectAllPatterns(data) {
    const patterns = analyzePatterns(data, PATTERNS);
    return patterns;  // Return the array directly, not results.patterns
}

// Only run main if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
