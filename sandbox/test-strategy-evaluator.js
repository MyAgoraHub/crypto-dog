import { TradingStrategyEvaluator } from '../core/TradingStrategyEvaluator.js';
import fs from 'fs';

console.log('🚀 Testing Enhanced Trading Strategy Evaluator\n');

// Create evaluator instance
const evaluator = new TradingStrategyEvaluator();

// Load indicators from the context.txt file
console.log('📂 Loading indicators from context.txt...');
try {
    const contextData = fs.readFileSync('./sandbox/context.txt', 'utf8');
    // Parse the context data (this would need proper parsing logic)
    // For now, let's create a mock indicators object based on the context
    const mockIndicators = {
        "RsiIndicator": 68.84,
        "MacdIndicator": { "MACD": 663.2692308, "signal": 563.6976496, "histogram": 99.5715812 },
        "SuperTrendIndicator": { "trend": 'long', "value": 112771.1484619 },
        "AtrIndicator": 280.5436055,
        "BollingerIndicator": { "middle": 112878.75, "upper": 114143.5662, "lower": 111613.9338, "pb": 0.7693869671 },
        "WilliamsRIndicator": -22.11310532,
        "MfiIndicator": 79.04,
        "ObvIndicator": 1077.0796930000001,
        "StochasticIndicator": { "k": 77.88689468, "d": 76.25954773 },
        "AdxIndicator": { "adx": 57.96260643, "pdi": 31.98660935, "mdi": 8.589096918 },
        "CciIndicator": 84.46821938848628,
        "AwesomeOscillatorIndicator": 1217.35,
        "IchimokuCloudIndicator": { "conversion": 113318.3, "base": 112798.4, "spanA": 113058.35, "spanB": 112608 },
        "PsarIndicator": 112896.20458402166,
        "RocIndicator": 1.017107763,
        "TrixIndicator": 0.05517274076,
        "ForceIndexIndiactor": 14059.63522,
        "MultiDivergenceDetector": {
            "c": 113560.2,
            "hasDivergence": false,
            "divergence": [
                { "indicator": 'RSI', "type": 'Pending Divergence', "index": 175, "open": 113636.5, "close": 113560.2 },
                { "indicator": 'MACD', "type": 'Pending Divergence', "index": 175, "open": 113636.5, "close": 113560.2 },
                { "indicator": 'Stochastic', "type": 'Pending Divergence', "index": 175, "open": 113636.5, "close": 113560.2 },
                { "indicator": 'Williams %R', "type": 'Pending Divergence', "index": 175, "open": 113636.5, "close": 113560.2 }
            ]
        },
        "DynamicGridSignals": {
            "o": 113636.5, "l": 113538.8, "h": 113693.5, "c": 113560.2, "v": 29.643094,
            "grid": [109685, 110538.4, 111391.8, 112245.2, 113098.6, 113952]
        },
        "VolumeProfile": {
            "rangeStart": 113714.94444444455, "rangeEnd": 113952.00000000012,
            "bullishVolume": 463.92652400000003, "bearishVolume": 283.543851, "totalVolume": 747.4703750000001
        },
        "FloorPivots": {
            "floor": {
                "pivot": 113597.5, "r1": 113656.2, "r2": 113752.2, "r3": 113810.9,
                "s1": 113501.5, "s2": 113442.8, "s3": 113346.8
            }
        },
        "Woodies": {
            "woodies": {
                "pivot": 113588.17499999999, "r1": 113637.54999999997, "r2": 113742.87499999999,
                "s1": 113482.84999999998, "s2": 113433.47499999999
            }
        }
    };

    evaluator.loadFromObject(mockIndicators);

    // Set current price for static indicator evaluation
    const currentPrice = 113560.2; // Using the close price from context
    evaluator.setCurrentPrice(currentPrice);
    console.log(`💰 Current Price: ${currentPrice}`);

} catch (error) {
    console.error('❌ Error loading context file:', error.message);
    process.exit(1);
}

console.log('✅ Indicators and price loaded successfully\n');

// Evaluate all signals
console.log('🔍 Analyzing indicators...');
const signals = evaluator.evaluateAllSignals();

// Print the analysis
evaluator.printAnalysis();

// Show static indicators specifically
console.log('\n🏗️  Static Indicators Analysis:');
console.log(JSON.stringify(evaluator.signals.staticIndicators, null, 2));

console.log('\n✨ Enhanced analysis complete!');
