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

// MACD Signals
export const createMacdBullishSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.macdBullish;
    await createIndicatorSignal(symbol, timeframe, value, "MacdIndicator", evaluate , args, "MacdBullishSignal" )
}

export const createMacdBearishSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.macdBearish;
    await createIndicatorSignal(symbol, timeframe, value, "MacdIndicator", evaluate , args, "MacdBearishSignal" )
}

// Bollinger Band Signals
export const createBollingerUpperTouchSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.bollingerUpperTouch;
    await createIndicatorSignal(symbol, timeframe, value, "BollingerIndicator", evaluate , args, "BollingerUpperTouchSignal" )
}

export const createBollingerLowerTouchSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.bollingerLowerTouch;
    await createIndicatorSignal(symbol, timeframe, value, "BollingerIndicator", evaluate , args, "BollingerLowerTouchSignal" )
}

// Stochastic Signals
export const createStochasticOverboughtSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.stochasticOverbought;
    await createIndicatorSignal(symbol, timeframe, value, "StochasticIndicator", evaluate , args, "StochasticOverboughtSignal" )
}

export const createStochasticOversoldSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.stochasticOversold;
    await createIndicatorSignal(symbol, timeframe, value, "StochasticIndicator", evaluate , args, "StochasticOversoldSignal" )
}

// Williams %R Signals
export const createWilliamsOverboughtSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.williamsOverbought;
    await createIndicatorSignal(symbol, timeframe, value, "WilliamsRIndicator", evaluate , args, "WilliamsOverboughtSignal" )
}

export const createWilliamsOversoldSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.williamsOversold;
    await createIndicatorSignal(symbol, timeframe, value, "WilliamsRIndicator", evaluate , args, "WilliamsOversoldSignal" )
}

// Moving Average Signals
export const createGoldenCrossSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.goldenCross;
    await createIndicatorSignal(symbol, timeframe, value, "EMAIndicator", evaluate , args, "GoldenCrossSignal" )
}

export const createDeathCrossSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.deathCross;
    await createIndicatorSignal(symbol, timeframe, value, "EMAIndicator", evaluate , args, "DeathCrossSignal" )
}

// Volume Signals
export const createVolumeSpikeSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.volumeSpike;
    await createIndicatorSignal(symbol, timeframe, value, "ObvIndicator", evaluate , args, "VolumeSpikeSignal" )
}

// Ichimoku Signals
export const createIchimokuBullishSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.ichimokuBullish;
    await createIndicatorSignal(symbol, timeframe, value, "IchimokuCloudIndicator", evaluate , args, "IchimokuBullishSignal" )
}

export const createIchimokuBearishSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.ichimokuBearish;
    await createIndicatorSignal(symbol, timeframe, value, "IchimokuCloudIndicator", evaluate , args, "IchimokuBearishSignal" )
}

// ADX Signals
export const createAdxStrongTrendSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.adxStrongTrend;
    await createIndicatorSignal(symbol, timeframe, value, "AdxIndicator", evaluate , args, "AdxStrongTrendSignal" )
}

// MFI Signals
export const createMfiOverboughtSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.mfiOverbought;
    await createIndicatorSignal(symbol, timeframe, value, "MfiIndicator", evaluate , args, "MfiOverboughtSignal" )
}

export const createMfiOversoldSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.mfiOversold;
    await createIndicatorSignal(symbol, timeframe, value, "MfiIndicator", evaluate , args, "MfiOversoldSignal" )
}

// ATR Signals
export const createAtrHighVolatilitySignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.atrHighVolatility;
    await createIndicatorSignal(symbol, timeframe, value, "AtrIndicator", evaluate , args, "AtrHighVolatilitySignal" )
}

// Parabolic SAR Signals
export const createParabolicSarBullishSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.parabolicSarBullish;
    await createIndicatorSignal(symbol, timeframe, value, "PsarIndicator", evaluate , args, "ParabolicSarBullishSignal" )
}

export const createParabolicSarBearishSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.parabolicSarBearish;
    await createIndicatorSignal(symbol, timeframe, value, "PsarIndicator", evaluate , args, "ParabolicSarBearishSignal" )
}

// CCI Signals
export const createCciOverboughtSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.cciOverbought;
    await createIndicatorSignal(symbol, timeframe, value, "CciIndicator", evaluate , args, "CciOverboughtSignal" )
}

export const createCciOversoldSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.cciOversold;
    await createIndicatorSignal(symbol, timeframe, value, "CciIndicator", evaluate , args, "CciOversoldSignal" )
}

