import { IndicatorList } from '../core/indicator/Indicators.js';

console.log('Testing RsiIndicator...');
try {
    const getData = IndicatorList.getIndicator('RsiIndicator');
    console.log('getData function:', typeof getData);
    console.log('getData:', getData);
} catch (error) {
    console.error('Error getting RsiIndicator:', error);
}
