import  Candles  from './indicator/model/Candles.js';

export const calculateNextFromToSequence = (list, interval) => {
    // Bybit returns data in descending order (newest first)
    // list[0] = newest (most recent) timestamp
    // list[list.length - 1] = oldest (earliest) timestamp
    
    let newestTime = parseInt(list[0][0]);
    let oldestTime = parseInt(list[list.length - 1][0]);
    
    // Calculate interval in milliseconds
    const getIntervalMs = (intervalValue) => {
        if (intervalValue === 'D') return 24 * 60 * 60 * 1000; // 1 day
        if (intervalValue === 'W') return 7 * 24 * 60 * 60 * 1000; // 1 week
        if (intervalValue === 'M') return 30 * 24 * 60 * 60 * 1000; // 1 month (approximate)
        return parseInt(intervalValue) * 60 * 1000; // minutes to milliseconds
    };
    
    const intervalMs = getIntervalMs(interval);
    
    // Calculate the time span of current data
    const timeSpan = newestTime - oldestTime;
    
    // Calculate new sequence going backwards in time
    const newTo = oldestTime - intervalMs;  // End just before the oldest data we have
    const newFrom = newTo - timeSpan;  // Go back the same time span
    
    const newFromDate = new Date(newFrom);
    const newToDate = new Date(newTo);

    console.log(`Current Data: ${new Date(oldestTime).toISOString()} (oldest) to ${new Date(newestTime).toISOString()} (newest)`);
    console.log(`Next Fetch: ${newFromDate.toISOString()} (from) to ${newToDate.toISOString()} (to)`);
    console.log(`Time span: ${timeSpan}ms, Interval: ${intervalMs}ms`);
    
    return { from: newFrom, to: newTo, fromDate: newFromDate, toDate: newToDate };
};

export const getLastLookbackHigh =(highs, lookback) =>{

        const result = [];

        for (let i = 0; i < highs.length; i+=lookback) {
          const endIndex = i + lookback-1; // Calculate the end index for the current group of five
      
          // Ensure endIndex does not go beyond the array length
          const validEndIndex = Math.min(endIndex, highs.length - 1);
      
          // Find the maximum value within the current index and the next four indexes
          const maxInRange = Math.max(...highs.slice(i, validEndIndex + 1));
          const indexOfMax = highs.indexOf(maxInRange, i);
          // Store the index and the maximum value in the result array
          result.push({ index: indexOfMax, value: maxInRange });
        }
      
        return result;
}

export const getLastLookbackLow  =(lows, lookback) =>{
    const result = [];

    for (let i = 0; i < lows.length; i += lookback) {
      const endIndex = i + lookback-1; // Calculate the end index for the current group of five
      // Ensure endIndex does not go beyond the array length
      const validEndIndex = Math.min(endIndex, lows.length - 1);
      // Find the maximum value within the current index and the next four indexes
      const lowInRange = Math.min(...lows.slice(i, validEndIndex + 1));
      const indexOfLow = lows.indexOf(lowInRange, i);

      // Store the index and the maximum value in the result array
      result.push({ index: indexOfLow, value: lowInRange });
    }
  
    return result;
}

export const woodies =(o,h,l,c,v, args, candles) =>{
    // Pivot (P) = (H + L + 2 x C) / 4
    // Resistance (R1) = (2 x P) - L
    // R2 = P + H - L
    // Support (S1) = (2 x P) - H
    // S2 = P - H + L
    let buffer = [];
    c.forEach((close,index)=>{
        let p = (h[index]+ l[index] + 2 * c[index]) / 4
        let r1 = ( 2*p ) - l[index];
        let r2 = p + h[index] - l[index]
        let s1 = (2 * p) - h[index]
        let s2 = p - h[index] + l[index]
        buffer.push({woodies:{pivot:p,r1:r1,r2:r2,s1:s1,s2:s2}})
    })
    return buffer;
}

export const floorPivots =(o,h,l,c,v, args, candles) =>{
    let buffer = [];
    c.forEach((close,index)=>{
        let p = (h[index]+ l[index] + c[index]) / 3
        let r1 = (2*p)-l[index];
        let r2 = p + h[index] - l[index]
        let r3 = h[index] + 2 * (p-l[index])
        let s1 = (2 * p) - h[index]
        let s2 = p - h[index] + l[index]
        let s3 = l[index] - 2 * (h[index] - p)
        buffer.push({floor:{pivot:p,r1:r1,r2:r2,r3:r3,s1:s1,s2:s2,s3:s3}})
    })
    return buffer;
}

const getCloses = (candles)=>{
    let buffer = [];
    candles.forEach((candle) => {
        buffer.push(Number(candle.c))
    });
    return buffer;
};

/**
 *
 * @param candles {Array<Array<number>>} The ohlcv candle buffer
 * @returns {Array<number>} an Array with all Higher high data
 */
const getHighs = (candles)=>{
    let buffer = [];
    candles.forEach((candle) => {
        buffer.push(Number(candle.h))
    });
    return buffer;
};

/**
 *
 * @param candles {Array<Array<number>>} The ohlcv candle buffer
 * @returns {Array<number>} an Array with all lower low data
 */
const getLows = (candles)=>{
    let buffer = [];
    candles.forEach((candle) => {
        buffer.push(Number(candle.l))
    });
    return buffer;
};

/**
 *
 * @param candles {Array<Array<number>>} The ohlcv candle buffer
 * @returns {Array<number>} an Array with all opening data
 */
const getOpens = (candles)=>{
    let buffer = [];
    candles.forEach((candle) => {
        buffer.push(Number(candle.o))
    });
    return buffer;
};

/**
 *
 * @param candles {Array<Array<number>>} The ohlcv candle buffer
 * @returns Array<number> an Array with all volume data
 */
const getVolumes = (candles)=>{
    let buffer = [];
    candles.forEach((candle) => {
        buffer.push(Number(candle.v))
    });
    return buffer;
};

/**
 *
 * @param candles {Array<Array<number>>} The ohlcv candle buffer
 * @returns {Array<number>} an Array with all closing data
 */
export const  closes = (candles) => {return getCloses(candles);};
/**
 *
 * @param candles {Array<Array<number>>} The ohlcv candle buffer
 * @returns {Array<number>} an Array with all Higher high data
 */
export const  highs = (candles)  => {return getHighs( candles)};
/**
 *
 * @param candles {Array<Array<number>>} The ohlcv candle buffer
 * @returns {Array<number>} an Array with all lower low  data
 */
export const  lows = (candles)   => {return getLows(candles)};
/**
 *
 * @param candles {Array<Array<number>>} The ohlcv candle buffer
 * @returns {Array<number>} an Array with all opening data
 */
export const  open = (candles)   => {return getOpens(candles)};
/**
 *
 * @param candles {Array<Array<number>>} The ohlcv candle buffer
 * @returns {Array<number>} an Array with all volume high data
 */
export const  volume = (candles) => {return getVolumes(candles)};

export const sortAscByTimestamp = (buffer) => {
    return buffer.sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
};

export const createIndicatorData = (buffer) => {
    let candleSticks = null;
    if (buffer[0][0] > buffer[buffer.length - 1][0]) {
        // need to reverse the Array some exchanges provide OHLCV data in desc order
        candleSticks = new Candles(null, sortAscByTimestamp(buffer))

    } else {
        candleSticks = new Candles(null, buffer)
    }
    let candles = candleSticks.getCandles().candles;
    let  c =getCloses( candles );
    let  o =getOpens(candles);
    let  h = getHighs(candles);
    let  l =getLows(candles);
    let  v = getVolumes(candles);
    return { o,h,l,c,v, buffer }
};