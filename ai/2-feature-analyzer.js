import { readCSV, writeCSV } from './utils/csv-reader.js';
import { correlation, mean, groupByStats } from './utils/stats.js';
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
    outputFile: './output/feature_analysis.json',
    minCorrelation: 0.1  // Minimum correlation to consider
};

/**
 * Analyze correlation between indicators and price labels
 * @param {Array<Object>} data - Labeled data
 * @returns {Object} Analysis results
 */
function analyzeFeatures(data) {
    console.log('🔬 Analyzing feature correlations...\n');
    
    // Get all numeric columns (indicators)
    const firstRow = data[0];
    const indicators = Object.keys(firstRow).filter(key => 
        typeof firstRow[key] === 'number' && 
        !['Timestamp', 'Open', 'High', 'Low', 'Close', 'Volume', 'Turnover', 
          'FuturePrice', 'PriceChange', 'PriceChangePercent'].includes(key)
    );
    
    console.log(`📊 Found ${indicators.length} indicators to analyze\n`);
    
    // Convert labels to numeric for correlation
    const labelToNumeric = { 'UP': 1, 'DOWN': -1, 'NEUTRAL': 0 };
    const labels = data.map(row => labelToNumeric[row.Label]);
    
    const analysis = {
        indicators: {},
        topBullishIndicators: [],
        topBearishIndicators: [],
        summary: {}
    };
    
    // Analyze each indicator
    indicators.forEach((indicator, index) => {
        // Get indicator values
        const values = data.map(row => row[indicator]).filter(v => v !== null && !isNaN(v));
        
        if (values.length === 0) return;
        
        // Calculate correlation with labels
        const validPairs = [];
        const validLabels = [];
        data.forEach(row => {
            if (row[indicator] !== null && !isNaN(row[indicator])) {
                validPairs.push(row[indicator]);
                validLabels.push(labelToNumeric[row.Label]);
            }
        });
        
        const corr = correlation(validPairs, validLabels);
        
        // Get stats grouped by label
        const labelStats = groupByStats(data, 'Label', indicator);
        
        analysis.indicators[indicator] = {
            correlation: parseFloat(corr.toFixed(4)),
            byLabel: labelStats,
            predictivePower: Math.abs(corr) > 0.3 ? 'HIGH' : 
                           Math.abs(corr) > 0.15 ? 'MEDIUM' : 'LOW'
        };
        
        // Progress indicator
        if ((index + 1) % 10 === 0) {
            console.log(`   Analyzed ${index + 1}/${indicators.length} indicators...`);
        }
    });
    
    // Sort by correlation
    const sortedIndicators = Object.entries(analysis.indicators)
        .sort((a, b) => Math.abs(b[1].correlation) - Math.abs(a[1].correlation));
    
    // Get top bullish (positive correlation)
    analysis.topBullishIndicators = sortedIndicators
        .filter(([_, data]) => data.correlation > CONFIG.minCorrelation)
        .slice(0, 10)
        .map(([name, data]) => ({ name, correlation: data.correlation, power: data.predictivePower }));
    
    // Get top bearish (negative correlation)
    analysis.topBearishIndicators = sortedIndicators
        .filter(([_, data]) => data.correlation < -CONFIG.minCorrelation)
        .slice(0, 10)
        .map(([name, data]) => ({ name, correlation: data.correlation, power: data.predictivePower }));
    
    // Summary
    analysis.summary = {
        totalIndicators: indicators.length,
        highPredictivePower: sortedIndicators.filter(([_, d]) => d.predictivePower === 'HIGH').length,
        mediumPredictivePower: sortedIndicators.filter(([_, d]) => d.predictivePower === 'MEDIUM').length,
        lowPredictivePower: sortedIndicators.filter(([_, d]) => d.predictivePower === 'LOW').length
    };
    
    return analysis;
}

/**
 * Print analysis results
 * @param {Object} analysis - Analysis results
 */
function printResults(analysis) {
    console.log('\n' + '='.repeat(60));
    console.log('📈 FEATURE ANALYSIS RESULTS');
    console.log('='.repeat(60) + '\n');
    
    console.log('📊 Summary:');
    console.log(`   Total indicators analyzed: ${analysis.summary.totalIndicators}`);
    console.log(`   High predictive power:     ${analysis.summary.highPredictivePower}`);
    console.log(`   Medium predictive power:   ${analysis.summary.mediumPredictivePower}`);
    console.log(`   Low predictive power:      ${analysis.summary.lowPredictivePower}\n`);
    
    console.log('🟢 Top 10 Bullish Indicators (predict UP trends):');
    console.log('   ' + '-'.repeat(56));
    console.log('   ' + 'Indicator'.padEnd(35) + 'Correlation'.padEnd(15) + 'Power');
    console.log('   ' + '-'.repeat(56));
    analysis.topBullishIndicators.forEach((ind, i) => {
        const num = (i + 1).toString().padStart(2);
        const name = ind.name.substring(0, 32).padEnd(35);
        const corr = ind.correlation.toFixed(4).padEnd(15);
        console.log(`   ${num}. ${name}${corr}${ind.power}`);
    });
    
    console.log('\n🔴 Top 10 Bearish Indicators (predict DOWN trends):');
    console.log('   ' + '-'.repeat(56));
    console.log('   ' + 'Indicator'.padEnd(35) + 'Correlation'.padEnd(15) + 'Power');
    console.log('   ' + '-'.repeat(56));
    analysis.topBearishIndicators.forEach((ind, i) => {
        const num = (i + 1).toString().padStart(2);
        const name = ind.name.substring(0, 32).padEnd(35);
        const corr = ind.correlation.toFixed(4).padEnd(15);
        console.log(`   ${num}. ${name}${corr}${ind.power}`);
    });
    
    console.log('\n' + '='.repeat(60) + '\n');
}

/**
 * Export function for programmatic use
 * @param {Array<Object>} data - Labeled data
 * @returns {Array<Object>} Analysis results as array
 */
export function analyzeAllFeatures(data) {
    const analysis = analyzeFeatures(data);
    
    // Return as array for easier consumption
    const indicators = Object.entries(analysis.indicators).map(([name, data]) => ({
        feature: name,
        correlation: data.correlation,
        power: data.predictivePower,
        byLabel: data.byLabel
    }));
    
    return indicators;
}

/**
 * Main execution
 */
async function main() {
    console.log('🔍 Starting Feature Analysis...\n');
    
    try {
        // Read labeled data
        const inputPath = path.resolve(__dirname, CONFIG.inputFile);
        console.log(`📖 Reading labeled data from: ${inputPath}`);
        const data = readCSV(inputPath);
        console.log(`✅ Loaded ${data.length} labeled rows\n`);
        
        // Analyze features
        const analysis = analyzeFeatures(data);
        
        // Print results
        printResults(analysis);
        
        // Save to JSON
        const outputPath = path.resolve(__dirname, CONFIG.outputFile);
        fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
        console.log(`💾 Saved detailed analysis to: ${outputPath}\n`);
        
        console.log('✅ Feature analysis complete!\n');
        
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
