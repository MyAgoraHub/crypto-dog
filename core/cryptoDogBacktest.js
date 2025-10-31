import { loadCandleData } from './clients/cryptoDogAgent.js';
import { createIndicatorData } from './cryptoDogTools.js';
import { IndicatorList } from './indicator/Indicators.js';
import { getInterval } from './clients/cryptoDogRequestHandler.js';
import { signalAgent } from './cryptoDogSignalAgent.js';

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
    if (signal.signalType.includes('INDICATOR') && !signal.signalType.includes('VolumeSpike') && !signal.signalType.includes('FibonacciRetracement')) {
        const getData = IndicatorList.getIndicator(signal.indicator);
        indicatorData = getData(o, h, l, c, v, signal.indicatorArgs || {}, buffer);
        console.log(`📈 Calculated ${Array.isArray(indicatorData) ? indicatorData.length : 'object'} indicator values`);
        console.log(`📈 First 5 indicator values:`, Array.isArray(indicatorData) ? indicatorData.slice(0, 5) : 'Not an array');
        console.log(`📈 Signal type: ${signal.signalType}, Indicator: ${signal.indicator}`);
    } else if (signal.signalType.includes('VolumeSpike')) {
        // Volume Spike doesn't need indicator calculation, just use volume data
        indicatorData = v; // Use volume data directly
        console.log(`📈 Volume Spike signal - using volume data directly`);
    } else if (signal.signalType.includes('FibonacciRetracement')) {
        // Fibonacci Retracement doesn't need indicator calculation, just use price data
        indicatorData = null; // No indicator data needed
        console.log(`📈 Fibonacci Retracement signal - no indicator calculation needed`);
    }
    
    // Prepare evaluation function
    let evaluateFunc;
    if (typeof signal.evaluate === 'string' && signal.evaluate.includes('signalAgent.')) {
        // Handle signalAgent function references
        const funcName = signal.evaluate.replace('signalAgent.', '');
        evaluateFunc = signalAgent[funcName];
    } else {
        // Fallback for string functions
        evaluateFunc = new Function('return ' + signal.evaluate)();
    }
    
    // Debug: test evaluation on first valid datapoint
    if (signal.signalType.includes('INDICATOR') && c.length > 20) {
        const testIndex = Math.min(20, Math.floor(c.length / 4));
        let testModel;
        if (signal.signalType.includes('SuperTrend')) {
            testModel = indicatorData[testIndex];
        } else if (signal.signalType.includes('Rsi')) {
            testModel = { value: indicatorData[testIndex] };
        } else if (signal.signalType.includes('Williams')) {
            testModel = { value: indicatorData[testIndex] };
        } else if (signal.signalType.includes('Mfi')) {
            testModel = { value: indicatorData[testIndex] };
        } else if (signal.signalType.includes('Cci')) {
            testModel = { value: indicatorData[testIndex] };
        } else if (signal.signalType.includes('Parabolic')) {
            testModel = { sar: indicatorData[testIndex], price: c[testIndex] };
        } else if (signal.signalType.includes('Stochastic') && signal.signalType.includes('Cross')) {
            // Stochastic cross signals need current and previous K/D values
            testModel = {
                k: indicatorData[testIndex]?.k,
                d: indicatorData[testIndex]?.d,
                previousK: indicatorData[testIndex-1]?.k,
                previousD: indicatorData[testIndex-1]?.d
            };
        } else if (signal.signalType.includes('Cross')) {
            if (testIndex < 3) {
                console.log(`  Not enough data for cross signal test`);
            } else {
                testModel = {
                    all: [indicatorData[testIndex-1], indicatorData[testIndex-2], indicatorData[testIndex-3]],
                    current: indicatorData[testIndex]
                };
            }
        } else if (signal.signalType.includes('Crocodile')) {
            testModel = {
                ema1: indicatorData.ema1?.[testIndex],
                ema2: indicatorData.ema2?.[testIndex],
                ema3: indicatorData.ema3?.[testIndex]
            };
        } else if (signal.signalType.includes('trend')) {
            testModel = { data: indicatorData[testIndex], c: c[testIndex] };
        } else if (signal.signalType.includes('Woodies')) {
            testModel = { c: c[testIndex], data: indicatorData[testIndex] };
        } else if (signal.signalType.includes('Macd')) {
            // MACD signals need current and previous values for crossover detection
            testModel = {
                macd: indicatorData[testIndex]?.MACD,
                signal: indicatorData[testIndex]?.signal,
                histogram: indicatorData[testIndex]?.histogram,
                previousMacd: indicatorData[testIndex-1]?.MACD,
                previousSignal: indicatorData[testIndex-1]?.signal,
                previousHistogram: indicatorData[testIndex-1]?.histogram
            };
        } else if (signal.signalType.includes('Bollinger')) {
            // Bollinger signals need price and band data
            testModel = {
                ...indicatorData[testIndex],
                price: c[testIndex]
            };
        } else if (signal.signalType.includes('VolumeSpike')) {
            // Volume spike signals need volume data
            testModel = {
                volumes: indicatorData.slice(Math.max(0, testIndex-20), testIndex+1), // Last 20 volumes including current
                currentVolume: indicatorData[testIndex]
            };
        } else if (signal.signalType.includes('FibonacciRetracement')) {
            // Fibonacci Retracement signals need recent high/low and current price
            const lookback = 20; // Same lookback as in test
            const startIdx = Math.max(0, testIndex - lookback);
            const recentHigh = Math.max(...h.slice(startIdx, testIndex + 1));
            const recentLow = Math.min(...l.slice(startIdx, testIndex + 1));
            testModel = {
                high: recentHigh,
                low: recentLow,
                price: c[testIndex]
            };
        } else if (signal.signalType.includes('Ichimoku')) {
            // Ichimoku signals need price and Ichimoku components
            // Ichimoku data may be shorter than candle data due to calculation requirements
            const ichimokuIndex = testIndex - (c.length - indicatorData.length);
            if (ichimokuIndex >= 1 && ichimokuIndex < indicatorData.length) { // Need at least 2 data points for previous values
                const ichimoku = indicatorData[ichimokuIndex];
                const previousIchimoku = indicatorData[ichimokuIndex - 1];
                testModel = {
                    price: c[testIndex],
                    spanA: ichimoku.spanA,
                    spanB: ichimoku.conversion,
                    tenkan: ichimoku.base,
                    kijun: ichimoku.conversion,
                    previousTenkan: previousIchimoku.conversion,
                    previousKijun: previousIchimoku.base
                };
            } else {
                testModel = null; // Skip if Ichimoku data not available
            }
        } else {
            testModel = indicatorData[testIndex];
        }
        if (testModel) {
            console.log(`\n🔍 Testing evaluation at index ${testIndex}:`);
            console.log(`  DataModel:`, JSON.stringify(testModel, null, 2));
            console.log(`  Signal value:`, signal.value);
            console.log(`  Signal type:`, signal.signalType);
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
    const startIndex = Math.min(10, Math.floor(c.length / 4));
    const endIndex = Math.max(startIndex + 1, c.length - 10);
    for (let i = startIndex; i < endIndex; i++) {
        let dataModel = null;
        
        // Build data model for this candle
        if (signal.signalType.includes('INDICATOR')) {
            if (signal.signalType.includes('SuperTrend')) {
                dataModel = indicatorData[i];
            } else if (signal.signalType.includes('Rsi')) {
                dataModel = { value: indicatorData[i] };
            } else if (signal.signalType.includes('Williams')) {
                dataModel = { value: indicatorData[i] };
            } else if (signal.signalType.includes('Mfi')) {
                dataModel = { value: indicatorData[i] };
            } else if (signal.signalType.includes('Cci')) {
                dataModel = { value: indicatorData[i] };
            } else if (signal.signalType.includes('Parabolic')) {
                dataModel = { sar: indicatorData[i], price: c[i] };
            } else if (signal.signalType.includes('Crocodile')) {
                dataModel = {
                    ema1: indicatorData.ema1?.[i],
                    ema2: indicatorData.ema2?.[i],
                    ema3: indicatorData.ema3?.[i]
                };
            } else if (signal.signalType.includes('Stochastic') && signal.signalType.includes('Cross')) {
                // Stochastic cross signals need current and previous K/D values
                dataModel = {
                    k: indicatorData[i]?.k,
                    d: indicatorData[i]?.d,
                    previousK: indicatorData[i-1]?.k,
                    previousD: indicatorData[i-1]?.d
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
            } else if (signal.signalType.includes('Macd')) {
                // MACD signals need current and previous values for crossover detection
                // Skip if signal line is not yet calculated (needs enough data for EMA)
                if (!indicatorData[i]?.signal || !indicatorData[i-1]?.signal) continue;
                dataModel = {
                    macd: indicatorData[i]?.MACD,
                    signal: indicatorData[i]?.signal,
                    histogram: indicatorData[i]?.histogram,
                    previousMacd: indicatorData[i-1]?.MACD,
                    previousSignal: indicatorData[i-1]?.signal,
                    previousHistogram: indicatorData[i-1]?.histogram
                };
            } else if (signal.signalType.includes('Bollinger')) {
                // Bollinger signals need price and band data
                dataModel = {
                    ...indicatorData[i],
                    price: c[i]
                };
            } else if (signal.signalType.includes('Obv')) {
                // OBV signals need current and previous OBV values plus price data
                dataModel = {
                    obv: indicatorData[i],
                    previousObv: indicatorData[i-1],
                    price: c[i],
                    previousPrice: c[i-1]
                };
            } else if (signal.signalType.includes('FibonacciRetracement')) {
                // Fibonacci Retracement signals need recent high/low and current price
                const lookback = 20; // Same lookback as in test
                const startIdx = Math.max(0, i - lookback);
                const recentHigh = Math.max(...h.slice(startIdx, i + 1));
                const recentLow = Math.min(...l.slice(startIdx, i + 1));
                dataModel = {
                    high: recentHigh,
                    low: recentLow,
                    price: c[i]
                };
            } else if (signal.signalType.includes('Crocodile')) {
                dataModel = {
                    ema1: indicatorData.ema1?.[i],
                    ema2: indicatorData.ema2?.[i],
                    ema3: indicatorData.ema3?.[i]
                };
            } else if (signal.signalType.includes('VolumeSpike')) {
                // Volume spike signals need volume data
                dataModel = {
                    volumes: indicatorData.slice(Math.max(0, i-20), i+1), // Last 20 volumes including current
                    currentVolume: indicatorData[i]
                };
            } else if (signal.signalType.includes('Ichimoku')) {
                // Ichimoku signals need price and Ichimoku components
                // Ichimoku data may be shorter than candle data due to calculation requirements
                const ichimokuIndex = i - (c.length - indicatorData.length);
                if (ichimokuIndex >= 1 && ichimokuIndex < indicatorData.length) { // Need at least 2 data points for previous values
                    const ichimoku = indicatorData[ichimokuIndex];
                    const previousIchimoku = indicatorData[ichimokuIndex - 1];
                    dataModel = {
                        price: c[i],
                        spanA: ichimoku.spanA,
                        spanB: ichimoku.conversion,
                        tenkan: ichimoku.base,
                        kijun: ichimoku.conversion,
                        previousTenkan: previousIchimoku.conversion,
                        previousKijun: previousIchimoku.base
                    };
                } else {
                    dataModel = null; // Skip if Ichimoku data not available
                }
            } else if (signal.signalType.includes('Cross')) {
                if (i < 3) continue;
                dataModel = {
                    all: [indicatorData[i-1], indicatorData[i-2], indicatorData[i-3]],
                    current: indicatorData[i]
                };
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
    if (signal.signalType.includes('SuperTrend')) {
        if (result?.trend) return result.trend === 'long' || result.trend === 'uptrend';
        if (signal?.value) return signal.value === 'long';
    }
    
    if (signal.signalType.includes('Woodies')) {
        if (result?.type) return result.type.includes('support');
    }
    
    if (signal.signalType.includes('Divergence')) {
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