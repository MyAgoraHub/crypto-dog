import fs from 'fs';
import path from 'path';

/**
 * Parse CSV file and return array of objects
 * @param {string} filePath - Path to CSV file
 * @returns {Array<Object>} Parsed CSV data
 */
export function readCSV(filePath) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.trim().split('\n');
    
    if (lines.length < 2) {
        throw new Error('CSV file is empty or has no data rows');
    }
    
    // Parse header
    const headers = lines[0].split(',').map(h => h.trim());
    
    // Parse data rows
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const row = {};
        
        headers.forEach((header, index) => {
            const value = values[index]?.trim();
            
            // Convert to appropriate type
            if (value === '' || value === undefined) {
                row[header] = null;
            } else if (header === 'SuperTrendIndicator_trend') {
                // Keep as string (long/short)
                row[header] = value;
            } else if (!isNaN(value) && value !== '') {
                // Convert to number
                row[header] = parseFloat(value);
            } else {
                row[header] = value;
            }
        });
        
        data.push(row);
    }
    
    return data;
}

/**
 * Write data to CSV file
 * @param {string} filePath - Output file path
 * @param {Array<Object>} data - Data to write
 */
export function writeCSV(filePath, data) {
    if (!data || data.length === 0) {
        throw new Error('No data to write');
    }
    
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => 
            headers.map(header => {
                const value = row[header];
                return value === null || value === undefined ? '' : value;
            }).join(',')
        )
    ].join('\n');
    
    fs.writeFileSync(filePath, csvContent, 'utf-8');
}

/**
 * Get basic statistics about the CSV data
 * @param {Array<Object>} data - Parsed CSV data
 * @returns {Object} Statistics
 */
export function getDataStats(data) {
    if (!data || data.length === 0) {
        return null;
    }
    
    const numericColumns = {};
    const firstRow = data[0];
    
    // Identify numeric columns
    Object.keys(firstRow).forEach(key => {
        if (typeof firstRow[key] === 'number') {
            numericColumns[key] = [];
        }
    });
    
    // Collect values
    data.forEach(row => {
        Object.keys(numericColumns).forEach(key => {
            if (row[key] !== null && !isNaN(row[key])) {
                numericColumns[key].push(row[key]);
            }
        });
    });
    
    // Calculate stats
    const stats = {
        totalRows: data.length,
        columns: Object.keys(firstRow),
        numericColumns: Object.keys(numericColumns),
        columnStats: {}
    };
    
    Object.keys(numericColumns).forEach(key => {
        const values = numericColumns[key];
        if (values.length === 0) return;
        
        const sorted = [...values].sort((a, b) => a - b);
        const sum = values.reduce((a, b) => a + b, 0);
        const mean = sum / values.length;
        const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
        
        stats.columnStats[key] = {
            min: sorted[0],
            max: sorted[sorted.length - 1],
            mean: mean,
            median: sorted[Math.floor(sorted.length / 2)],
            stdDev: Math.sqrt(variance),
            count: values.length
        };
    });
    
    return stats;
}
