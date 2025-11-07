/**
 * Centralized configuration for AI model pipeline
 * 
 * Change these settings to analyze different data or adjust model behavior
 */

export const CONFIG = {
    // ==================== DATA SOURCES ====================
    
    /**
     * Input CSV file with market data and indicators
     * This is the raw data file created by cryptoDogAiContext.js
     */
    inputDataFile: '../cryptoDogAiContext_BTCUSDT_15m.csv',
    
    /**
     * Symbol being analyzed (for reporting purposes)
     */
    symbol: 'BTCUSDT',
    
    /**
     * Timeframe (for reporting purposes)
     */
    timeframe: '15m',
    
    
    // ==================== LABELING PARAMETERS ====================
    
    /**
     * How many candles to look ahead when creating labels
     * Higher = more lag but clearer trends
     * Lower = faster signals but more noise
     */
    lookAhead: 3,
    
    /**
     * Price change threshold for UP label (%)
     * Increase for stronger trends only
     */
    upThreshold: 0.3,
    
    /**
     * Price change threshold for DOWN label (%)
     * Decrease (more negative) for stronger trends only
     */
    downThreshold: -0.3,
    
    
    // ==================== MODEL PARAMETERS ====================
    
    /**
     * Indicator weights for scoring (should sum to ~100)
     */
    weights: {
        superTrend: 25,
        rsi: 20,
        macd: 20,
        bollinger: 15,
        stochastic: 10,
        adx: 10
    },
    
    /**
     * Signal thresholds for trading decisions
     */
    thresholds: {
        strongBuy: 60,      // Score needed for STRONG_BUY
        buy: 40,            // Score needed for BUY
        sell: -40,          // Score needed for SELL
        strongSell: -60     // Score needed for STRONG_SELL
    },
    
    /**
     * Filters to reduce false signals
     */
    filters: {
        minConfidence: 50,      // Only trade signals above this score
        useADXFilter: true,     // Require strong trend (ADX > 20)
        useBBFilter: false      // Filter out ranging markets
    },
    
    
    // ==================== BACKTEST PARAMETERS ====================
    
    /**
     * Starting capital for backtest
     */
    initialCapital: 10000,
    
    /**
     * Percentage of capital to use per trade (0.0 - 1.0)
     */
    positionSize: 0.95,
    
    /**
     * Trading fee percentage (0.001 = 0.1%)
     */
    tradeFee: 0.001,
    
    /**
     * Stop loss percentage
     */
    stopLossPercent: 2.0,
    
    /**
     * Take profit percentage
     */
    takeProfitPercent: 3.0,
    
    /**
     * Only trade STRONG signals
     */
    onlyStrongSignals: false,
    
    
    // ==================== OUTPUT PATHS ====================
    
    /**
     * Directory for all output files
     */
    outputDir: './output',
    
    /**
     * Generated file names
     */
    outputFiles: {
        labeledData: 'labeled_data.csv',
        featureAnalysis: 'feature_analysis.json',
        patternAnalysis: 'pattern_analysis.json',
        modelTest: 'model_test_results.json',
        backtestResults: 'backtest_results.json'
    },
    
    
    // ==================== ANALYSIS PARAMETERS ====================
    
    /**
     * Minimum correlation to consider for feature analysis
     */
    minCorrelation: 0.1,
    
    /**
     * Pattern detection thresholds
     */
    patternThresholds: {
        minSupport: 0.05,       // Minimum 5% of data must match pattern
        minConfidence: 0.65     // Pattern must predict correctly 65% of time
    }
};

/**
 * Helper function to get full path to input file
 */
export function getInputFilePath() {
    return CONFIG.inputDataFile;
}

/**
 * Helper function to get full path to output file
 */
export function getOutputFilePath(fileName) {
    return `${CONFIG.outputDir}/${fileName}`;
}

/**
 * Validate configuration
 */
export function validateConfig() {
    const errors = [];
    
    if (CONFIG.lookAhead < 1) {
        errors.push('lookAhead must be at least 1');
    }
    
    if (CONFIG.upThreshold <= 0) {
        errors.push('upThreshold must be positive');
    }
    
    if (CONFIG.downThreshold >= 0) {
        errors.push('downThreshold must be negative');
    }
    
    if (CONFIG.positionSize <= 0 || CONFIG.positionSize > 1) {
        errors.push('positionSize must be between 0 and 1');
    }
    
    if (CONFIG.stopLossPercent <= 0) {
        errors.push('stopLossPercent must be positive');
    }
    
    if (CONFIG.takeProfitPercent <= 0) {
        errors.push('takeProfitPercent must be positive');
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Print current configuration
 */
export function printConfig() {
    console.log('📋 Current Configuration:');
    console.log('   Input File:', CONFIG.inputDataFile);
    console.log('   Symbol:', CONFIG.symbol);
    console.log('   Timeframe:', CONFIG.timeframe);
    console.log('   Look Ahead:', CONFIG.lookAhead, 'candles');
    console.log('   Up Threshold:', CONFIG.upThreshold + '%');
    console.log('   Down Threshold:', CONFIG.downThreshold + '%');
    console.log('   Stop Loss:', CONFIG.stopLossPercent + '%');
    console.log('   Take Profit:', CONFIG.takeProfitPercent + '%');
    console.log('   Min Confidence:', CONFIG.filters.minConfidence);
    console.log('   Initial Capital: $' + CONFIG.initialCapital);
}
