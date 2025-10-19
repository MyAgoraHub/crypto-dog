import {rsiMarketData, superTrendMarketData, multiDivergenceDetectorMarketData, configureAutoPreload} from '../core/indicator/impl/indicatorManager.js';

export const runIndicatorAgents = async () => {
    const category = 'spot';
    const symbol = 'BTCUSDT';
    const interval = '15'; // 15 minutes
    configureAutoPreload(true, [
        { iterations: 2, candles: 50 }  // Quick test
    ]);

    const rsiData = await rsiMarketData(category, symbol, interval, 5, 20);
    console.log('RSI Market Data:', rsiData);

    const superTrendData = await superTrendMarketData(category, symbol, interval, 5, 20);
    console.log('SuperTrend Market Data:', superTrendData);

    const divergenceData = await multiDivergenceDetectorMarketData(category, symbol, interval, 5, 20);
    console.log('Multi Divergence Detector Market Data:', divergenceData);

    const superTrendDataWithEvaluation = await superTrendMarketData(category, symbol, interval, 5, 20, {
        evaluate: (stData) => {
            if ("long" === stData.trend) {
                return { signal: true, action: 'BUY', reason: 'SuperTrend indicates long trend' };
            } else if ("short" === stData.trend) {
                return { signal: true, action: 'SELL', reason: 'SuperTrend indicates short trend' };
            }
            return { signal: false };
        }
    });


    console.log('SuperTrend Market Data with Evaluation:', superTrendDataWithEvaluation);

    const rsiSignalConfig = {
        evaluate: (rsiValue) => {
            if (rsiValue < 30) {
                return { signal: true, action: 'BUY', reason: 'RSI oversold' };
            } else if (rsiValue > 70) {
                return { signal: true, action: 'SELL', reason: 'RSI overbought' };
            }
            return { signal: false };
        }
    };

    const rsiDataWithSignal = await rsiMarketData(category, symbol, interval, 5, 20, rsiSignalConfig);
    console.log('RSI Market Data with Signal Evaluation:', rsiDataWithSignal);

    
}

runIndicatorAgents();