#!/usr/bin/env node

/**
 * Crypto Dog WebSocket Test Client
 * 
 * This script demonstrates the complete WebSocket integration
 * and captures all event payloads for documentation.
 */

import WebSocket from 'ws';
import fs from 'fs';

const WS_URL = 'ws://localhost:3000/ws';
const OUTPUT_FILE = 'websocket-events-captured.json';

let capturedEvents = [];
let eventCount = 0;

console.log('🐕 Crypto Dog WebSocket Test Client');
console.log('=====================================');

const ws = new WebSocket(WS_URL);

ws.on('open', () => {
    console.log('✅ Connected to WebSocket server');
    
    // Test sequence
    setTimeout(() => {
        console.log('📊 Subscribing to BTCUSDT 15m indicators...');
        ws.send(JSON.stringify({
            type: 'subscribe_indicators',
            symbol: 'BTCUSDT',
            interval: '15m'
        }));
    }, 1000);
    
    setTimeout(() => {
        console.log('🕯️ Requesting current candle...');
        ws.send(JSON.stringify({
            type: 'get_current_candle',
            symbol: 'BTCUSDT',
            interval: '15m'
        }));
    }, 5000);
    
    setTimeout(() => {
        console.log('📈 Requesting indicators snapshot...');
        ws.send(JSON.stringify({
            type: 'get_indicators',
            symbol: 'BTCUSDT',
            interval: '15m'
        }));
    }, 10000);
    
    setTimeout(() => {
        console.log('📡 Subscribing to Bybit topics...');
        ws.send(JSON.stringify({
            type: 'subscribe',
            topics: [
                'tickers.BTCUSDT',
                'kline.15.BTCUSDT',
                'publicTrade.BTCUSDT'
            ],
            category: 'spot'
        }));
    }, 15000);
    
    setTimeout(() => {
        console.log('🔄 Testing ETHUSDT indicators...');
        ws.send(JSON.stringify({
            type: 'subscribe_indicators',
            symbol: 'ETHUSDT',
            interval: '5m'
        }));
    }, 20000);
    
    // Stop after 60 seconds
    setTimeout(() => {
        console.log('⏰ Test complete. Saving captured events...');
        saveEvents();
        ws.close();
    }, 60000);
});

ws.on('message', (data) => {
    const event = JSON.parse(data.toString());
    eventCount++;
    
    console.log(`📨 Event ${eventCount}: ${event.type}`);
    
    // Capture event with metadata
    const capturedEvent = {
        timestamp: new Date().toISOString(),
        eventNumber: eventCount,
        ...event
    };
    
    capturedEvents.push(capturedEvent);
    
    // Log important events
    if (event.type === 'indicators_update') {
        const indicatorCount = Object.keys(event.indicators || {}).length;
        console.log(`   📊 ${indicatorCount} indicators updated for ${event.symbol} ${event.interval}`);
        
        // Log a few key indicators
        if (event.indicators) {
            console.log(`   💰 RSI: ${event.indicators.RSIIndicator?.toFixed(2)}`);
            console.log(`   📈 MACD: ${event.indicators.MACDIndicator_histogram?.toFixed(2)}`);
            console.log(`   🎯 SuperTrend: ${event.indicators.SuperTrendIndicator?.toFixed(2)}`);
        }
    }
    
    if (event.type === 'price_update') {
        console.log(`   💵 Price: $${event.price?.toLocaleString()}`);
    }
    
    if (event.type === 'current_candle') {
        const [timestamp, open, high, low, close, volume] = event.candle || [];
        console.log(`   🕯️ OHLCV: O:${open} H:${high} L:${low} C:${close} V:${volume}`);
    }
});

ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error.message);
});

ws.on('close', () => {
    console.log('🔌 WebSocket connection closed');
    console.log(`📊 Total events captured: ${eventCount}`);
    process.exit(0);
});

function saveEvents() {
    const output = {
        testInfo: {
            timestamp: new Date().toISOString(),
            totalEvents: eventCount,
            duration: '60 seconds',
            testSequence: [
                'Connect to WebSocket',
                'Subscribe to BTCUSDT 15m indicators',
                'Request current candle',
                'Request indicators snapshot', 
                'Subscribe to Bybit topics',
                'Subscribe to ETHUSDT 5m indicators'
            ]
        },
        capturedEvents: capturedEvents
    };
    
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
    console.log(`💾 Events saved to ${OUTPUT_FILE}`);
    
    // Create summary
    const eventTypes = {};
    capturedEvents.forEach(event => {
        eventTypes[event.type] = (eventTypes[event.type] || 0) + 1;
    });
    
    console.log('📋 Event Summary:');
    Object.entries(eventTypes).forEach(([type, count]) => {
        console.log(`   ${type}: ${count} events`);
    });
}

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n⏹️ Test interrupted. Saving captured events...');
    saveEvents();
    ws.close();
});
