import { loadCandleData } from './clients/cryptoDogAgent.js';
import { createIndicatorData } from './cryptoDogTools.js';
import { IndicatorList } from './indicator/Indicators.js';
import { getInterval } from './clients/cryptoDogRequestHandler.js';

/**
 * Backtest a signal against historical data
 */
export const backtestSignal = async (signal, iterations = 10, candles = 200, riskPercent = 2, rewardPercent = 5, initialCapital = 10000) => {
    console.log(`\n🔄 Backtesting ${signal.signalType} on ${signal.symbol} (${signal.timeframe})...`);
    console.log(`📥 Fetching ${iterations} iterations × ${candles} candles = ${iterations * candles} total candles expected`);
    
    // Load historical data
    const interval = getInterval(signal.timeframe).value;
    const candleBuffer = await loadCandleData('spot', signal.symbol, interval, iterations, candles);
    const { o, h, l, c, v, buffer } = createIndicatorData(candleBuffer, signal.symbol);
    
    console.log(`📊 Loaded ${c.length} candles for backtesting`);
    console.log(`📅 Period: ${new Date(parseInt(buffer[buffer.length - 1][0])).toISOString()} to ${new Date(parseInt(buffer[0][0])).toISOString()}`);
    
    const periodDays = (parseInt(buffer[0][0]) - parseInt(buffer[buffer.length - 1][0])) / (1000 * 60 * 60 * 24);
    console.log(`⏱️  Duration: ${periodDays.toFixed(1)} days`);    
    // Calculate indicators
    let indicatorData = [];
    if (signal.signalType.includes('INDICATOR')) {
        const getData = IndicatorList.getIndicator(signal.indicator);
        indicatorData = getData(o, h, l, c, v, signal.indicatorArgs || {}, buffer);
        console.log(`📈 Calculated ${Array.isArray(indicatorData) ? indicatorData.length : 'object'} indicator values`);
    }
    
    // Prepare evaluation function
    const evaluateFunc = new Function('return ' + signal.evaluate)();
    
    // Debug: test evaluation on first valid datapoint
    if (signal.signalType.includes('INDICATOR') && indicatorData.length > 100) {
        const testIndex = 100;
        let testModel;
        if (signal.signalType.includes('SuperTrend')) {
            testModel = indicatorData[testIndex];
        } else if (signal.signalType.includes('Rsi')) {
            testModel = { value: indicatorData[testIndex] };
        }
        if (testModel) {
            console.log(`\n🔍 Testing evaluation at index ${testIndex}:`);
            console.log(`  DataModel:`, testModel);
            console.log(`  Signal value:`, signal.value);
            try {
                const testResult = evaluateFunc(testModel, signal);
                console.log(`  Eval result:`, testResult);
            } catch (err) {
                console.log(`  Eval error:`, err.message);
            }
        }
    }
    
    // Track stats
    const trades = [];
    let capital = initialCapital;
    let wins = 0, losses = 0;
    let totalProfit = 0, totalLoss = 0;
    let maxDrawdown = 0, peakCapital = initialCapital;
    let signalTriggers = 0;
    
    // Simulate through all candles
    for (let i = 50; i < c.length - 50; i++) {
        let dataModel = null;
        
        // Build data model for this candle
        if (signal.signalType.includes('INDICATOR')) {
            if (signal.signalType.includes('SuperTrend')) {
                dataModel = indicatorData[i];
            } else if (signal.signalType.includes('Rsi')) {
                dataModel = { value: indicatorData[i] };
            } else if (signal.signalType.includes('Crocodile')) {
                dataModel = {
                    ema1: indicatorData.ema1?.[i],
                    ema2: indicatorData.ema2?.[i],
                    ema3: indicatorData.ema3?.[i]
                };
            } else if (signal.signalType.includes('Cross')) {
                if (i < 3) continue;
                dataModel = {
                    all: [indicatorData[i-1], indicatorData[i-2], indicatorData[i-3]],
                    current: indicatorData[i]
                };
            } else if (signal.signalType.includes('trend')) {
                dataModel = { data: indicatorData[i], c: c[i] };
            } else if (signal.signalType.includes('Woodies')) {
                dataModel = { c: c[i], data: indicatorData[i] };
            } else {
                dataModel = indicatorData[i];
            }
        } else {
            // Price action
            dataModel = { value: c[i] };
        }
        
        if (!dataModel) continue;
        
        // Evaluate signal
        try {
            const result = evaluateFunc(dataModel, signal);
            
            if (result && result.signal === true) {
                signalTriggers++;
                
                const entryPrice = c[i];
                const timestamp = parseInt(buffer[i][0]);
                const isLong = determinePositionDirection(signal.signalType, result, signal);
                
                // Log first few signals for debugging
                if (signalTriggers <= 3) {
                    console.log(`\n🎯 Signal #${signalTriggers}:`, {
                        index: i,
                        price: entryPrice,
                        date: new Date(timestamp).toISOString(),
                        direction: isLong ? 'LONG' : 'SHORT',
                        result
                    });
                }
                
                // Calculate SL/TP
                const stopLoss = isLong 
                    ? entryPrice * (1 - riskPercent / 100)
                    : entryPrice * (1 + riskPercent / 100);
                
                const takeProfit = isLong
                    ? entryPrice * (1 + rewardPercent / 100)
                    : entryPrice * (1 - rewardPercent / 100);
                
                const riskAmount = capital * (riskPercent / 100);
                const positionSize = riskAmount / (Math.abs(entryPrice - stopLoss) / entryPrice);
                
                // Find exit
                let exitPrice = null, exitReason = null, exitIndex = i + 1;
                
                for (let j = i + 1; j < Math.min(i + 100, c.length); j++) {
                    if (isLong) {
                        if (l[j] <= stopLoss) {
                            exitPrice = stopLoss;
                            exitReason = 'Stop Loss';
                            exitIndex = j;
                            break;
                        }
                        if (h[j] >= takeProfit) {
                            exitPrice = takeProfit;
                            exitReason = 'Take Profit';
                            exitIndex = j;
                            break;
                        }
                    } else {
                        if (h[j] >= stopLoss) {
                            exitPrice = stopLoss;
                            exitReason = 'Stop Loss';
                            exitIndex = j;
                            break;
                        }
                        if (l[j] <= takeProfit) {
                            exitPrice = takeProfit;
                            exitReason = 'Take Profit';
                            exitIndex = j;
                            break;
                        }
                    }
                }
                
                if (!exitPrice) {
                    exitPrice = c[Math.min(i + 50, c.length - 1)];
                    exitReason = 'Time Exit';
                    exitIndex = Math.min(i + 50, c.length - 1);
                }
                
                // Calculate P&L
                const priceDiff = isLong ? (exitPrice - entryPrice) : (entryPrice - exitPrice);
                const profitLoss = (priceDiff / entryPrice) * positionSize;
                const profitLossPercent = (priceDiff / entryPrice) * 100;
                
                capital += profitLoss;
                
                if (profitLoss > 0) {
                    wins++;
                    totalProfit += profitLoss;
                } else {
                    losses++;
                    totalLoss += Math.abs(profitLoss);
                }
                
                if (capital > peakCapital) peakCapital = capital;
                const drawdown = ((peakCapital - capital) / peakCapital) * 100;
                if (drawdown > maxDrawdown) maxDrawdown = drawdown;
                
                trades.push({
                    entry: {
                        timestamp: new Date(timestamp).toISOString(),
                        price: entryPrice,
                        position: isLong ? 'LONG' : 'SHORT'
                    },
                    exit: {
                        timestamp: new Date(parseInt(buffer[exitIndex][0])).toISOString(),
                        price: exitPrice,
                        reason: exitReason
                    },
                    profitLoss: profitLoss.toFixed(2),
                    profitLossPercent: profitLossPercent.toFixed(2),
                    capitalAfter: capital.toFixed(2)
                });
                
                i = exitIndex;
            }
        } catch (err) {
            // Log evaluation errors for debugging
            if (signalTriggers === 0 && i === 50) {
                console.log(`⚠️  Evaluation error at first candle:`, err.message);
                console.log(`DataModel:`, dataModel);
                console.log(`Signal:`, signal);
            }
        }
    }
    
    console.log(`🎯 Found ${signalTriggers} signal triggers, executed ${trades.length} trades`);
    
    // Calculate metrics
    const totalTrades = wins + losses;
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
    const avgWin = wins > 0 ? totalProfit / wins : 0;
    const avgLoss = losses > 0 ? totalLoss / losses : 0;
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : 0;
    const netProfit = capital - initialCapital;
    const returnPercent = ((capital - initialCapital) / initialCapital) * 100;
    
    return {
        signal: {
            symbol: signal.symbol,
            timeframe: signal.timeframe,
            type: signal.signalType
        },
        period: {
            start: new Date(parseInt(buffer[buffer.length - 1][0])).toISOString(),
            end: new Date(parseInt(buffer[0][0])).toISOString(),
            candles: c.length
        },
        performance: {
            initialCapital,
            finalCapital: capital.toFixed(2),
            netProfit: netProfit.toFixed(2),
            returnPercent: returnPercent.toFixed(2),
            maxDrawdown: maxDrawdown.toFixed(2)
        },
        trades: {
            total: totalTrades,
            wins,
            losses,
            winRate: winRate.toFixed(2),
            avgWin: avgWin.toFixed(2),
            avgLoss: avgLoss.toFixed(2),
            profitFactor: profitFactor.toFixed(2)
        },
        tradeHistory: trades
    };
};

const determinePositionDirection = (signalType, result, signal) => {
    if (signalType.includes('SuperTrend')) {
        if (result?.trend) return result.trend === 'long' || result.trend === 'uptrend';
        if (signal?.value) return signal.value === 'long';
    }
    
    if (signalType.includes('Woodies')) {
        if (result?.type) return result.type.includes('support');
    }
    
    if (signalType.includes('Divergence')) {
        if (result?.divergence && Array.isArray(result.divergence)) {
            return result.divergence.some(d => typeof d === 'string' && d.toLowerCase().includes('bullish'));
        }
    }
    
    const bullish = ['RsiOs', 'Crocodile', 'CrossUp', 'Uptrend', 'PRICE_ACTION_GT', 'PRICE_ACTION_GTE'];
    const bearish = ['RsiOb', 'CrocodileDive', 'CrossDown', 'DownTrend', 'PRICE_ACTION_LT', 'PRICE_ACTION_LTE'];
    
    if (bullish.some(s => signalType.includes(s))) return true;
    if (bearish.some(s => signalType.includes(s))) return false;
    
    return true;
};