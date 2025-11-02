import { IndicatorList } from '../core/indicator/Indicators.js';

console.log('Testing Woodies indicator...');
try {
    const getData = IndicatorList.getIndicator('Woodies');
    console.log('getData function:', typeof getData);

    // Test with some sample data
    const o = [100, 101, 102];
    const h = [105, 106, 107];
    const l = [95, 96, 97];
    const c = [102, 103, 104];
    const v = [1000, 1100, 1200];
    const args = {};
    const candles = [[1000, 100, 105, 95, 102, 1000], [1001, 101, 106, 96, 103, 1100], [1002, 102, 107, 97, 104, 1200]];

    const result = getData(o, h, l, c, v, args, candles);
    console.log('Woodies result:', result);
} catch (error) {
    console.error('Error testing Woodies:', error);
}
