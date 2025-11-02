import { CryptoDogWebSocketHandler } from "./clients/cryptoDogWebsocketHandler.js";
import {IndicatorList} from "../core/indicator/Indicators.js"
import {createIndicatorData} from "./cryptoDogTools.js";
import chalk from 'chalk';
import Table from 'cli-table3';
import fs from 'fs';
import path from 'path';

const wsHandler = new CryptoDogWebSocketHandler({
  testnet: false,
  throttleMs: 5000
});

export class cryptoDogTradeBotAgent {
    constructor() {
        this.wsHandler = wsHandler;
        this.minLoadSize = 201;
        this.startTime = null;
        this.endTime = null;
        this.maxSize = 2000;
        this.klineData = [];
        this.indicators = {};
        this.refreshIndicatorData = true;
        this.onPriceUpdate = null; // Callback for price updates
    }

    isKlineDataLoaded() {
        return this.klineData.length > 0;
    }

    isNewDataPoint(open, high, low, close, volume, timestamp) {
        if (!this.isKlineDataLoaded()) {
            return true;
        }

        const lastEntry = this.klineData[this.klineData.length - 1];
        const [lastTimestamp, lastOpen, lastHigh, lastLow, lastClose, lastVolume] = lastEntry;

        const isSameTimestamp = lastTimestamp === timestamp;

        const isIdenticalData = (
            lastOpen === open &&
            lastHigh === high &&
            lastLow === low &&
            lastClose === close &&
            lastVolume === volume
        );

        return !isSameTimestamp && !isIdenticalData;
    }

    loadData(open, close, high, low, volume, timestamp, start, end) {
        let currentDate = new Date();
        let addNewCandle = new Date(end) <= currentDate;
        if (addNewCandle) {
            this.klineData.push([timestamp, open, high, low, close, volume]);
            this.refreshIndicatorData = true;
        } else  {
            if(this.isNewDataPoint(open, high, low, close, volume, timestamp)) {
                this.klineData[this.klineData.length - 1] = [timestamp, open, high, low, close, volume];
            }
        }
        this.trimDataBuffer();
    }

    trimDataBuffer() {
        if (this.klineData.length <= this.maxSize) return;
        this.klineData = this.klineData.slice(this.klineData.length - this.maxSize);
    }

    loadIndicators() {
        let staticIndicators = [
            "SuperTrendIndicator",
            "VolumeProfile",
            "FloorPivots",
            "Woodies",
            "DynamicGridSignals"
        ];
        
        let {o,h,l,c,v, buffer } = createIndicatorData(this.klineData);
        const indicatorMap = IndicatorList.getIndicator("all");
        for (const key in indicatorMap) {
            if(["Ema3Indicator","SupportAndResistance"].includes(key)) { continue; }
            const indicatorFunc = indicatorMap[key];
            let result = indicatorFunc(o, h, l, c, v, {}, buffer);
            if(staticIndicators.includes(key)) { 
                if(!this.refreshIndicatorData) {
                    continue;
                }
            }
            if (Array.isArray(result)) {
               
                this.indicators[key] = result.pop()       ;
            }
            else {
                Object.keys(result).forEach(subKey => {
                    if (Array.isArray(result[subKey])) {
                        this.indicators[`${key}_${subKey}`] = result[subKey].pop();
                    } else {
                    }
                });       
            }

        }
    }

    // Get current indicator values for display
    async startRealTimeKlineFeed(interval, symbol) {
        const { getKlineCandles, getInterval } = await import('./clients/cryptoDogRequestHandler.js');
        const intervalValue = getInterval(interval).value;

        // Load initial historical data
        const ohlcv = await getKlineCandles('spot', symbol, intervalValue, null, null, 201);
        if (ohlcv && ohlcv.result && ohlcv.result.list) {
            this.klineData = ohlcv.result.list.reverse();
        }

        // Subscribe to real-time updates
        const topic = `kline.${intervalValue}.${symbol}`;
        this.wsHandler.subscribeToTopics([topic], 'spot');

        // Handle real-time updates
        this.wsHandler.onUpdate((data) => {
            if (data.topic === topic && data.data) {
                const kline = data.data[0];
                if (kline) {
                    const open = parseFloat(kline.open);
                    const high = parseFloat(kline.high);
                    const low = parseFloat(kline.low);
                    const close = parseFloat(kline.close);
                    const volume = parseFloat(kline.volume);
                    const timestamp = parseInt(kline.start);
                    const end = parseInt(kline.end);    

                    // Update price immediately on every tick
                    if (this.onPriceUpdate) {
                        this.onPriceUpdate(close);
                    }

                    // Load new data point
                    this.loadData(open, close, high, low, volume, timestamp, null, new Date(end));
                    this.loadIndicators();
                    if(this.refreshIndicatorData){ 
                        this.refreshIndicatorData = false;
                    }
                }
            }
        });
    }
}

export const startInteractiveTradeBotAgent = (symbol = 'BTCUSDT', interval = '1h') => {
   const agent = new cryptoDogTradeBotAgent();
   agent.startRealTimeKlineFeed(interval, symbol);
};