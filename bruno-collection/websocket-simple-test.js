const WebSocket = require('ws');
const fs = require('fs');

const WS_URL = 'ws://localhost:3000/ws';
let capturedEvents = [];
let eventCount = 0;

console.log('🐕 Crypto Dog WebSocket Test Client');
console.log('=====================================');

const ws = new WebSocket(WS_URL);

ws.on('open', () => {
    console.log('✅ Connected to WebSocket server');
    
    // Subscribe to indicators
    console.log('📊 Subscribing to BTCUSDT 15m indicators...');
    ws.send(JSON.stringify({
        type: 'subscribe_indicators',
        symbol: 'BTCUSDT',
        interval: '15m'
    }));
    
    // Auto-close after 15 seconds to capture some events
    setTimeout(() => {
        console.log('⏰ Test complete. Saving captured events...');
        saveEvents();
        ws.close();
    }, 15000);
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
    if (event.type === 'indicators_update' || event.type === 'indicators_initial') {
        const indicatorCount = Object.keys(event.indicators || {}).length;
        console.log(`   📊 ${indicatorCount} indicators for ${event.symbol} ${event.interval}`);
        
        if (event.indicators) {
            const formatNumber = (val) => typeof val === 'number' ? val.toFixed(2) : 'N/A';
            console.log(`   💰 RSI: ${formatNumber(event.indicators.RSIIndicator)}`);
            console.log(`   📈 MACD: ${formatNumber(event.indicators.MACDIndicator_histogram)}`);
            console.log(`   🎯 SuperTrend: ${formatNumber(event.indicators.SuperTrendIndicator)}`);
        }
    }
    
    if (event.type === 'price_update') {
        console.log(`   💵 Price: $${event.price?.toLocaleString() || 'N/A'}`);
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
            duration: '15 seconds',
            testDescription: 'Basic indicators subscription test'
        },
        capturedEvents: capturedEvents
    };
    
    fs.writeFileSync('websocket-events-captured.json', JSON.stringify(output, null, 2));
    console.log('💾 Events saved to websocket-events-captured.json');
    
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
