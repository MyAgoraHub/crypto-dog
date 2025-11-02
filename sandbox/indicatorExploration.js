import { createIndicatorData } from '../core/cryptoDogTools.js';
import { getIndicator } from '../core/indicator/Indicators.js';

export const generateData = () => {
    return ohlcv.data;
}


export const explore  = () =>{
      const { o, h, l, c, v, buffer } = createIndicatorData(ohlcv.data, "ADAUSTD");
      let indicatorMap =  getIndicator("all");
};

explore();