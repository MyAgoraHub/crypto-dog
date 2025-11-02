import { IndicatorList } from '../core/indicator/Indicators.js';

// Test Ema3Indicator
const o = [100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120];
const h = [105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125];
const l = [95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115];
const c = [102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122];
const v = [1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000];

try {
    const indicatorData = IndicatorList.getIndicator('Ema3Indicator')(o, h, l, c, v, {}, []);
    console.log('Ema3Indicator result:');
    console.log('ema1 length:', indicatorData.ema1?.length);
    console.log('ema2 length:', indicatorData.ema2?.length);
    console.log('ema3 length:', indicatorData.ema3?.length);
    console.log('Sample values at index 10:');
    console.log('ema1[10]:', indicatorData.ema1?.[10]);
    console.log('ema2[10]:', indicatorData.ema2?.[10]);
    console.log('ema3[10]:', indicatorData.ema3?.[10]);
} catch (error) {
    console.error('Error:', error);
}
