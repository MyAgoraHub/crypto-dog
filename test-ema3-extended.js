import { IndicatorList } from './core/indicator/Indicators.js';

// Create more test data (200 candles)
const c = Array.from({length: 200}, (_, i) => 100 + Math.sin(i * 0.1) * 10 + i * 0.1);
const o = c.map(v => v - 1);
const h = c.map(v => v + 2);
const l = c.map(v => v - 2);
const v = Array(200).fill(1000);

try {
    const indicatorData = IndicatorList.getIndicator('Ema3Indicator')(o, h, l, c, v, {}, []);
    console.log('Ema3Indicator result:');
    console.log('ema1 length:', indicatorData.ema1?.length);
    console.log('ema2 length:', indicatorData.ema2?.length);
    console.log('ema3 length:', indicatorData.ema3?.length);
    console.log('Sample values at index 50:');
    console.log('ema1[50]:', indicatorData.ema1?.[50]);
    console.log('ema2[50]:', indicatorData.ema2?.[50]);
    console.log('ema3[50]:', indicatorData.ema3?.[50]);
} catch (error) {
    console.error('Error:', error);
}
