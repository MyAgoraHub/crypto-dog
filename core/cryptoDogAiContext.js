// Load historical data
import { getInterval } from './clients/cryptoDogRequestHandler.js';
import { loadCandleData } from './clients/cryptoDogAgent.js';
import { createIndicatorData } from './cryptoDogTools.js';
import { IndicatorList } from './indicator/Indicators.js';
import fs from 'fs';


class CryptoDogAiContext {  

    constructor(signal, iterations, candles) {
        this.csvBuffer = [];
        this.maxLength = 0;
        this.minLength = Infinity;
        this.signal = signal;
        this.iterations = iterations;
        this.candles = candles;
        this.klineData = [];
        this.indicators = {};
        this.maxSize = candles;
        this.refreshIndicatorData = false;
        this.staticIndicators = [
            "SuperTrendIndicator",
            "VolumeProfile",
            "FloorPivots",
            "Woodies",
            "DynamicGridSignals"
        ];

    }

    setMaxMinLength() {
        for (const key in this.indicators) {
            const length = this.indicators[key].length;
            this.maxLength = Math.max(this.maxLength, length);
            this.minLength = Math.min(this.minLength, length);
        }
    }

    loadIndicators () {
        let {o,h,l,c,v, buffer } = createIndicatorData(this.klineData);
        const indicatorMap = IndicatorList.getIndicator("all");
        for (const key in indicatorMap) {
            if(["Ema3Indicator","SupportAndResistance", "VolumeProfile", "MultiDivergenceDetector","FloorPivots", "Woodies", "DynamicGridSignals"].includes(key)) { continue; }
            const indicatorFunc = indicatorMap[key];
            let result = indicatorFunc(o, h, l, c, v, {}, buffer);
            if (Array.isArray(result)) {

                this.indicators[key] = result;
            }
            else {
                Object.keys(result).forEach(subKey => {
                    if (Array.isArray(result[subKey])) {
                        this.indicators[`${key}_${subKey}`] = result[subKey];
                    } else {
                    }
                });       
            }

        }
    }

    getIndicatorData() {
        return this.indicators;
    }

    createCsvBuffer() {
        let arrayWithSmallestEntries = this.minLength;
        // All entries should now be fixed to have the same length
        // fix Kline Data Should remove first entries to match the smallest indicator length
        this.klineData = this.klineData.slice(-arrayWithSmallestEntries);
        for (const key in this.indicators) {
            this.indicators[key] = this.indicators[key].slice(-arrayWithSmallestEntries);
        }

        // Create CSV Buffer
        this.csvBuffer = [];
        let headers = ['Timestamp', 'Open', 'High', 'Low', 'Close', 'Volume', 'Turnover'];
        for (const key in this.indicators) {
            
          
           // some indicataors return objects with multiple values
            if (typeof this.indicators[key][0] === 'object' && this.indicators[key][0] !== null) {
                const subKeys = Object.keys(this.indicators[key][0]);
                subKeys.forEach(subKey => {
                    headers.push(`${key}_${subKey}`);
                });
            }   else {
                headers.push(key);
            }

        }
        this.csvBuffer.push(headers.join(','));
        for (let i = 0; i < arrayWithSmallestEntries; i++) {
            let row = [
                ...this.klineData[i]
            ];
            for (const key in this.indicators) {
                const indicatorValue = this.indicators[key][i];
                if (typeof indicatorValue === 'object' && indicatorValue !== null) {
                    const subKeys = Object.keys(indicatorValue);
                    subKeys.forEach(subKey => {
                        row.push(indicatorValue[subKey]);
                    });
                } else {
                    row.push(indicatorValue);
                }
            }
            this.csvBuffer.push(row.join(','));
        }   

    }
    writeIndicatorCsvData() {

        const fileName = `cryptoDogAiContext_${this.signal.symbol}_${this.signal.timeframe}.csv`;
        fs.writeFileSync(fileName, this.csvBuffer.join('\n'));
        console.log(`CSV data written to ${fileName}`);
    }

    async loadData() {
         // Load historical data
            const interval = getInterval(this.signal.timeframe).value;
            const candleBuffer = await loadCandleData('spot', this.signal.symbol, interval, this.iterations, this.candles);
            const { o, h, l, c, v, buffer } = createIndicatorData(candleBuffer, this.signal.symbol);
            this.klineData = candleBuffer;
            this.indicators = {};
            this.loadIndicators();
            this.setMaxMinLength();
            this.createCsvBuffer();



    }

}


export const createCryptoDogAiContext = (signal, iterations = 200, candles = 500) => {
    return new CryptoDogAiContext(signal, iterations, candles);
};


const exploreCryptoDogAiContext = async (symbol = 'BTCUSDT', timeframe = '15m', iterations = 15, candles = 300) => {
    const signal = { symbol, interval: timeframe };
    const aiContext = createCryptoDogAiContext(signal, iterations, candles);
    await aiContext.loadData();
    aiContext.writeIndicatorCsvData();
};
