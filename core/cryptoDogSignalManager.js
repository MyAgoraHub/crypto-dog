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
    getSignalBySymbolAndTimeframe
} 
from "../core/repository/dbManager.js";
import { getSignalModel } from "../core/repository/signalModel.js";
import { calculateNextInvocationBasedOnTimeFrame } from "./clients/cryptoDogAgent.js";
import {signalAgent} from "./cryptoDogSignalAgent.js"
import {IndicatorList} from "../core/indicator/Indicators.js"


export const createPriceActionSignal = async (symbol, timeframe, value, priceAction ) => {

    let allowedPriceActions = ["GT", "LT", "GTE", "LTE", "EQ"]
    if(!allowedPriceActions.includes(priceAction.toUpperCase())) {throw new Error(`Invalid Price action allowed actions are : ${allowedPriceActions.join(",")}`)}
    let model = getSignalModel({ 
            symbol: symbol,
            timeframe: timeframe,
            indicator: null,
            signalType: `PRICE_ACTION_${priceAction.toUpperCase()}-${value}`,
            value: value,
        }, signalAgent[priceAction.toLowerCase()].toString()
    )
    await initializeDB();
    // check if there is already same Signal in DB no need to create it twice
    let exists = await getSignalById(`${symbol}-${timeframe}-${model.signalType}-${value}`)
    if(exists && exists.id) { return }
    await addSignal(model)
}

export const createIndicatorSignal = async (symbol, timeframe, value, indicator="SuperTrendIndicator", evaluate=null, args={}, strategy ) => {
    // test if we have such how though?
    if(!IndicatorList.getData().includes(indicator)) {
        {throw new Error(`Unknown Indicator selection valid Indicators are : ${IndicatorList.getData().join(",")}`)}
    }

    if(evaluate === null ) {
        throw new Error("Create Signal Requires Evaluation Function!")
    }
    let model = getSignalModel({ 
            symbol: symbol,
            timeframe: timeframe,
            indicator: indicator,
            signalType: `INDICATOR_${strategy}`,
            value: value,
            indicatorArgs: args
        }, evaluate.toString()
    )
    await initializeDB();
    // check if there is already same Signal in DB no need to create it twice
    let exists = await getSignalById(`${symbol}-${timeframe}-${model.signalType}-`)
    if(exists && exists.id) { return }
    await addSignal(model);
}

export const createRsiObSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.ob;
    await createIndicatorSignal(symbol, timeframe, value, "RsiIndicator", evaluate, args,"RsiObSignal" );
}
export const createRsiOsSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.os;
    await createIndicatorSignal(symbol, timeframe, value, "RsiIndicator", evaluate , args, "RsiOsSignal" )
}

export const createSuperTrendSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.superTrend;
    await createIndicatorSignal(symbol, timeframe, value, "SuperTrendIndicator", evaluate , args, "SuperTrendSignal" )
}

export const createCrocodileSignal = async (symbol, timeframe, value, args={}) => {
      let evaluate = signalAgent.crocodile
      await createIndicatorSignal(symbol, timeframe, value, "Ema3Indicator", evaluate , args, "CrocodileSignal" )
}

export const createCrocodileDiveSignal = async (symbol, timeframe, value, args={}) => {
      let evaluate = signalAgent.crocodileDive;
      await createIndicatorSignal(symbol, timeframe, value, "Ema3Indicator", evaluate , args, "CrocodileDiveSignal" )
}

export const createWoodiesSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.woodies;
    await createIndicatorSignal(symbol, timeframe, value, "Woodies", evaluate , args, "Woodies")

}

export const createMultiDivSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.multiDiv;
    await createIndicatorSignal(symbol, timeframe, value, "MultiDivergenceDetector", evaluate , args ,"DivergenceDetector")
}

export const createUptrendSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.uptrendTrend;
    await createIndicatorSignal(symbol, timeframe, value, "EMAIndicator", evaluate , args, "UptrendSignal" )
}
export const createDownTrendSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.downTrend;
    await createIndicatorSignal(symbol, timeframe, value, "EMAIndicator", evaluate , args, "DownTrendSignal" )
}

export const createCrossUpSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.crossOver;
    await createIndicatorSignal(symbol, timeframe, value, "EMAIndicator", evaluate , args, "CrossUpSignal" )
}
export const createCrossDownSignal = async (symbol, timeframe, value, args={}) => {
     let evaluate = signalAgent.crossUnder;
    await createIndicatorSignal(symbol, timeframe, value, "EMAIndicator", evaluate , args, "CrossDownSignal" )
}