/**
 * Statistical utility functions for data analysis
 */

/**
 * Calculate correlation between two arrays
 * @param {Array<number>} x - First array
 * @param {Array<number>} y - Second array
 * @returns {number} Correlation coefficient (-1 to 1)
 */
export function correlation(x, y) {
    if (x.length !== y.length || x.length === 0) {
        return 0;
    }
    
    const n = x.length;
    const meanX = mean(x);
    const meanY = mean(y);
    
    let numerator = 0;
    let denominatorX = 0;
    let denominatorY = 0;
    
    for (let i = 0; i < n; i++) {
        const diffX = x[i] - meanX;
        const diffY = y[i] - meanY;
        numerator += diffX * diffY;
        denominatorX += diffX * diffX;
        denominatorY += diffY * diffY;
    }
    
    if (denominatorX === 0 || denominatorY === 0) {
        return 0;
    }
    
    return numerator / Math.sqrt(denominatorX * denominatorY);
}

/**
 * Calculate mean of an array
 * @param {Array<number>} arr - Input array
 * @returns {number} Mean value
 */
export function mean(arr) {
    if (arr.length === 0) return 0;
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

/**
 * Calculate standard deviation
 * @param {Array<number>} arr - Input array
 * @returns {number} Standard deviation
 */
export function stdDev(arr) {
    if (arr.length === 0) return 0;
    const avg = mean(arr);
    const variance = arr.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / arr.length;
    return Math.sqrt(variance);
}

/**
 * Calculate median of an array
 * @param {Array<number>} arr - Input array
 * @returns {number} Median value
 */
export function median(arr) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
        ? (sorted[mid - 1] + sorted[mid]) / 2 
        : sorted[mid];
}

/**
 * Calculate percentile
 * @param {Array<number>} arr - Input array
 * @param {number} p - Percentile (0-100)
 * @returns {number} Percentile value
 */
export function percentile(arr, p) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * Group data by a categorical column and calculate stats
 * @param {Array<Object>} data - Input data
 * @param {string} groupByColumn - Column to group by
 * @param {string} valueColumn - Column to calculate stats for
 * @returns {Object} Grouped statistics
 */
export function groupByStats(data, groupByColumn, valueColumn) {
    const groups = {};
    
    data.forEach(row => {
        const groupKey = row[groupByColumn];
        const value = row[valueColumn];
        
        if (groupKey !== null && groupKey !== undefined && 
            value !== null && value !== undefined && !isNaN(value)) {
            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(value);
        }
    });
    
    const stats = {};
    Object.keys(groups).forEach(key => {
        const values = groups[key];
        stats[key] = {
            count: values.length,
            mean: mean(values),
            median: median(values),
            stdDev: stdDev(values),
            min: Math.min(...values),
            max: Math.max(...values)
        };
    });
    
    return stats;
}

/**
 * Calculate win rate for predictions
 * @param {Array<boolean>} predictions - Array of prediction outcomes (true = correct)
 * @returns {number} Win rate (0-1)
 */
export function winRate(predictions) {
    if (predictions.length === 0) return 0;
    const wins = predictions.filter(p => p === true).length;
    return wins / predictions.length;
}

/**
 * Normalize array to 0-1 range
 * @param {Array<number>} arr - Input array
 * @returns {Array<number>} Normalized array
 */
export function normalize(arr) {
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    const range = max - min;
    
    if (range === 0) return arr.map(() => 0);
    
    return arr.map(val => (val - min) / range);
}

/**
 * Calculate z-score for each element
 * @param {Array<number>} arr - Input array
 * @returns {Array<number>} Z-scores
 */
export function zScore(arr) {
    const avg = mean(arr);
    const sd = stdDev(arr);
    
    if (sd === 0) return arr.map(() => 0);
    
    return arr.map(val => (val - avg) / sd);
}
