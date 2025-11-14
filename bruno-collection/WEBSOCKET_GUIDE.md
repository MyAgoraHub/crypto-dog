# WebSocket Integration Guide

Complete guide for using Crypto Dog WebSocket API with Bruno, Expo, and web applications.

## 📡 WebSocket Overview

The Crypto Dog server provides a WebSocket endpoint that acts as a **proxy to Bybit's WebSocket API**. It allows you to subscribe to real-time market data streams.

**Endpoint:** `ws://localhost:3000/ws`

## 🔌 Connection Flow

```
Client (Bruno/Expo/Web) 
    ↓ WebSocket Connection
Server (Crypto Dog)
    ↓ WebSocket Connection
Bybit Exchange
    ↓ Real-time Data
Server → Client
```

## 📋 Available Topics

### Market Data Streams

```javascript
// Kline/Candlestick Data
`kline.{interval}.{symbol}`
// Examples:
'kline.1.BTCUSDT'      // 1-minute candles
'kline.5.BTCUSDT'      // 5-minute candles
'kline.15.BTCUSDT'     // 15-minute candles
'kline.60.BTCUSDT'     // 1-hour candles
'kline.D.BTCUSDT'      // Daily candles

// Order Book (Depth)
`orderbook.{depth}.{symbol}`
// Examples:
'orderbook.25.BTCUSDT'   // Top 25 bid/ask levels
'orderbook.50.BTCUSDT'   // Top 50 bid/ask levels
'orderbook.100.BTCUSDT'  // Top 100 bid/ask levels

// Public Trades
`publicTrade.{symbol}`
// Example:
'publicTrade.BTCUSDT'

// Ticker (24hr stats)
`tickers.{symbol}`
// Example:
'tickers.BTCUSDT'
```

## 🧪 Testing with WebSocket Tools

### Option 1: Using Browser Console

Open browser console at `http://localhost:3000` and paste:

```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

ws.onopen = () => {
  console.log('✅ Connected!');
  
  // Subscribe to Bitcoin 15min candles
  ws.send(JSON.stringify({
    type: 'subscribe',
    topics: ['kline.15.BTCUSDT'],
    category: 'spot'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('📊 Received:', data);
};

ws.onerror = (error) => {
  console.error('❌ Error:', error);
};

ws.onclose = () => {
  console.log('🔌 Disconnected');
};
```

### Option 2: Using wscat (CLI Tool)

```bash
# Install wscat
npm install -g wscat

# Connect to server
wscat -c ws://localhost:3000/ws

# Send subscription (paste this after connecting)
{"type":"subscribe","topics":["kline.15.BTCUSDT","publicTrade.BTCUSDT"],"category":"spot"}
```

### Option 3: Using Postman/Bruno WebSocket

1. **Create WebSocket Request** in Postman/Bruno
2. **URL**: `ws://localhost:3000/ws`
3. **Connect**
4. **Send Message**:
```json
{
  "type": "subscribe",
  "topics": ["kline.15.BTCUSDT", "tickers.BTCUSDT"],
  "category": "spot"
}
```

**Note:** Bruno supports WebSocket connections in version 1.0+. Check your version!

## 📱 Expo/React Native Integration

### 1. Install WebSocket Library

Expo includes WebSocket support by default, but for better features:

```bash
npm install react-native-websocket
# or
npm install socket.io-client
```

### 2. Create WebSocket Service

```javascript
// services/cryptoDogWebSocket.js
class CryptoDogWebSocket {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect(url = 'ws://localhost:3000/ws') {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('✅ WebSocket Connected');
        this.reconnectAttempts = 0;
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket Error:', error);
        reject(error);
      };

      this.ws.onclose = () => {
        console.log('🔌 WebSocket Disconnected');
        this.handleReconnect();
      };
    });
  }

  handleMessage(data) {
    const { type } = data;
    
    // Call all registered listeners for this message type
    if (this.listeners.has(type)) {
      this.listeners.get(type).forEach(callback => callback(data));
    }

    // Call generic listeners
    if (this.listeners.has('*')) {
      this.listeners.get('*').forEach(callback => callback(data));
    }
  }

  subscribe(topics, category = 'spot') {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        topics: Array.isArray(topics) ? topics : [topics],
        category
      }));
    } else {
      console.error('WebSocket not connected');
    }
  }

  unsubscribe(topics) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'unsubscribe',
        topics: Array.isArray(topics) ? topics : [topics]
      }));
    }
  }

  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(callback);
  }

  off(eventType, callback) {
    if (this.listeners.has(eventType)) {
      const callbacks = this.listeners.get(eventType);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      
      console.log(`Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch(console.error);
      }, delay);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Export singleton instance
