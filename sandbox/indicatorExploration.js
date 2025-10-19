import ohlcv  from '../ohlcv.json' assert { type: 'json' };  
import { createIndicatorData } from '../core/cryptoDogTools.js';
import {  FloorPivots, 
    Woodies,
    SmaIndicator,
    SuperTrendIndicator,
    RsiIndicator,
    AtrIndicator,
    BollingerIndicator,
    MacdIndicator,
    PatternRecognitionIndicator,
    WilliamsRIndicator,
    KsiIndicator,
    MfiIndicator,
    ObvIndicator,
    Ema4Indicator,
    Ema3Indicator,
    Ema10And20,
    Sma3Indicator,
    AdlIndicator,
    AdxIndicator,
    AwesomeOscillatorIndicator,
    CciIndicator,
    StochasticIndicator,
    IchimokuCloudIndicator,
    WildersSmoothingWeighteMovingAvg,
    WeighteMovingAvg,
    VolumeProfile,
    VolumeWeightedAvgPrice,
    TrixIndicator,
    ForceIndexIndiactor,
    RocIndicator,
    PsarIndicator,
    IndicatorUtils,
    EMAIndicator,
    ZEMAIndicator,
    IndicatorList,
    ZScore,
    MultiDivergenceDetector,
    DynamicGridSignals,
    SupportAndResistance } from '../core/indicator/Indicators.js';

export const generateData = () => {
    return ohlcv.data;
}


export const explore  = () =>{
      const { o, h, l, c, v, buffer } = createIndicatorData(ohlcv.data, "ADAUSTD");
      let data = EMAIndicator.getData(o, h, l, c, v, {period:200}, buffer );
     
      console.log(data.pop());
}

explore();