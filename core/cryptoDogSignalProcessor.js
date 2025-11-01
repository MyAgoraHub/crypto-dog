import {getKlineData } from "./indicator/impl/indicatorManager.js"; 
import {IndicatorList} from "./indicator/Indicators.js"
import {getInterval} from "../core/clients/cryptoDogRequestHandler.js"; 
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const INTERVAL = (1000 * 60 ); // 1 minute

// Send notification (works in Termux if termux-api is installed)
const sendTermuxNotification = async (title, content, priority = 'default') => {
    try {
        const command = `termux-notification --title "${title}" --content "${content}" --priority ${priority} --sound`;
        await execAsync(command);
        console.log('✓ Notification sent:', title);
    } catch (error) {
        // Silently fail - only log in debug mode
        // This is normal when not running in Termux or termux-api not installed
    }
};
import {
    initializeDB,
    getActiveSignals, 
    saveSignal,
    updateSignal,
    getSignalById,
    getAllSignals,
    deleteSignal,
    addSignal,
    getSignals,
    getSignalBySymbolAndTimeframe,
    deleteAll,
    getNextInvocation
} from "../core/repository/dbManager.js";
import { getSignalModel } from "../core/repository/signalModel.js";
import { calculateNextInvocationBasedOnTimeFrame } from "./clients/cryptoDogAgent.js";