export const cryptoDogWS = new CryptoDogWebSocket();
```

### 3. React Component Example

```javascript
// screens/MarketScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { cryptoDogWS } from '../services/cryptoDogWebSocket';

export default function MarketScreen() {
  const [price, setPrice] = useState(null);
  const [candle, setCandle] = useState(null);
  const [trades, setTrades] = useState([]);

  useEffect(() => {
    // Connect to WebSocket
    cryptoDogWS.connect('ws://YOUR_SERVER_IP:3000/ws')
      .then(() => {
        console.log('Connected to Crypto Dog WebSocket');
        
        // Subscribe to topics
        cryptoDogWS.subscribe([
          'kline.15.BTCUSDT',
          'tickers.BTCUSDT',
          'publicTrade.BTCUSDT'
        ], 'spot');
      })
      .catch(console.error);

    // Listen for updates
    const handleUpdate = (data) => {
      if (data.type === 'update') {
        const { topic, data: updateData } = data.data;
        
        if (topic?.startsWith('kline')) {
          setCandle(updateData);
        } else if (topic?.startsWith('tickers')) {
          setPrice(updateData);
        } else if (topic?.startsWith('publicTrade')) {
          setTrades(prev => [updateData, ...prev].slice(0, 10));
        }
      }
    };

    cryptoDogWS.on('update', handleUpdate);

    // Cleanup
    return () => {
      cryptoDogWS.off('update', handleUpdate);
      cryptoDogWS.disconnect();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BTC/USDT Live</Text>
      
      {price && (
        <Text style={styles.price}>
          ${price.lastPrice || 'N/A'}
        </Text>
      )}
      
      {candle && (
        <View style={styles.candle}>
          <Text>Open: {candle.open}</Text>
          <Text>High: {candle.high}</Text>
          <Text>Low: {candle.low}</Text>
          <Text>Close: {candle.close}</Text>
        </View>
      )}
      
      <Text style={styles.subtitle}>Recent Trades</Text>
      {trades.map((trade, index) => (
        <Text key={index}>
          {trade.price} @ {trade.size}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold' },
  price: { fontSize: 32, color: 'green', marginVertical: 10 },
  candle: { marginVertical: 10 },
  subtitle: { fontSize: 18, fontWeight: 'bold', marginTop: 20 }
});
```

### 4. React Hooks Pattern

```javascript
// hooks/useWebSocket.js
import { useEffect, useState, useCallback } from 'react';
import { cryptoDogWS } from '../services/cryptoDogWebSocket';

export function useWebSocket(topics, category = 'spot') {
  const [data, setData] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    cryptoDogWS.connect()
      .then(() => {
        setConnected(true);
        cryptoDogWS.subscribe(topics, category);
      })
      .catch(err => {
        setError(err);
        setConnected(false);
      });

    const handleUpdate = (message) => {
      if (message.type === 'update') {
        setData(message.data);
      }
    };

    cryptoDogWS.on('update', handleUpdate);

    return () => {
      cryptoDogWS.off('update', handleUpdate);
    };
  }, [topics, category]);

  return { data, connected, error };
}

// Usage in component
function PriceDisplay() {
  const { data, connected } = useWebSocket(['tickers.BTCUSDT'], 'spot');
  
  return (
    <View>
      <Text>Status: {connected ? '🟢 Connected' : '🔴 Disconnected'}</Text>
      {data && <Text>Price: ${data.data?.lastPrice}</Text>}
    </View>
  );
}
```

## 🌐 Web Application Integration

```javascript
// For vanilla JavaScript or React web apps
class CryptoDogWebSocket {
  constructor(url = 'ws://localhost:3000/ws') {
    this.url = url;
    this.ws = null;
    this.handlers = {};
  }

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('Connected to Crypto Dog WebSocket');
      if (this.handlers.open) this.handlers.open();
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (this.handlers.message) this.handlers.message(data);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (this.handlers.error) this.handlers.error(error);
    };

    this.ws.onclose = () => {
      console.log('Disconnected');
      if (this.handlers.close) this.handlers.close();
    };
  }

  subscribe(topics, category = 'spot') {
    this.ws.send(JSON.stringify({
      type: 'subscribe',
      topics,
      category
    }));
  }

  on(event, handler) {
    this.handlers[event] = handler;
  }
}

// Usage
const ws = new CryptoDogWebSocket();
ws.on('message', (data) => {
  console.log('Received:', data);
});
ws.connect();
ws.subscribe(['kline.15.BTCUSDT'], 'spot');
```

## 📊 Message Types

### 1. Connection Message
```json
{
  "type": "connected",
  "clientId": "1731600000000",
  "message": "Connected to Crypto Dog WebSocket server"
}
```

### 2. Subscription Confirmation
```json
{
  "type": "subscribed",
  "topics": ["kline.15.BTCUSDT"],
  "category": "spot"
}
```

### 3. Update Message (Market Data)
```json
{
  "type": "update",
  "data": {
    "topic": "kline.15.BTCUSDT",
    "type": "snapshot",
    "ts": 1731600000000,
    "data": {
      "start": 1731599100000,
      "end": 1731600000000,
      "interval": "15",
      "open": "42000.00",
      "close": "42100.50",
      "high": "42150.00",
      "low": "41950.00",
      "volume": "125.45",
      "turnover": "5280000.00",
      "confirm": false
    }
  }
}
```

### 4. Error Message
```json
{
  "type": "error",
  "error": "Error message here"
}
```

### 5. Unsubscribe Confirmation
```json
{
  "type": "unsubscribed",
  "topics": ["kline.15.BTCUSDT"]
}
```

## 🛠️ Helper Functions

### Get All Topics for a Symbol

```javascript
// Using the static helper from cryptoDogTradeWebsocketHandler
import { CryptoDogWebSocketHandler } from './core/clients/cryptoDogTradeWebsocketHandler.js';

const topics = CryptoDogWebSocketHandler.getTopicsPerWSKey('BTCUSDT', 50);
// Returns:
// [
//   'orderbook.50.BTCUSDT',
//   'kline.{interval}.BTCUSDT',
//   'publicTrade.BTCUSDT',
//   'tickers.BTCUSDT'
// ]
```

## ⚡ Performance Tips

1. **Throttle Updates**: The server has built-in throttling (1 second default)
2. **Subscribe Only What You Need**: Don't subscribe to all topics if you only need price
3. **Batch Subscriptions**: Subscribe to multiple topics in one message
4. **Handle Reconnection**: Always implement reconnection logic
5. **Clean Up**: Unsubscribe when component unmounts

## 🐛 Troubleshooting

### Connection Refused
```bash
# Make sure server is running
node server.js
```

### No Data Received
1. Check subscription confirmation message
2. Verify topic format (e.g., `kline.15.BTCUSDT` not `kline.15min.BTCUSDT`)
3. Ensure symbol is valid (use `/api/symbols` endpoint)
4. Check server logs for Bybit connection issues

### Expo Network Issues
For Expo in development:
```javascript
// Use your computer's IP address, not localhost
const WS_URL = 'ws://192.168.1.100:3000/ws';
```

Find your IP:
```bash
# macOS/Linux
ifconfig | grep "inet "

# Windows
ipconfig
```

## 📝 Complete Example: Multi-Symbol Dashboard

```javascript
import React, { useEffect, useState } from 'react';
import { cryptoDogWS } from './services/cryptoDogWebSocket';

function CryptoDashboard() {
  const [symbols] = useState(['BTCUSDT', 'ETHUSDT', 'SOLUSDT']);
  const [prices, setPrices] = useState({});

  useEffect(() => {
    cryptoDogWS.connect().then(() => {
      // Subscribe to tickers for all symbols
      const topics = symbols.map(s => `tickers.${s}`);
      cryptoDogWS.subscribe(topics, 'spot');
    });

    cryptoDogWS.on('update', (data) => {
      if (data.type === 'update' && data.data?.topic?.startsWith('tickers')) {
        const symbol = data.data.topic.split('.')[1];
        setPrices(prev => ({
          ...prev,
          [symbol]: data.data.data
        }));
      }
    });

    return () => cryptoDogWS.disconnect();
  }, []);

  return (
    <div>
      <h1>Crypto Dashboard</h1>
      {symbols.map(symbol => (
        <div key={symbol}>
          <h2>{symbol}</h2>
          <p>Price: ${prices[symbol]?.lastPrice || 'Loading...'}</p>
          <p>24h Change: {prices[symbol]?.price24hPcnt || 'N/A'}%</p>
        </div>
      ))}
    </div>
  );
}
```

---

**Need Help?** Check the [main README](./README.md) for more information or open an issue on GitHub.
