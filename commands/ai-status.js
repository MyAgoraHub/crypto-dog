import chalk from 'chalk';
import { readCSV } from '../ai/utils/csv-reader.js';
import fs from 'fs';

/**
 * Group indicator columns by their base name
 */
function groupIndicators(headers) {
    const groups = new Map();
    
    // Base OHLCV fields
    const baseFields = ['timestamp', 'openTime', 'open', 'high', 'low', 'close', 'volume', 'quoteVolume'];
    
    headers.forEach(header => {
        // Skip base OHLCV fields
        if (baseFields.includes(header)) {
            if (!groups.has('Price')) {
                groups.set('Price', []);
            }
            groups.get('Price').push(header);
            return;
        }
        
        // Group by indicator name (before underscore or number)
        const baseName = header.split('_')[0].split(/\d/)[0];
        
        if (!groups.has(baseName)) {
            groups.set(baseName, []);
        }
        groups.get(baseName).push(header);
    });
    
    return groups;
}

/**
 * Format value for display
 */
function formatValue(value, key) {
    if (value === null || value === undefined || value === '') {
        return chalk.gray('N/A');
    }
    
    // Timestamps
    if (key.toLowerCase().includes('time')) {
        const date = new Date(parseInt(value));
        return chalk.cyan(date.toISOString().replace('T', ' ').slice(0, 19));
    }
    
    // Prices (open, high, low, close)
    if (['open', 'high', 'low', 'close'].includes(key.toLowerCase())) {
        return chalk.green('$' + parseFloat(value).toFixed(2));
    }
    
    // Volume
    if (key.toLowerCase().includes('volume')) {
        return chalk.yellow(parseFloat(value).toFixed(2));
    }
    
    // Percentages or decimals
    if (typeof value === 'number' || !isNaN(parseFloat(value))) {
        const num = parseFloat(value);
        
        // Very small numbers (likely percentages in decimal form)
        if (Math.abs(num) < 1 && Math.abs(num) > 0.0001) {
            return chalk.white(num.toFixed(4));
        }
        
        // Large numbers (prices, volumes)
        if (Math.abs(num) > 1000) {
            return chalk.white(num.toFixed(2));
        }
        
        // Regular numbers
        return chalk.white(num.toFixed(2));
    }
    
    // Strings (like 'long', 'short')
    if (value === 'long') return chalk.green(value);
    if (value === 'short') return chalk.red(value);
    
    return chalk.white(value.toString());
}

/**
 * Print current market status from CSV
 */
async function printMarketStatus(csvPath) {
    try {
        // Check if file exists
        if (!fs.existsSync(csvPath)) {
            console.log(chalk.red(`\n✗ CSV file not found: ${csvPath}\n`));
            return;
        }
        
        // Read CSV data
        const data = await readCSV(csvPath);
        
        if (data.length === 0) {
            console.log(chalk.red('\n✗ No data found in CSV\n'));
            return;
        }
        
        // Get last row
        const lastRow = data[data.length - 1];
        const headers = Object.keys(lastRow);
        
        // Extract symbol and interval from filename
        const match = csvPath.match(/cryptoDogAiContext_([A-Z]+)_(\d+[mhd])\.csv/);
        const symbol = match ? match[1] : 'UNKNOWN';
        const interval = match ? match[2] : 'UNKNOWN';
        
        // Print header
        console.log(chalk.cyan('\n' + '═'.repeat(60)));
        console.log(chalk.cyan.bold(`  📊 MARKET STATUS: ${symbol} ${interval}`));
        console.log(chalk.cyan('═'.repeat(60) + '\n'));
        
        // Print timestamp
        const timestamp = lastRow.timestamp || lastRow.openTime;
        if (timestamp) {
            const date = new Date(parseInt(timestamp));
            console.log(chalk.white(`  ⏰ Time: ${chalk.cyan(date.toISOString().replace('T', ' ').slice(0, 19) + ' UTC')}`));
            console.log('');
        }
        
        // Print OHLCV
        console.log(chalk.yellow('  💰 Price Action:'));
        console.log(chalk.gray('  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─'));
        
        const ohlcv = {
            'Open': lastRow.open || lastRow.Open,
            'High': lastRow.high || lastRow.High,
            'Low': lastRow.low || lastRow.Low,
            'Close': lastRow.close || lastRow.Close,
            'Volume': lastRow.volume || lastRow.Volume
        };
        
        Object.entries(ohlcv).forEach(([key, value]) => {
            if (value !== undefined) {
                const formattedValue = formatValue(value, key);
                console.log(`  ${key.padEnd(8)}: ${formattedValue}`);
            }
        });
        console.log('');
        
        // Group and print indicators
        const groups = groupIndicators(headers);
        
        // Remove Price group since we already displayed it
        groups.delete('Price');
        
        // Sort groups alphabetically
        const sortedGroups = Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
        
        // Print each group
        let groupCount = 0;
        for (const [groupName, fields] of sortedGroups) {
            // Skip if all values are undefined
            const hasValues = fields.some(f => lastRow[f] !== undefined && lastRow[f] !== null && lastRow[f] !== '');
            if (!hasValues) continue;
            
            groupCount++;
            
            // Use different colors for different indicator groups
            const colors = [chalk.cyan, chalk.green, chalk.yellow, chalk.magenta, chalk.blue];
            const color = colors[groupCount % colors.length];
            
            console.log(color(`  📈 ${groupName}:`));
            console.log(chalk.gray('  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─'));
            
            // Print each field in the group
            fields.forEach(field => {
                const value = lastRow[field];
                if (value !== undefined && value !== null && value !== '') {
                    // Shorten field name by removing common prefixes
                    let shortName = field.replace(groupName, '').replace(/^_/, '');
                    if (!shortName) shortName = 'value';
                    
                    const formattedValue = formatValue(value, field);
                    console.log(`  ${shortName.padEnd(12)}: ${formattedValue}`);
                }
            });
            console.log('');
            
            // Add a break after every 5 groups for readability
            if (groupCount > 0 && groupCount % 5 === 0) {
                console.log(chalk.gray('  ' + '·'.repeat(30)));
                console.log('');
            }
        }
        
        console.log(chalk.cyan('═'.repeat(60)));
        console.log(chalk.gray(`  Total indicators: ${groupCount}`));
        console.log(chalk.gray(`  Total candles: ${data.length}`));
        console.log(chalk.cyan('═'.repeat(60) + '\n'));
        
    } catch (error) {
        console.error(chalk.red('\n✗ Error reading market status:'), error.message);
    }
}

/**
 * Register the ai-status command
 */
export function registerAIStatusCommand(program) {
    program
        .command('ai-status')
        .description('Display current market status from AI context CSV')
        .option('-s, --symbol <symbol>', 'Trading symbol', 'BTCUSDT')
        .option('-i, --interval <interval>', 'Time interval', '1h')
        .option('--csv <path>', 'Path to CSV file')
        .action(async (options) => {
            let csvPath = options.csv;
            
            // If no CSV provided, construct filename from symbol and interval
            if (!csvPath) {
                csvPath = `cryptoDogAiContext_${options.symbol}_${options.interval}.csv`;
            }
            
            await printMarketStatus(csvPath);
        });
}