// Elder Impulse Signals
export const createElderImpulseBullishSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.elderImpulseBullish;
    await createIndicatorSignal(symbol, timeframe, value, "EMAIndicator", evaluate , args, "ElderImpulseBullishSignal" )
}

export const createElderImpulseBearishSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.elderImpulseBearish;
    await createIndicatorSignal(symbol, timeframe, value, "EMAIndicator", evaluate , args, "ElderImpulseBearishSignal" )
}

// Fibonacci Signals
export const createFibonacciRetracementSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.fibonacciRetracement;
    await createIndicatorSignal(symbol, timeframe, value, "EMAIndicator", evaluate , args, "FibonacciRetracementSignal" )
}

// SuperTrend Signals
export const createSuperTrendBullishSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.superTrendBullish;
    await createIndicatorSignal(symbol, timeframe, value, "SuperTrendIndicator", evaluate , args, "SuperTrendBullishSignal" )
}

export const createSuperTrendBearishSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.superTrendBearish;
    await createIndicatorSignal(symbol, timeframe, value, "SuperTrendIndicator", evaluate , args, "SuperTrendBearishSignal" )
}

// Keltner Channel Signals
export const createKeltnerUpperBreakoutSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.keltnerUpperBreakout;
    await createIndicatorSignal(symbol, timeframe, value, "EMAIndicator", evaluate , args, "KeltnerUpperBreakoutSignal" )
}

export const createKeltnerLowerBreakoutSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.keltnerLowerBreakout;
    await createIndicatorSignal(symbol, timeframe, value, "EMAIndicator", evaluate , args, "KeltnerLowerBreakoutSignal" )
}

// Heikin-Ashi Signals
export const createHeikinAshiBullishSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.heikinAshiBullish;
    await createIndicatorSignal(symbol, timeframe, value, "HeikinAshiIndicator", evaluate , args, "HeikinAshiBullishSignal" )
}

export const createHeikinAshiBearishSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.heikinAshiBearish;
    await createIndicatorSignal(symbol, timeframe, value, "HeikinAshiIndicator", evaluate , args, "HeikinAshiBearishSignal" )
}

// Chaikin Money Flow Signals
export const createChaikinBullishSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.chaikinBullish;
    await createIndicatorSignal(symbol, timeframe, value, "ChaikinMoneyFlowIndicator", evaluate , args, "ChaikinBullishSignal" )
}

export const createChaikinBearishSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.chaikinBearish;
    await createIndicatorSignal(symbol, timeframe, value, "ChaikinMoneyFlowIndicator", evaluate , args, "ChaikinBearishSignal" )
}

// Force Index Signals
export const createForceIndexBullishSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.forceIndexBullish;
    await createIndicatorSignal(symbol, timeframe, value, "ForceIndexIndicator", evaluate , args, "ForceIndexBullishSignal" )
}

export const createForceIndexBearishSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.forceIndexBearish;
    await createIndicatorSignal(symbol, timeframe, value, "ForceIndexIndicator", evaluate , args, "ForceIndexBearishSignal" )
}

// Ultimate Oscillator Signals
export const createUltimateOscillatorBullishSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.ultimateOscillatorBullish;
    await createIndicatorSignal(symbol, timeframe, value, "UltimateOscillatorIndicator", evaluate , args, "UltimateOscillatorBullishSignal" )
}

export const createUltimateOscillatorBearishSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.ultimateOscillatorBearish;
    await createIndicatorSignal(symbol, timeframe, value, "UltimateOscillatorIndicator", evaluate , args, "UltimateOscillatorBearishSignal" )
}

// TSI Signals
export const createTsiBullishSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.tsiBullish;
    await createIndicatorSignal(symbol, timeframe, value, "TsiIndicator", evaluate , args, "TsiBullishSignal" )
}

export const createTsiBearishSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.tsiBearish;
    await createIndicatorSignal(symbol, timeframe, value, "TsiIndicator", evaluate , args, "TsiBearishSignal" )
}

// Vortex Signals
export const createVortexBullishSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.vortexBullish;
    await createIndicatorSignal(symbol, timeframe, value, "VortexIndicator", evaluate , args, "VortexBullishSignal" )
}

export const createVortexBearishSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.vortexBearish;
    await createIndicatorSignal(symbol, timeframe, value, "VortexIndicator", evaluate , args, "VortexBearishSignal" )
}

// Aroon Signals
export const createAroonBullishSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.aroonBullish;
    await createIndicatorSignal(symbol, timeframe, value, "AroonIndicator", evaluate , args, "AroonBullishSignal" )
}

export const createAroonBearishSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.aroonBearish;
    await createIndicatorSignal(symbol, timeframe, value, "AroonIndicator", evaluate , args, "AroonBearishSignal" )
}

