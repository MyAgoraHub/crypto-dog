import { IndicatorList } from './core/indicator/Indicators.js';

// Test BollingerIndicator
const o = [100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120];
const h = [105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125];
const l = [95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115];
const c = [102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122];
const v = [1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000];

try {
    const indicatorData = IndicatorList.getIndicator('BollingerIndicator')(o, h, l, c, v, { period: 20, stdDev: 2 }, []);
    console.log('BollingerIndicator result:');
    console.log('Length:', indicatorData.length);
    console.log('First few entries:', indicatorData.slice(0, 5));
    console.log('Last few entries:', indicatorData.slice(-5));
} catch (error) {
    console.error('Error:', error);
}