const determineDataModel = (signalType, data, o,h,l,c,v) => {
    switch (signalType) {
        case "INDICATOR_RsiObSignal" : 
        case "INDICATOR_RsiOsSignal": 
        case "INDICATOR_RSI_OBSignal": // Handle the database format
            return {value:data.pop()}
        case "INDICATOR_CrocodileDiveSignal": return {ema1:data.ema1.pop(), ema2:data.ema2.pop(), ema3:data.ema3.pop()};
        case "INDICATOR_CrocodileSignal": return {ema1:data.ema1.pop(), ema2:data.ema2.pop(), ema3:data.ema3.pop()};
        case "INDICATOR_CrossUpSignal": return {all:[data[data.length-2],data[data.length-3],data[data.length-4]],  current:data.pop()};
        case "INDICATOR_CrossDownSignal": return {all:[data[data.length-2],data[data.length-3],data[data.length-4]],  current:data.pop()};
        case "INDICATOR_DivergenceDetector": return data.pop();
        case "INDICATOR_UptrendSignal": 
        case "INDICATOR_DownTrendSignal": return { data:data.pop(), c:c.pop()}
        case "INDICATOR_Woodies": return {c:c.pop(), data:data.pop()}
        case "INDICATOR_SuperTrendSignal": return data.pop();

        // MACD Signals
        case "INDICATOR_MacdBullishSignal":
        case "INDICATOR_MacdBearishSignal":
            let lastMacd = data[data.length-1];
            let prevMacd = data[data.length-2];
            return {macd:lastMacd.MACD, signal:lastMacd.signal, histogram:lastMacd.histogram, previousMacd:prevMacd?.MACD, previousSignal:prevMacd?.signal};

        // MACD Histogram Signals
        case "INDICATOR_MacdHistogramPositiveSignal":
        case "INDICATOR_MacdHistogramNegativeSignal":
            let lastMacdHist = data[data.length-1];
            let prevMacdHist = data[data.length-2];
            return {histogram:lastMacdHist.histogram, previousHistogram:prevMacdHist?.histogram};

        // Bollinger Band Signals
        case "INDICATOR_BollingerUpperTouchSignal":
        case "INDICATOR_BollingerLowerTouchSignal":
            return {upper:data.upper.pop(), middle:data.middle.pop(), lower:data.lower.pop(), price:c.pop()};

        // Bollinger Advanced Signals
        case "INDICATOR_BollingerSqueezeSignal":
        case "INDICATOR_BollingerExpansionSignal":
            return {upper:data.upper.pop(), middle:data.middle.pop(), lower:data.lower.pop(), price:c.pop()};

        // Stochastic Signals
        case "INDICATOR_StochasticOverboughtSignal":
        case "INDICATOR_StochasticOversoldSignal":
            return {k:data.k.pop(), d:data.d.pop()};

        // Stochastic Cross Signals
        case "INDICATOR_StochasticBullishCrossSignal":
        case "INDICATOR_StochasticBearishCrossSignal":
            return {k:data.k.pop(), d:data.d.pop(), previousK:data.k[data.k.length-2], previousD:data.d[data.d.length-2]};

        // Williams %R Signals
        case "INDICATOR_WilliamsOverboughtSignal":
        case "INDICATOR_WilliamsOversoldSignal":
            return {value:data.pop()};

        // Moving Average Signals
        case "INDICATOR_GoldenCrossSignal":
        case "INDICATOR_DeathCrossSignal":
            return {fast:data.fast?.pop() || data.pop(), slow:data.slow?.pop() || data[data.length-2]};

        // Moving Average Advanced Signals
        case "INDICATOR_MaSupportSignal":
        case "INDICATOR_MaResistanceSignal":
            return {ma:data.pop(), price:c.pop()};

        // Volume Signals
        case "INDICATOR_VolumeSpikeSignal":
            return {volume:v.pop(), obv:data.pop()};

        // Volume Advanced Signals
        case "INDICATOR_ObvBullishSignal":
        case "INDICATOR_ObvBearishSignal":
            return {obv:data.pop(), previousObv:data[data.length-2], price:c.pop(), previousPrice:c[c.length-2]};

        // Ichimoku Signals
        case "INDICATOR_IchimokuBullishSignal":
        case "INDICATOR_IchimokuBearishSignal":
            return {tenkanSen:data.tenkanSen.pop(), kijunSen:data.kijunSen.pop(), senkouSpanA:data.senkouSpanA.pop(), senkouSpanB:data.senkouSpanB.pop(), chikouSpan:data.chikouSpan.pop(), price:c.pop()};

        // Ichimoku Advanced Signals
        case "INDICATOR_IchimokuTkCrossBullishSignal":
        case "INDICATOR_IchimokuTkCrossBearishSignal":
            return {tenkanSen:data.tenkanSen.pop(), kijunSen:data.kijunSen.pop(), previousTenkan:data.tenkanSen[data.tenkanSen.length-2], previousKijun:data.kijunSen[data.kijunSen.length-2]};

        // ADX Signals
        case "INDICATOR_AdxStrongTrendSignal":
            return {adx:data.adx.pop(), plusDi:data.plusDi.pop(), minusDi:data.minusDi.pop()};

        // ADX Weak Trend Signals
        case "INDICATOR_AdxWeakTrendSignal":
            return {adx:data.adx.pop(), plusDi:data.plusDi.pop(), minusDi:data.minusDi.pop()};

        // MFI Signals
        case "INDICATOR_MfiOverboughtSignal":
        case "INDICATOR_MfiOversoldSignal":
            return {value:data.pop()};

        // ATR Signals
        case "INDICATOR_AtrHighVolatilitySignal":
            return {value:data.pop()};

        // Parabolic SAR Signals
        case "INDICATOR_ParabolicSarBullishSignal":
        case "INDICATOR_ParabolicSarBearishSignal":
            return {sar:data.pop(), price:c.pop()};

        // CCI Signals
        case "INDICATOR_CciOverboughtSignal":
        case "INDICATOR_CciOversoldSignal":
            return {value:data.pop()};

        // Elder Impulse Signals
        case "INDICATOR_ElderImpulseBullishSignal":
        case "INDICATOR_ElderImpulseBearishSignal":
            return {ema:data.ema?.pop() || data.pop(), macd:data.macd?.pop() || data[data.length-2], price:c.pop()};

        // Fibonacci Signals
        case "INDICATOR_FibonacciRetracementSignal":
            return {price:c.pop(), levels:data};

        // Support/Resistance Breakout Signals
        case "INDICATOR_SupportBreakoutSignal":
        case "INDICATOR_ResistanceBreakoutSignal":
            return {price:c.pop(), level:data.pop()};

        // TEMA Signals
        case "INDICATOR_TemaBullishSignal":
        case "INDICATOR_TemaBearishSignal":
            return {tema:data.pop(), previousTema:data[data.length-2], price:c.pop()};

        // Donchian Channel Signals
        case "INDICATOR_DonchianUpperBreakoutSignal":
        case "INDICATOR_DonchianLowerBreakoutSignal":
            return {upper:data.upper?.pop() || Math.max(...h.slice(-20)), lower:data.lower?.pop() || Math.min(...l.slice(-20)), price:c.pop(), previousPrice:c[c.length-2]};

        // Elder Impulse Signals
        case "INDICATOR_ElderImpulseBullSignal":
        case "INDICATOR_ElderImpulseBearSignal":
        case "INDICATOR_ElderImpulseBlueSignal":
            return {ema:data.ema?.pop() || data.pop(), macd:data.macd?.pop() || data[data.length-2], price:c.pop()};

        // SuperTrend Signals
        case "INDICATOR_SuperTrendBullishSignal":
        case "INDICATOR_SuperTrendBearishSignal":
            return {trend:data.trend?.pop() || data.pop(), price:c.pop()};

        // Keltner Channel Signals
        case "INDICATOR_KeltnerUpperBreakoutSignal":
        case "INDICATOR_KeltnerLowerBreakoutSignal":
            return {upper:data.upper?.pop() || data.pop(), middle:data.middle?.pop() || data[data.length-2], lower:data.lower?.pop() || data[data.length-3], price:c.pop(), previousPrice:c[c.length-2]};

        // Heikin-Ashi Signals
        case "INDICATOR_HeikinAshiBullishSignal":
        case "INDICATOR_HeikinAshiBearishSignal":
            return {open:data.open.pop(), high:data.high.pop(), low:data.low.pop(), close:data.close.pop()};

        // Chaikin Money Flow Signals
        case "INDICATOR_ChaikinBullishSignal":
        case "INDICATOR_ChaikinBearishSignal":
            return {value:data.pop()};

        // Force Index Signals
        case "INDICATOR_ForceIndexBullishSignal":
        case "INDICATOR_ForceIndexBearishSignal":
            return {value:data.pop()};

        // Ultimate Oscillator Signals
        case "INDICATOR_UltimateOscillatorBullishSignal":
        case "INDICATOR_UltimateOscillatorBearishSignal":
            return {value:data.pop()};

        // TSI Signals
        case "INDICATOR_TsiBullishSignal":
        case "INDICATOR_TsiBearishSignal":
            return {tsi:data.tsi?.pop() || data.pop(), signal:data.signal?.pop() || data[data.length-2]};

        // Vortex Signals
        case "INDICATOR_VortexBullishSignal":
        case "INDICATOR_VortexBearishSignal":
            return {plusVi:data.plusVi?.pop() || data.pop(), minusVi:data.minusVi?.pop() || data[data.length-2]};

        // Aroon Signals
        case "INDICATOR_AroonBullishSignal":
        case "INDICATOR_AroonBearishSignal":
            return {up:data.up?.pop() || data.pop(), down:data.down?.pop() || data[data.length-2]};

        // ROC Signals
        case "INDICATOR_RocBullishSignal":
        case "INDICATOR_RocBearishSignal":
            return {value:data.pop()};

        // TRIX Signals
        case "INDICATOR_TrixBullishSignal":
        case "INDICATOR_TrixBearishSignal":
            return {value:data.pop()};

        // WMA Signals
        case "INDICATOR_WmaBullishSignal":
        case "INDICATOR_WmaBearishSignal":
            return {value:data.pop()};

        // DEMA Signals
        case "INDICATOR_DemaBullishSignal":
        case "INDICATOR_DemaBearishSignal":
            return {value:data.pop()};

        // TEMA Signals
        case "INDICATOR_TemaBullishSignal":
        case "INDICATOR_TemaBearishSignal":
            return {value:data.pop()};

        // VWAP Signals
        case "INDICATOR_VwapBullishSignal":
        case "INDICATOR_VwapBearishSignal":
            return {vwap:data.pop(), price:c.pop()};

        // OBV Signals
        case "INDICATOR_ObvBullishSignal":
        case "INDICATOR_ObvBearishSignal":
            return {value:data.pop()};

        // ADL Signals
        case "INDICATOR_AdlBullishSignal":
        case "INDICATOR_AdlBearishSignal":
            return {value:data.pop()};

        // Balance of Power Signals
        case "INDICATOR_BalanceOfPowerBullishSignal":
        case "INDICATOR_BalanceOfPowerBearishSignal":
            return {value:data.pop()};

        // Coppock Curve Signals
        case "INDICATOR_CoppockBullishSignal":
        case "INDICATOR_CoppockBearishSignal":
            return {value:data.pop()};

        // KST Signals
        case "INDICATOR_KstBullishSignal":
        case "INDICATOR_KstBearishSignal":
            return {kst:data.kst?.pop() || data.pop(), signal:data.signal?.pop() || data[data.length-2]};
    }
    
}
const processSignal = async (signal) =>{
   let {o,h,l,c,v, buffer } = await getKlineData("spot", signal.symbol, getInterval(signal.timeframe).value);
   //    const { o, h, l, c, v, buffer } = createIndicatorData(ohlcv.data, signal.symbol);
   if(signal.signalType.includes("INDICATOR")) {
        let getData = IndicatorList.getIndicator(signal.indicator)
        let data = getData(o,h,l,c,v, {}, buffer)
        const evaluateFunc = new Function('return ' + signal.evaluate)();
        let dataModel = determineDataModel(signal.signalType, data, o, h, l, c, v);
        const evaluationResult = evaluateFunc(dataModel, signal);
        console.log('Evaluation Result:', evaluationResult);
        return evaluationResult;
   }
   else{
     // Price action we pass last or latest value to evaluate
     const evaluateFunc = Function('return ' + signal.evaluate)();
     const evaluationResult = evaluateFunc({value:c.pop()}, signal);
     console.log('Evaluation Result:', evaluationResult);
     return evaluationResult;
   }
   
}


