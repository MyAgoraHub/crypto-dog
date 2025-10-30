import {
    getInstrumentsInfo, 
    getTickers, 
    getKlineCandles, 
    getIntervals, 
    getInterval,
    getOrderBook
} from './cryptoDogRequestHandler.js';

import {calculateNextFromToSequence} from "../cryptoDogTools.js";

const candleBuffer = [];

export const getPreviousCandles = async (category, symbol, interval, start, end, limit = 200) => {
    return await getKlineCandles(category, symbol, interval, start, end, limit);
}

export const loadCandleData = async (category, symbol, interval, iterations, limit)    => {
    const candleBuffer = []; // Create a fresh buffer for each call
    let klineData = await getKlineCandles(category, symbol, interval, null, null, limit);
    candleBuffer.push(...klineData.result.list);
    while (iterations > 1) {
        // Small delay to avoid hitting API rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
        
        let nextCandleSequence = calculateNextFromToSequence(klineData.result.list, interval);
        
        // Bybit API: Use 'end' parameter to fetch candles ending before that timestamp
        const newKlineData = await getPreviousCandles(category, symbol, interval, null, nextCandleSequence.to, limit);
        
        
        if (newKlineData && newKlineData.result && newKlineData.result.list.length > 0) {
            const firstCandle = newKlineData.result.list[0];
            const lastCandle = newKlineData.result.list[newKlineData.result.list.length - 1];
            
            klineData = newKlineData; // Update klineData for next iteration
            candleBuffer.push(...newKlineData.result.list);
        } else {
            console.error('API returned no data or unexpected format');
            break;
        }
        
        if(klineData && klineData.result.list.length < limit) {
            console.log('No more historical data available.');
            break;
        }
        iterations--;
    }
    return candleBuffer;
}

export const calculateNextInvocationBasedOnTimeFrame = (timeframe) => {
    const now = new Date();
    let nextInvocation = new Date(now);

    switch(timeframe) {
        case '1':
            nextInvocation.setMinutes(now.getMinutes() + 1, 0, 0);
            break;
        case '3':
            nextInvocation.setMinutes(now.getMinutes() + (3 - (now.getMinutes() % 3)), 0, 0);
            break;
        case '5':
            nextInvocation.setMinutes(now.getMinutes() + (5 - (now.getMinutes() % 5)), 0, 0);
            break;            
        case '15':            
            nextInvocation.setMinutes(now.getMinutes() + (15 - (now.getMinutes() % 15)), 0, 0); 
            break;
        case '30':
            nextInvocation.setMinutes(now.getMinutes() + (30 - (now.getMinutes() % 30)), 0, 0);
            break;
        case '60':
            nextInvocation.setHours(now.getHours() + 1, 0, 0, 0);
            break;
        case '120':
            nextInvocation.setHours(now.getHours() + (2 - (now.getHours() % 2)), 0, 0, 0);
            break;
        case '240':
            nextInvocation.setHours(now.getHours() + (4 - (now.getHours() % 4)), 0, 0, 0);
            break;
        case '360':
            nextInvocation.setHours(now.getHours() + (6 - (now.getHours() % 6)), 0, 0, 0);
            break;
        case '720':
            nextInvocation.setHours(now.getHours() + (12 - (now.getHours() % 12)), 0, 0, 0);
            break;
        case 'D':
            nextInvocation.setDate(now.getDate() + 1);
            nextInvocation.setHours(0, 0, 0, 0);
            break;
        case 'W':
            const daysUntilNextWeek = 7 - now.getDay(); // Days until next Sunday
            nextInvocation.setDate(now.getDate() + daysUntilNextWeek);
            nextInvocation.setHours(0, 0, 0, 0);
            break;
        case 'M':
            nextInvocation.setMonth(now.getMonth() + 1);
            nextInvocation.setDate(1);
            nextInvocation.setHours(0, 0, 0, 0);
            break;
        default:
            throw new Error(`Unsupported timeframe: ${timeframe}`);
    }

    return nextInvocation;
}