// ROC Signals
export const createRocBullishSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.rocBullish;
    await createIndicatorSignal(symbol, timeframe, value, "RocIndicator", evaluate , args, "RocBullishSignal" )
}

export const createRocBearishSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.rocBearish;
    await createIndicatorSignal(symbol, timeframe, value, "RocIndicator", evaluate , args, "RocBearishSignal" )
}

// TRIX Signals
export const createTrixBullishSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.trixBullish;
    await createIndicatorSignal(symbol, timeframe, value, "TrixIndicator", evaluate , args, "TrixBullishSignal" )
}

export const createTrixBearishSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.trixBearish;
    await createIndicatorSignal(symbol, timeframe, value, "TrixIndicator", evaluate , args, "TrixBearishSignal" )
}

// WMA Signals
export const createWmaBullishSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.wmaBullish;
    await createIndicatorSignal(symbol, timeframe, value, "WmaIndicator", evaluate , args, "WmaBullishSignal" )
}

export const createWmaBearishSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.wmaBearish;
    await createIndicatorSignal(symbol, timeframe, value, "WmaIndicator", evaluate , args, "WmaBearishSignal" )
}

// DEMA Signals
export const createDemaBullishSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.demaBullish;
    await createIndicatorSignal(symbol, timeframe, value, "DemaIndicator", evaluate , args, "DemaBullishSignal" )
}

export const createDemaBearishSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.demaBearish;
    await createIndicatorSignal(symbol, timeframe, value, "DemaIndicator", evaluate , args, "DemaBearishSignal" )
}

// TEMA Signals
export const createTemaBullishSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.temaBullish;
    await createIndicatorSignal(symbol, timeframe, value, "TemaIndicator", evaluate , args, "TemaBullishSignal" )
}

export const createTemaBearishSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.temaBearish;
    await createIndicatorSignal(symbol, timeframe, value, "TemaIndicator", evaluate , args, "TemaBearishSignal" )
}

// VWAP Signals
export const createVwapBullishSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.vwapBullish;
    await createIndicatorSignal(symbol, timeframe, value, "VwapIndicator", evaluate , args, "VwapBullishSignal" )
}

export const createVwapBearishSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.vwapBearish;
    await createIndicatorSignal(symbol, timeframe, value, "VwapIndicator", evaluate , args, "VwapBearishSignal" )
}

// OBV Signals
export const createObvBullishSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.obvBullish;
    await createIndicatorSignal(symbol, timeframe, value, "ObvIndicator", evaluate , args, "ObvBullishSignal" )
}

export const createObvBearishSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.obvBearish;
    await createIndicatorSignal(symbol, timeframe, value, "ObvIndicator", evaluate , args, "ObvBearishSignal" )
}

// ADL Signals
export const createAdlBullishSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.adlBullish;
    await createIndicatorSignal(symbol, timeframe, value, "AdlIndicator", evaluate , args, "AdlBullishSignal" )
}

export const createAdlBearishSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.adlBearish;
    await createIndicatorSignal(symbol, timeframe, value, "AdlIndicator", evaluate , args, "AdlBearishSignal" )
}

// Balance of Power Signals
export const createBalanceOfPowerBullishSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.balanceOfPowerBullish;
    await createIndicatorSignal(symbol, timeframe, value, "BalanceOfPowerIndicator", evaluate , args, "BalanceOfPowerBullishSignal" )
}

export const createBalanceOfPowerBearishSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.balanceOfPowerBearish;
    await createIndicatorSignal(symbol, timeframe, value, "BalanceOfPowerIndicator", evaluate , args, "BalanceOfPowerBearishSignal" )
}

// Coppock Curve Signals
export const createCoppockBullishSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.coppockBullish;
    await createIndicatorSignal(symbol, timeframe, value, "CoppockCurveIndicator", evaluate , args, "CoppockBullishSignal" )
}

export const createCoppockBearishSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.coppockBearish;
    await createIndicatorSignal(symbol, timeframe, value, "CoppockCurveIndicator", evaluate , args, "CoppockBearishSignal" )
}

// KST Signals
export const createKstBullishSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.kstBullish;
    await createIndicatorSignal(symbol, timeframe, value, "KstIndicator", evaluate , args, "KstBullishSignal" )
}

export const createKstBearishSignal = async (symbol, timeframe, value, args={}) => {
    let evaluate = signalAgent.kstBearish;
    await createIndicatorSignal(symbol, timeframe, value, "KstIndicator", evaluate , args, "KstBearishSignal" )
}

