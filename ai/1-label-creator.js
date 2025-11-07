import { readCSV, writeCSV } from './utils/csv-reader.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Configuration for labeling
 */
const CONFIG = {
    lookAhead: 3,           // How many candles to look ahead
    upThreshold: 0.3,       // % gain to label as UP
    downThreshold: -0.3,    // % loss to label as DOWN
    inputFile: '../cryptoDogAiContext_BTCUSDT_15m.csv',
    outputFile: './output/labeled_data.csv'
};

/**
 * Label each row based on future price movement
 * @param {Array<Object>} data - Raw CSV data
 * @param {Object} config - Configuration
 * @returns {Array<Object>} Labeled data
 */
function labelData(data, config) {
    const labeled = [];
    
    for (let i = 0; i < data.length - config.lookAhead; i++) {
        const current = data[i];
        const future = data[i + config.lookAhead];
        
        // Handle different field name cases (Close vs close)
        const currentClose = current.Close || current.close;
        const futureClose = future.Close || future.close;
        
        // Calculate price change
        const priceChange = ((futureClose - currentClose) / currentClose) * 100;
        
        // Determine label
        let label = 'NEUTRAL';
        if (priceChange >= config.upThreshold) {
            label = 'UP';
        } else if (priceChange <= config.downThreshold) {
            label = 'DOWN';
        }
        
        // Add metadata
        labeled.push({
            ...current,
            label: label,  // Use lowercase to match predictor
            Label: label,  // Keep uppercase for backward compatibility
            FuturePrice: futureClose,
            PriceChange: priceChange,
            PriceChangePercent: priceChange
        });
    }
    
    return labeled;
}

/**
 * Export function for programmatic use
 * @param {Array<Object>} data - Market data
 * @param {number} lookAhead - Candles to look ahead (default: 3)
 * @param {number} threshold - Price change threshold (default: 0.003 = 0.3%)
 * @returns {Array<Object>} Labeled data
 */
export function labelPriceAction(data, lookAhead = 3, threshold = 0.003) {
    const config = {
        lookAhead,
        upThreshold: threshold * 100,    // Convert to percentage
        downThreshold: -threshold * 100
    };
    
    return labelData(data, config);
}

/**
 * Generate statistics about the labels
 * @param {Array<Object>} labeledData - Data with labels
 * @returns {Object} Label statistics
 */
function getLabelStats(labeledData) {
    const stats = {
        total: labeledData.length,
        UP: 0,
        DOWN: 0,
        NEUTRAL: 0,
        priceChanges: {
            UP: [],
            DOWN: [],
            NEUTRAL: []
        }
    };
    
    labeledData.forEach(row => {
        const label = row.Label || row.label;
        stats[label]++;
        stats.priceChanges[label].push(row.PriceChange);
    });
    
    // Calculate percentages
    stats.distribution = {
        UP: (stats.UP / stats.total * 100).toFixed(2) + '%',
        DOWN: (stats.DOWN / stats.total * 100).toFixed(2) + '%',
        NEUTRAL: (stats.NEUTRAL / stats.total * 100).toFixed(2) + '%'
    };
    
    // Calculate average price changes per label
    Object.keys(stats.priceChanges).forEach(label => {
        const changes = stats.priceChanges[label];
        if (changes.length > 0) {
            const avg = changes.reduce((a, b) => a + b, 0) / changes.length;
            stats.priceChanges[label] = {
                avg: avg.toFixed(4),
                min: Math.min(...changes).toFixed(4),
                max: Math.max(...changes).toFixed(4),
                count: changes.length
            };
        }
    });
    
    return stats;
}

/**
 * Main execution
 */
async function main() {
    console.log('🏷️  Starting Label Creation Process...\n');
    
    try {
        // Read CSV
        const inputPath = path.resolve(__dirname, CONFIG.inputFile);
        console.log(`📖 Reading data from: ${inputPath}`);
        const data = readCSV(inputPath);
        console.log(`✅ Loaded ${data.length} rows\n`);
        
        // Label the data
        console.log(`🔍 Analyzing price movements (looking ${CONFIG.lookAhead} candles ahead)...`);
        console.log(`   UP threshold: +${CONFIG.upThreshold}%`);
        console.log(`   DOWN threshold: ${CONFIG.downThreshold}%\n`);
        
        const labeledData = labelData(data, CONFIG);
        console.log(`✅ Labeled ${labeledData.length} rows\n`);
        
        // Get statistics
        const stats = getLabelStats(labeledData);
        console.log('📊 Label Distribution:');
        console.log(`   UP:      ${stats.UP.toString().padStart(4)} rows (${stats.distribution.UP})`);
        console.log(`   DOWN:    ${stats.DOWN.toString().padStart(4)} rows (${stats.distribution.DOWN})`);
        console.log(`   NEUTRAL: ${stats.NEUTRAL.toString().padStart(4)} rows (${stats.distribution.NEUTRAL})\n`);
        
        console.log('📈 Price Change Stats by Label:');
        Object.keys(stats.priceChanges).forEach(label => {
            const s = stats.priceChanges[label];
            if (s.count > 0) {
                console.log(`   ${label.padEnd(8)}: avg=${s.avg}%, min=${s.min}%, max=${s.max}%`);
            }
        });
        
        // Write output
        const outputPath = path.resolve(__dirname, CONFIG.outputFile);
        writeCSV(outputPath, labeledData);
        console.log(`\n💾 Saved labeled data to: ${outputPath}`);
        console.log(`\n✅ Label creation complete!`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Only run main if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