const process = async () => {
    let signalsToExecute = await getNextInvocation();
    if (!signalsToExecute || signalsToExecute.length === 0) {
        console.log('No signals to execute at this time.');
        return;
    }
    console.log(`Processing ${signalsToExecute.length} signals...`);
    let length = signalsToExecute.length;
    for(let i = 0; i < length; i++) {
        let currentSignal = signalsToExecute[i];
        console.log(currentSignal)
        let result = await processSignal(currentSignal);
        if(result.signal === true) {
           // Build detailed notification message
           let notificationContent = `${currentSignal.symbol} | ${currentSignal.timeframe}\n`;
           
           // Add indicator-specific details
           if (currentSignal.signalType.includes('RSI')) {
               notificationContent += `RSI: ${result.data?.value?.toFixed(2) || 'N/A'}\n`;
           } else if (currentSignal.signalType.includes('PRICE_ACTION')) {
               notificationContent += `Price: $${result.data?.value?.toFixed(2) || 'N/A'} (Target: $${currentSignal.value})\n`;
           } else if (currentSignal.signalType.includes('SuperTrend')) {
               notificationContent += `Trend: ${result.trend || result.data?.trend || 'N/A'}\n`;
           } else if (currentSignal.signalType.includes('MULTI_DIV')) {
               const divs = result.divergence || [];
               notificationContent += `Divergences: ${Array.isArray(divs) ? divs.join(', ') : divs}\n`;
           } else if (currentSignal.signalType.includes('Crocodile') || currentSignal.signalType.includes('Cross')) {
               notificationContent += `Pattern detected!\n`;
           } else if (currentSignal.signalType.includes('Woodies')) {
               notificationContent += `Level: ${result.type || 'pivot detected'}\n`;
           } else if (currentSignal.signalType.includes('MACD')) {
               notificationContent += `MACD: ${result.data?.macd?.toFixed(4) || 'N/A'}, Signal: ${result.data?.signal?.toFixed(4) || 'N/A'}\n`;
           } else if (currentSignal.signalType.includes('Bollinger')) {
               notificationContent += `Price: $${result.data?.price?.toFixed(2) || 'N/A'}, Upper: $${result.data?.upper?.toFixed(2) || 'N/A'}\n`;
           } else if (currentSignal.signalType.includes('Stochastic')) {
               notificationContent += `%K: ${result.data?.k?.toFixed(2) || 'N/A'}, %D: ${result.data?.d?.toFixed(2) || 'N/A'}\n`;
           } else if (currentSignal.signalType.includes('Williams')) {
               notificationContent += `%R: ${result.data?.value?.toFixed(2) || 'N/A'}\n`;
           } else if (currentSignal.signalType.includes('GoldenCross') || currentSignal.signalType.includes('DeathCross')) {
               notificationContent += `Fast MA: ${result.data?.fast?.toFixed(2) || 'N/A'}, Slow MA: ${result.data?.slow?.toFixed(2) || 'N/A'}\n`;
           } else if (currentSignal.signalType.includes('VolumeSpike')) {
               notificationContent += `Volume: ${result.data?.volume?.toFixed(0) || 'N/A'}, OBV: ${result.data?.obv?.toFixed(0) || 'N/A'}\n`;
           } else if (currentSignal.signalType.includes('Ichimoku')) {
               notificationContent += `Price: $${result.data?.price?.toFixed(2) || 'N/A'}, Tenkan: ${result.data?.tenkanSen?.toFixed(2) || 'N/A'}\n`;
           } else if (currentSignal.signalType.includes('ADX')) {
               notificationContent += `ADX: ${result.data?.adx?.toFixed(2) || 'N/A'}, +DI: ${result.data?.plusDi?.toFixed(2) || 'N/A'}\n`;
           } else if (currentSignal.signalType.includes('MFI')) {
               notificationContent += `MFI: ${result.data?.value?.toFixed(2) || 'N/A'}\n`;
           } else if (currentSignal.signalType.includes('ATR')) {
               notificationContent += `ATR: ${result.data?.value?.toFixed(4) || 'N/A'}\n`;
           } else if (currentSignal.signalType.includes('ParabolicSAR')) {
               notificationContent += `SAR: ${result.data?.sar?.toFixed(4) || 'N/A'}, Price: $${result.data?.price?.toFixed(2) || 'N/A'}\n`;
           } else if (currentSignal.signalType.includes('CCI')) {
               notificationContent += `CCI: ${result.data?.value?.toFixed(2) || 'N/A'}\n`;
           } else if (currentSignal.signalType.includes('ElderImpulse')) {
               notificationContent += `EMA: ${result.data?.ema?.toFixed(2) || 'N/A'}, Price: $${result.data?.price?.toFixed(2) || 'N/A'}\n`;
           } else if (currentSignal.signalType.includes('Fibonacci')) {
               notificationContent += `Price: $${result.data?.price?.toFixed(2) || 'N/A'}\n`;
           } else if (currentSignal.signalType.includes('Keltner')) {
               notificationContent += `Price: $${result.data?.price?.toFixed(2) || 'N/A'}, Upper: ${result.data?.upper?.toFixed(2) || 'N/A'}\n`;
           } else if (currentSignal.signalType.includes('HeikinAshi')) {
               notificationContent += `HA Close: ${result.data?.close?.toFixed(2) || 'N/A'}\n`;
           } else if (currentSignal.signalType.includes('Chaikin')) {
               notificationContent += `CMF: ${result.data?.value?.toFixed(4) || 'N/A'}\n`;
           } else if (currentSignal.signalType.includes('ForceIndex')) {
               notificationContent += `Force Index: ${result.data?.value?.toFixed(2) || 'N/A'}\n`;
           } else if (currentSignal.signalType.includes('UltimateOscillator')) {
               notificationContent += `UO: ${result.data?.value?.toFixed(2) || 'N/A'}\n`;
           } else if (currentSignal.signalType.includes('TSI')) {
               notificationContent += `TSI: ${result.data?.tsi?.toFixed(2) || 'N/A'}\n`;
           } else if (currentSignal.signalType.includes('Vortex')) {
               notificationContent += `+VI: ${result.data?.plusVi?.toFixed(2) || 'N/A'}, -VI: ${result.data?.minusVi?.toFixed(2) || 'N/A'}\n`;
           } else if (currentSignal.signalType.includes('Aroon')) {
               notificationContent += `Aroon Up: ${result.data?.up?.toFixed(2) || 'N/A'}, Down: ${result.data?.down?.toFixed(2) || 'N/A'}\n`;
           } else if (currentSignal.signalType.includes('ROC')) {
               notificationContent += `ROC: ${result.data?.value?.toFixed(2) || 'N/A'}%\n`;
           } else if (currentSignal.signalType.includes('TRIX')) {
               notificationContent += `TRIX: ${result.data?.value?.toFixed(4) || 'N/A'}\n`;
           } else if (currentSignal.signalType.includes('WMA') || currentSignal.signalType.includes('DEMA') || currentSignal.signalType.includes('TEMA')) {
               notificationContent += `MA: ${result.data?.value?.toFixed(2) || 'N/A'}\n`;
           } else if (currentSignal.signalType.includes('VWAP')) {
               notificationContent += `VWAP: ${result.data?.vwap?.toFixed(2) || 'N/A'}, Price: $${result.data?.price?.toFixed(2) || 'N/A'}\n`;
           } else if (currentSignal.signalType.includes('OBV') || currentSignal.signalType.includes('ADL')) {
               notificationContent += `Value: ${result.data?.value?.toFixed(0) || 'N/A'}\n`;
           } else if (currentSignal.signalType.includes('BalanceOfPower')) {
               notificationContent += `BOP: ${result.data?.value?.toFixed(4) || 'N/A'}\n`;
           } else if (currentSignal.signalType.includes('Coppock')) {
               notificationContent += `Coppock: ${result.data?.value?.toFixed(2) || 'N/A'}\n`;
           } else if (currentSignal.signalType.includes('KST')) {
               notificationContent += `KST: ${result.data?.kst?.toFixed(2) || 'N/A'}\n`;
           }
           
           notificationContent += `Trigger: ${currentSignal.triggerCount + 1}/${currentSignal.maxTriggerTimes}`;
           
           // Send Termux notification
           const notificationTitle = `🚨 ${currentSignal.signalType.replace('INDICATOR_', '').replace('Signal', '').replace(/_/g, ' ')}`;
           await sendTermuxNotification(notificationTitle, notificationContent, 'high');
           
           // Update Signals   
           currentSignal.triggerCount = currentSignal.triggerCount+1;
           if( currentSignal.triggerCount >= currentSignal.maxTriggerTimes) {
            currentSignal.isActive = false;
            // Send final notification
            await sendTermuxNotification(
                `✓ Signal Completed`,
                `${currentSignal.symbol} ${currentSignal.signalType}\nReached max triggers (${currentSignal.maxTriggerTimes})`,
                'default'
            );
           }
        }
        currentSignal.updatedOn = new Date().toISOString();
        currentSignal.lastExecuted =new Date().toISOString();
        currentSignal.nextInvocation = calculateNextInvocationBasedOnTimeFrame(getInterval(currentSignal.timeframe).value);
        await updateSignal(currentSignal)
    }
}
// Just run every minute
setInterval(async () => {
    await process()
}, INTERVAL);

// Initial run
process();