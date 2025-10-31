import { IndicatorList } from './core/indicator/Indicators.js';

console.log('Testing Ema3Indicator...');
try {
    const getData = IndicatorList.getIndicator('Ema3Indicator');
    if (getData) {
        console.log('✅ Ema3Indicator found in map');
        // Test with dummy data
        const o = [100, 101, 102, 103, 104, 105];
        const h = [105, 106, 107, 108, 109, 110]; 
        const l = [95, 96, 97, 98, 99, 100];
        const c = [102, 103, 104, 105, 106, 107];
        const v = [1000, 1100, 1200, 1300, 1400, 1500];
        const result = getData(o, h, l, c, v, {}, []);
        console.log('✅ Ema3Indicator result type:', typeof result);
        if (result && typeof result === 'object') {
            console.log('✅ Ema3Indicator result keys:', Object.keys(result));
            if (result.ema1 && result.ema2 && result.ema3) {
                console.log('✅ Ema3Indicator has ema1, ema2, ema3 properties');
                console.log('Sample ema1 values:', result.ema1.slice(-3));
                console.log('Sample ema2 values:', result.ema2.slice(-3));
                console.log('Sample ema3 values:', result.ema3.slice(-3));
            }
        }
    } else {
        console.log('❌ Ema3Indicator not found in map');
    }
} catch (err) {
    console.error('❌ Ema3Indicator test failed:', err.message);
    console.error(err.stack);
}
