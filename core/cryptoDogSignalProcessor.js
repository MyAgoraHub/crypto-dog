import {getKlineData } from "./indicator/impl/indicatorManager.js"; 
import {IndicatorList} from "./indicator/Indicators.js"
import {getInterval} from "../core/clients/cryptoDogRequestHandler.js"; 
const INTERVAL = (1000 * 60 ); // 5 minutes
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
import { calculateNextInvocationBasedOnTimeFrame } from "../core/cryptoDogAgent.js";

import ohlcv  from '../ohlcv.json' assert { type: 'json' };  
import { createIndicatorData } from '../core/cryptoDogTools.js';

const determineDataModel = (signalType, data, o,h,l,c,v) => {
    switch (signalType) {
        case "INDICATOR_RsiObSignal" : 
        case "INDICATOR_RsiOsSignal": 
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
            // Notification Logic here for termux

           // Update Signals   
           currentSignal.triggerCount = currentSignal.triggerCount+1;
           if( currentSignal.triggerCount >= currentSignal.maxTriggerTimes) {
            currentSignal.isActive = false;
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