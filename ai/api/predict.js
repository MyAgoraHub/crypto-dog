import { predictTrade } from '../4-predictor.js';

/**
 * Example: Real-time prediction API endpoint
 * 
 * This shows how to integrate the prediction model with your existing
 * trading bot or signal processing system.
 */

/**
 * Process a single market snapshot and return trading recommendation
 * @param {Object} marketData - Current market indicators
 * @returns {Object} Trading recommendation
 */
export function getPrediction(marketData) {
    // Get prediction from model
    const prediction = predictTrade(marketData);
    
    // Format response for API
    return {
        success: true,
        timestamp: marketData.Timestamp || Date.now(),
        symbol: 'BTCUSDT', // Could be passed in
        timeframe: '15m',
        
        signal: {
            action: prediction.action,
            confidence: prediction.confidence,
            score: prediction.score
        },
        
        indicators: prediction.indicators,
        
        reasoning: prediction.signals,
        
        recommendation: generateRecommendation(prediction)
    };
}

/**
 * Generate human-readable recommendation
 * @param {Object} prediction - Prediction object
 * @returns {Object} Trading recommendation
 */
function generateRecommendation(prediction) {
    const { action, confidence } = prediction;
    
    if (action === 'HOLD' || confidence < 50) {
        return {
            shouldTrade: false,
            message: 'No clear signal. Wait for better opportunity.',
            riskLevel: 'NONE'
        };
    }
    
    if (action === 'STRONG_BUY') {
        return {
            shouldTrade: true,
            direction: 'LONG',
            message: 'Strong bullish signal detected.',
            riskLevel: 'MEDIUM',
            suggestedEntry: 'Current market price',
            suggestedStopLoss: '2% below entry',
            suggestedTakeProfit: '3% above entry',
            positionSize: 'Standard (1-2% of capital at risk)'
        };
    }
    
    if (action === 'BUY') {
        return {
            shouldTrade: true,
            direction: 'LONG',
            message: 'Moderate bullish signal detected.',
            riskLevel: 'MEDIUM',
            suggestedEntry: 'Wait for slight pullback or current price',
            suggestedStopLoss: '2% below entry',
            suggestedTakeProfit: '3% above entry',
            positionSize: 'Reduced (0.5-1% of capital at risk)'
        };
    }
    
    if (action === 'STRONG_SELL') {
        return {
            shouldTrade: true,
            direction: 'SHORT',
            message: 'Strong bearish signal detected.',
            riskLevel: 'MEDIUM',
            suggestedEntry: 'Current market price',
            suggestedStopLoss: '2% above entry',
            suggestedTakeProfit: '3% below entry',
            positionSize: 'Standard (1-2% of capital at risk)'
        };
    }
    
    if (action === 'SELL') {
        return {
            shouldTrade: true,
            direction: 'SHORT',
            message: 'Moderate bearish signal detected.',
            riskLevel: 'MEDIUM',
            suggestedEntry: 'Wait for slight bounce or current price',
            suggestedStopLoss: '2% above entry',
            suggestedTakeProfit: '3% below entry',
            positionSize: 'Reduced (0.5-1% of capital at risk)'
        };
    }
    
    return {
        shouldTrade: false,
        message: 'Unrecognized signal type.',
        riskLevel: 'NONE'
    };
}

/**
 * Example usage with Express.js API
 */
export function createExpressEndpoint() {
    return `
// Example Express.js endpoint
import express from 'express';
import { getPrediction } from './ai/api/predict.js';

const app = express();
app.use(express.json());

app.post('/api/predict', async (req, res) => {
    try {
        const { marketData } = req.body;
        
        // Validate input
        if (!marketData) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing marketData' 
            });
        }
        
        // Get prediction
        const prediction = getPrediction(marketData);
        
        // Return result
        res.json(prediction);
        
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

app.listen(3000, () => {
    console.log('Prediction API running on port 3000');
});
`;
}

/**
 * Example: Integration with existing crypto-dog signal system
 */
export async function integrateWithSignalAgent(currentMarketData) {
    // Get AI prediction
    const aiPrediction = getPrediction(currentMarketData);
    
    // Example: Combine with existing signals
    const combinedSignal = {
        // Your existing signal logic
        existingSignal: 'BUY', // From cryptoDogSignalAgent
        
        // AI prediction
        aiSignal: aiPrediction.signal.action,
        aiConfidence: aiPrediction.signal.confidence,
        
        // Combined decision
        finalDecision: decideFinalAction(
            'BUY',  // existing signal
            aiPrediction.signal.action,
            aiPrediction.signal.confidence
        ),
        
        // Full context
        context: {
            existing: { /* your existing signal data */ },
            ai: aiPrediction
        }
    };
    
    return combinedSignal;
}

/**
 * Decide final action by combining multiple signals
 */
function decideFinalAction(existingSignal, aiSignal, aiConfidence) {
    // If AI is very confident and agrees
    if (aiConfidence > 70 && existingSignal === aiSignal) {
        return {
            action: existingSignal,
            confidence: 'HIGH',
            reason: 'Both systems agree with high confidence'
        };
    }
    
    // If AI is confident but disagrees
    if (aiConfidence > 70 && existingSignal !== aiSignal) {
        return {
            action: 'HOLD',
            confidence: 'LOW',
            reason: 'Conflicting signals - wait for clarity'
        };
    }
    
    // If AI is not confident, use existing system
    if (aiConfidence < 50) {
        return {
            action: existingSignal,
            confidence: 'MEDIUM',
            reason: 'AI uncertain - using existing system'
        };
    }
    
    // Default: require agreement
    if (existingSignal === aiSignal) {
        return {
            action: existingSignal,
            confidence: 'MEDIUM',
            reason: 'Both systems agree'
        };
    }
    
    return {
        action: 'HOLD',
        confidence: 'LOW',
        reason: 'Signals do not agree'
    };
}

/**
 * Example: Usage
 */
if (import.meta.url === `file://${process.argv[1]}`) {
    // Example market data
    const exampleData = {
        Timestamp: Date.now(),
        Close: 110000,
        SuperTrendIndicator_trend: 'long',
        RsiIndicator: 45,
        MacdIndicator_histogram: 120,
        BollingerIndicator_pb: 0.45,
        StochasticIndicator_k: 35,
        AdxIndicator_adx: 28
    };
    
    const prediction = getPrediction(exampleData);
    
    console.log('\n🤖 AI Trading Prediction');
    console.log('='.repeat(50));
    console.log(JSON.stringify(prediction, null, 2));
    console.log('='.repeat(50) + '\n');
}
