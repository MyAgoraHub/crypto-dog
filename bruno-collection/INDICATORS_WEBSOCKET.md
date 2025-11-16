# 📊 Real-time Indicators WebSocket Integration

This document describes the integration of `cryptoDogTradeBotAgent` into the server's WebSocket system for real-time indicator streaming.

## Overview

The server now provides real-time technical indicators and candle data through WebSocket connections, powered by the `cryptoDogTradeBotAgent` class.

## Features

- **Real-time Indicators**: Stream all 40+ technical indicators in real-time
- **Current Candle Data**: Access to the latest candle information
- **Price Updates**: Real-time price updates for subscribed symbols
- **Multiple Symbols/Intervals**: Support for different trading pairs and timeframes

## WebSocket Message Types

### Client → Server

#### 1. Subscribe to Indicators
```json
{
  "type": "subscribe_indicators",
  "symbol": "BTCUSDT",
  "interval": "15m"
}
```

#### 2. Unsubscribe from Indicators
```json
{
  "type": "unsubscribe_indicators",
  "symbol": "BTCUSDT",
  "interval": "15m"
}
```

#### 3. Get Current Candle
```json
{
  "type": "get_current_candle",
  "symbol": "BTCUSDT",
  "interval": "15m"
}
```

#### 4. Get Indicators Snapshot
```json
{
  "type": "get_indicators",
  "symbol": "BTCUSDT",
  "interval": "15m"
}
```

### Server → Client

#### 1. Price Updates
```json
{
  "type": "price_update",
  "symbol": "BTCUSDT",
  "interval": "15m",
  "price": 43250.75,
  "timestamp": 1700000000000
}
```

#### 2. Indicators Update
```json
{
  "type": "indicators_update",
  "symbol": "BTCUSDT",
  "interval": "15m",
  "indicators": {
    "RSIIndicator": 65.32,
    "MACDIndicator_histogram": 125.45,
    "BollingerBandsIndicator_upper": 44000.0,
    "SuperTrendIndicator": 42500.0,
    "..."
  },
  "currentCandle": [timestamp, open, high, low, close, volume],
  "klineLength": 201,
  "timestamp": 1700000000000
}
```

#### 3. Current Candle Response
```json
{
  "type": "current_candle",
  "symbol": "BTCUSDT",
  "interval": "15m",
  "candle": [1700000000000, 43200.0, 43300.0, 43100.0, 43250.0, 1250.5],
  "timestamp": 1700000000000
}
```

## Supported Intervals

- `1m` - 1 Minute
- `5m` - 5 Minutes
- `15m` - 15 Minutes
- `1h` - 1 Hour
- `4h` - 4 Hours
- `1d` - 1 Day

## Available Indicators

The system provides 40+ technical indicators including:

### Oscillators
- RSI (Relative Strength Index)
- Stochastic Oscillator
- Williams %R
- CCI (Commodity Channel Index)
- MFI (Money Flow Index)

### Trend Indicators
- MACD (Moving Average Convergence Divergence)
- ADX (Average Directional Index)
- SuperTrend
- Parabolic SAR
- Ichimoku Cloud

### Moving Averages
- EMA (Exponential Moving Average)
- SMA (Simple Moving Average)
- WMA (Weighted Moving Average)
- TEMA (Triple EMA)
- VWAP (Volume Weighted Average Price)

### Volatility
- Bollinger Bands
- ATR (Average True Range)
- Keltner Channels

### Volume
- OBV (On-Balance Volume)
- Volume Profile
- Volume Spike Detection

### Advanced
- Multi-Divergence Detection
- Support & Resistance
- Pattern Recognition
- Fibonacci Retracements

## Usage Examples

### JavaScript Client
```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

ws.onopen = () => {
    // Subscribe to BTCUSDT 15-minute indicators
    ws.send(JSON.stringify({
        type: 'subscribe_indicators',
        symbol: 'BTCUSDT',
        interval: '15m'
    }));
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    if (data.type === 'indicators_update') {
        console.log('RSI:', data.indicators.RSIIndicator);
        console.log('MACD Histogram:', data.indicators.MACDIndicator_histogram);
        console.log('Current Price:', data.currentCandle[4]); // Close price
    }
    
    if (data.type === 'price_update') {
        console.log('Live Price:', data.price);
    }
};
```

### React Hook Example
```javascript
import { useEffect, useState } from 'react';

function useIndicators(symbol = 'BTCUSDT', interval = '15m') {
    const [indicators, setIndicators] = useState({});
    const [price, setPrice] = useState(null);
    const [ws, setWs] = useState(null);

    useEffect(() => {
        const websocket = new WebSocket('ws://localhost:3000/ws');
        
        websocket.onopen = () => {
            websocket.send(JSON.stringify({
                type: 'subscribe_indicators',
                symbol,
                interval
            }));
        };
        
        websocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'indicators_update') {
                setIndicators(data.indicators);
            }
            
            if (data.type === 'price_update') {
                setPrice(data.price);
            }
        };
        
        setWs(websocket);
        
        return () => {
            websocket.close();
        };
    }, [symbol, interval]);

    return { indicators, price };
}
```

## Testing

Use the provided WebSocket tester at `bruno-collection/websocket-tester.html` to:

1. Connect to the WebSocket server
2. Subscribe to indicators for different symbols/intervals
3. View real-time indicator updates
4. Test candle data retrieval
5. Monitor price updates

## Performance Notes

- Each symbol/interval combination creates one `cryptoDogTradeBotAgent` instance
- Indicators update every 5 seconds for subscribed clients
- Price updates are sent immediately on every price tick
- Historical data is loaded automatically (201 candles for analysis)
- Agents are shared across multiple client subscriptions for efficiency

## Error Handling

The server handles various error conditions:

- Invalid symbol/interval combinations
- WebSocket connection failures
- Bybit API rate limiting
- Missing historical data

Errors are sent to clients as:
```json
{
  "type": "error",
  "error": "Error message description"
}
```
