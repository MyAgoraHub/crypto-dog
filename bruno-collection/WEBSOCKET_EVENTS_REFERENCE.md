# 📡 WebSocket Events Reference - Complete Payload Documentation

This document provides complete WebSocket event payloads for Android app integration and agent development.

## Connection Events

### Client Connection Established
```json
{
  "type": "connected",
  "clientId": "1700000000000",
  "message": "Connected to Crypto Dog WebSocket server"
}
```

## Indicators WebSocket Events

### 1. Subscribe to Indicators Request (Client → Server)
```json
{
  "type": "subscribe_indicators",
  "symbol": "BTCUSDT",
  "interval": "15m"
}
```

### 2. Subscribe Confirmation (Server → Client)
```json
{
  "type": "indicators_subscribed",
  "symbol": "BTCUSDT",
  "interval": "15m",
  "agentKey": "BTCUSDT_15m"
}
```

### 3. Initial Indicators Data (Server → Client)
```json
{
  "type": "indicators_initial",
  "symbol": "BTCUSDT",
  "interval": "15m",
  "indicators": {
    "RSIIndicator": 65.23456789,
    "MACDIndicator_histogram": 125.45123456,
    "MACDIndicator_macd": 89.12345678,
    "MACDIndicator_signal": 78.98765432,
    "BollingerBandsIndicator_upper": 44250.123456,
    "BollingerBandsIndicator_middle": 43500.654321,
    "BollingerBandsIndicator_lower": 42750.987654,
    "SuperTrendIndicator": 42800.123456,
    "EMAIndicator": 43125.456789,
    "SMAIndicator": 43200.789012,
    "ATRIndicator": 1250.123456,
    "StochasticOscillator_k": 75.123456,
    "StochasticOscillator_d": 72.654321,
    "WilliamsRIndicator": -25.123456,
    "CCIIndicator": 150.987654,
    "ADXIndicator_adx": 45.123456,
    "ADXIndicator_plusDI": 25.654321,
    "ADXIndicator_minusDI": 15.987654,
    "MFIIndicator": 55.123456,
    "IchimokuIndicator_tenkanSen": 43100.123456,
    "IchimokuIndicator_kijunSen": 43200.654321,
    "IchimokuIndicator_senkouSpanA": 43150.987654,
    "IchimokuIndicator_senkouSpanB": 43250.123456,
    "IchimokuIndicator_chikouSpan": 43050.654321,
    "OBVIndicator": 1250000.123456,
    "VWAPIndicator": 43175.456789,
    "PSARIndicator": 42950.123456,
    "ZScoreIndicator": 1.234567,
    "VolumeProfileIndicator": 15250.123456,
    "FloorPivotsIndicator_pivot": 43200.123456,
    "FloorPivotsIndicator_r1": 43400.654321,
    "FloorPivotsIndicator_r2": 43600.987654,
    "FloorPivotsIndicator_s1": 43000.123456,
    "FloorPivotsIndicator_s2": 42800.654321,
    "WoodiesIndicator": 43150.987654,
    "DynamicGridSignals": 2.5,
    "AwesomeOscillator": 125.456789,
    "ForceIndexIndicator": 8950.123456,
    "ROCIndicator": 0.025,
    "TRIXIndicator": 0.00125,
    "ZEMAIndicator": 43180.123456,
    "PatternRecognitionIndicator": "BULLISH_ENGULFING",
    "MultiDivergenceDetector_bullish": true,
    "MultiDivergenceDetector_bearish": false,
    "MultiDivergenceDetector_strength": 0.75
  },
  "currentCandle": [1700000000000, 43200.5, 43350.2, 43100.8, 43275.1, 1245.789],
  "klineLength": 201,
  "timestamp": 1700000000000
}
```

### 4. Real-time Price Updates (Server → Client)
```json
{
  "type": "price_update",
  "symbol": "BTCUSDT",
  "interval": "15m",
  "price": 43280.75,
  "timestamp": 1700000001000
}
```

### 5. Periodic Indicators Updates (Server → Client)
*Sent every 5 seconds*
```json
{
  "type": "indicators_update",
  "symbol": "BTCUSDT",
  "interval": "15m",
  "indicators": {
    "RSIIndicator": 66.12345678,
    "MACDIndicator_histogram": 128.76543210,
    "MACDIndicator_macd": 90.23456789,
    "MACDIndicator_signal": 79.12345678,
    "BollingerBandsIndicator_upper": 44275.987654,
    "BollingerBandsIndicator_middle": 43525.123456,
    "BollingerBandsIndicator_lower": 42775.654321,
    "SuperTrendIndicator": 42825.987654,
    "EMAIndicator": 43150.123456,
    "SMAIndicator": 43225.654321,
    "ATRIndicator": 1255.987654,
    "StochasticOscillator_k": 76.987654,
    "StochasticOscillator_d": 73.123456,
    "WilliamsRIndicator": -23.654321,
    "CCIIndicator": 155.123456,
    "ADXIndicator_adx": 46.987654,
    "ADXIndicator_plusDI": 26.123456,
    "ADXIndicator_minusDI": 14.654321,
    "MFIIndicator": 57.987654,
    "IchimokuIndicator_tenkanSen": 43125.654321,
    "IchimokuIndicator_kijunSen": 43225.123456,
    "IchimokuIndicator_senkouSpanA": 43175.987654,
    "IchimokuIndicator_senkouSpanB": 43275.654321,
    "IchimokuIndicator_chikouSpan": 43075.123456,
    "OBVIndicator": 1252500.987654,
    "VWAPIndicator": 43200.123456,
    "PSARIndicator": 42975.654321,
    "ZScoreIndicator": 1.345678,
    "VolumeProfileIndicator": 15275.987654,
    "FloorPivotsIndicator_pivot": 43225.654321,
    "FloorPivotsIndicator_r1": 43425.123456,
    "FloorPivotsIndicator_r2": 43625.987654,
    "FloorPivotsIndicator_s1": 43025.654321,
    "FloorPivotsIndicator_s2": 42825.123456,
    "WoodiesIndicator": 43175.654321,
    "DynamicGridSignals": 2.7,
    "AwesomeOscillator": 128.987654,
    "ForceIndexIndicator": 9125.654321,
    "ROCIndicator": 0.028,
    "TRIXIndicator": 0.00135,
    "ZEMAIndicator": 43205.987654,
    "PatternRecognitionIndicator": "DOJI",
    "MultiDivergenceDetector_bullish": true,
    "MultiDivergenceDetector_bearish": false,
    "MultiDivergenceDetector_strength": 0.82
  },
  "currentCandle": [1700000300000, 43275.1, 43375.8, 43200.2, 43320.5, 1289.456],
  "klineLength": 201,
  "timestamp": 1700000300000
}
```

### 6. Get Current Candle Request (Client → Server)
```json
{
  "type": "get_current_candle",
  "symbol": "BTCUSDT",
  "interval": "15m"
}
```

### 7. Current Candle Response (Server → Client)
```json
{
  "type": "current_candle",
  "symbol": "BTCUSDT",
  "interval": "15m",
  "candle": [1700000600000, 43320.5, 43420.2, 43250.8, 43380.1, 1356.789],
  "timestamp": 1700000600000
}
```

### 8. Get Indicators Snapshot Request (Client → Server)
```json
{
  "type": "get_indicators",
  "symbol": "BTCUSDT",
  "interval": "15m"
}
```

### 9. Indicators Snapshot Response (Server → Client)
```json
{
  "type": "indicators_snapshot",
  "symbol": "BTCUSDT",
  "interval": "15m",
  "indicators": {
    "RSIIndicator": 67.98765432,
    "MACDIndicator_histogram": 132.12345678,
    "MACDIndicator_macd": 92.87654321,
    "MACDIndicator_signal": 80.65432109,
    "BollingerBandsIndicator_upper": 44300.123456,
    "BollingerBandsIndicator_middle": 43550.987654,
    "BollingerBandsIndicator_lower": 42800.654321,
    "SuperTrendIndicator": 42850.123456,
    "EMAIndicator": 43175.987654,
    "SMAIndicator": 43250.123456,
    "ATRIndicator": 1260.654321,
    "StochasticOscillator_k": 78.654321,
    "StochasticOscillator_d": 74.987654,
    "WilliamsRIndicator": -21.123456,
    "CCIIndicator": 160.987654,
    "ADXIndicator_adx": 48.654321,
    "ADXIndicator_plusDI": 27.987654,
    "ADXIndicator_minusDI": 13.123456,
    "MFIIndicator": 60.654321,
    "IchimokuIndicator_tenkanSen": 43150.987654,
    "IchimokuIndicator_kijunSen": 43250.654321,
    "IchimokuIndicator_senkouSpanA": 43200.123456,
    "IchimokuIndicator_senkouSpanB": 43300.987654,
    "IchimokuIndicator_chikouSpan": 43100.654321,
    "OBVIndicator": 1255000.654321,
    "VWAPIndicator": 43225.987654,
    "PSARIndicator": 43000.123456,
    "ZScoreIndicator": 1.456789,
    "VolumeProfileIndicator": 15300.654321,
    "FloorPivotsIndicator_pivot": 43250.987654,
    "FloorPivotsIndicator_r1": 43450.654321,
    "FloorPivotsIndicator_r2": 43650.123456,
    "FloorPivotsIndicator_s1": 43050.987654,
    "FloorPivotsIndicator_s2": 42850.654321,
    "WoodiesIndicator": 43200.123456,
    "DynamicGridSignals": 2.9,
    "AwesomeOscillator": 132.654321,
    "ForceIndexIndicator": 9300.987654,
    "ROCIndicator": 0.031,
    "TRIXIndicator": 0.00145,
    "ZEMAIndicator": 43230.654321,
    "PatternRecognitionIndicator": "HAMMER",
    "MultiDivergenceDetector_bullish": false,
    "MultiDivergenceDetector_bearish": true,
    "MultiDivergenceDetector_strength": 0.68
  },
  "klineLength": 201,
  "timestamp": 1700000900000
}
```

### 10. Unsubscribe Request (Client → Server)
```json
{
  "type": "unsubscribe_indicators",
  "symbol": "BTCUSDT",
  "interval": "15m"
}
```

### 11. Unsubscribe Confirmation (Server → Client)
```json
{
  "type": "indicators_unsubscribed",
  "symbol": "BTCUSDT",
  "interval": "15m",
  "agentKey": "BTCUSDT_15m"
}
```

## Bybit WebSocket Proxy Events

### Subscribe to Bybit Topics (Client → Server)
```json
{
  "type": "subscribe",
  "topics": [
    "tickers.BTCUSDT",
    "kline.15.BTCUSDT",
    "publicTrade.BTCUSDT",
    "orderbook.25.BTCUSDT"
  ],
  "category": "spot"
}
```

### Bybit Data Updates (Server → Client)
```json
{
  "type": "update",
  "data": {
    "topic": "kline.15.BTCUSDT",
    "type": "snapshot",
    "ts": 1700000000000,
    "data": [
      {
        "start": 1700000000000,
        "end": 1700000900000,
        "interval": "15",
        "open": "43200.5",
        "close": "43380.1",
        "high": "43420.2",
        "low": "43180.8",
        "volume": "1356.789",
        "turnover": "58756234.567",
        "confirm": false,
        "timestamp": 1700000000000
      }
    ]
  }
}
```

## Error Events

### Connection Errors
```json
{
  "type": "error",
  "error": "WebSocket connection failed",
  "timestamp": 1700000000000
}
```

### Invalid Symbol/Interval Errors
```json
{
  "type": "error",
  "error": "No agent or data available for the requested symbol/interval",
  "timestamp": 1700000000000
}
```

### Bybit API Errors
```json
{
  "type": "error",
  "error": "Bybit API rate limit exceeded",
  "timestamp": 1700000000000
}
```

## Candle Data Format

### Candle Array Structure
```javascript
[timestamp, open, high, low, close, volume]
```

### Example
```json
[1700000000000, 43200.5, 43420.2, 43180.8, 43380.1, 1356.789]
```

Where:
- `timestamp`: Unix timestamp in milliseconds
- `open`: Opening price (number)
- `high`: Highest price (number) 
- `low`: Lowest price (number)
- `close`: Closing price (number)
- `volume`: Trading volume (number)

## Complete Indicator Categories

### Oscillators
- `RSIIndicator`: Relative Strength Index (0-100)
- `StochasticOscillator_k`: %K line (0-100)
- `StochasticOscillator_d`: %D line (0-100)
- `WilliamsRIndicator`: Williams %R (-100 to 0)
- `CCIIndicator`: Commodity Channel Index
- `MFIIndicator`: Money Flow Index (0-100)
- `AwesomeOscillator`: Awesome Oscillator

### Trend Indicators
- `MACDIndicator_histogram`: MACD Histogram
- `MACDIndicator_macd`: MACD Line
- `MACDIndicator_signal`: Signal Line
- `ADXIndicator_adx`: Average Directional Index
- `ADXIndicator_plusDI`: +DI
- `ADXIndicator_minusDI`: -DI
- `SuperTrendIndicator`: SuperTrend value
- `PSARIndicator`: Parabolic SAR

### Moving Averages
- `EMAIndicator`: Exponential Moving Average
- `SMAIndicator`: Simple Moving Average
- `VWAPIndicator`: Volume Weighted Average Price
- `ZEMAIndicator`: Zero Lag EMA

### Volatility
- `BollingerBandsIndicator_upper`: Upper Bollinger Band
- `BollingerBandsIndicator_middle`: Middle Bollinger Band
- `BollingerBandsIndicator_lower`: Lower Bollinger Band
- `ATRIndicator`: Average True Range

### Volume
- `OBVIndicator`: On-Balance Volume
- `VolumeProfileIndicator`: Volume Profile
- `ForceIndexIndicator`: Force Index

### Advanced
- `IchimokuIndicator_*`: Ichimoku Cloud components
- `FloorPivotsIndicator_*`: Pivot points and support/resistance
- `MultiDivergenceDetector_*`: Divergence detection
- `PatternRecognitionIndicator`: Candlestick patterns
- `ZScoreIndicator`: Z-Score normalization
- `ROCIndicator`: Rate of Change
- `TRIXIndicator`: TRIX oscillator
- `WoodiesIndicator`: Woodies CCI
- `DynamicGridSignals`: Dynamic grid signals

## Android Integration Example

### Kotlin WebSocket Client
```kotlin
class CryptoDogWebSocketClient {
    private var webSocket: WebSocket? = null
    
    fun connect(url: String = "ws://localhost:3000/ws") {
        val request = Request.Builder().url(url).build()
        webSocket = OkHttpClient().newWebSocket(request, object : WebSocketListener() {
            override fun onMessage(webSocket: WebSocket, text: String) {
                val event = Gson().fromJson(text, WebSocketEvent::class.java)
                handleEvent(event)
            }
        })
    }
    
    fun subscribeToIndicators(symbol: String = "BTCUSDT", interval: String = "15m") {
        val message = mapOf(
            "type" to "subscribe_indicators",
            "symbol" to symbol,
            "interval" to interval
        )
        webSocket?.send(Gson().toJson(message))
    }
    
    private fun handleEvent(event: WebSocketEvent) {
        when (event.type) {
            "price_update" -> handlePriceUpdate(event)
            "indicators_update" -> handleIndicatorsUpdate(event)
            "current_candle" -> handleCurrentCandle(event)
            // ... handle other events
        }
    }
}
```

## React Native Integration Example

### JavaScript WebSocket Hook
```javascript
import { useEffect, useState } from 'react';

export function useCryptoDogWebSocket(symbol = 'BTCUSDT', interval = '15m') {
    const [indicators, setIndicators] = useState({});
    const [price, setPrice] = useState(null);
    const [currentCandle, setCurrentCandle] = useState(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:3000/ws');
        
        ws.onopen = () => {
            setConnected(true);
            ws.send(JSON.stringify({
                type: 'subscribe_indicators',
                symbol,
                interval
            }));
        };
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
                case 'price_update':
                    setPrice(data.price);
                    break;
                case 'indicators_update':
                case 'indicators_initial':
                case 'indicators_snapshot':
                    setIndicators(data.indicators);
                    setCurrentCandle(data.currentCandle);
                    break;
                case 'current_candle':
                    setCurrentCandle(data.candle);
                    break;
            }
        };
        
        ws.onclose = () => setConnected(false);
        
        return () => ws.close();
    }, [symbol, interval]);

    return { indicators, price, currentCandle, connected };
}
```

## Testing Commands

### Connect and Test
```bash
# Start servers
node server.js
python3 -m http.server 8080 # In bruno-collection directory

# Open WebSocket tester
# Navigate to: http://localhost:8080/websocket-tester.html
```

### Direct WebSocket Testing with wscat
```bash
# Install wscat
npm install -g wscat

# Connect to server
wscat -c ws://localhost:3000/ws

# Send subscription
{"type":"subscribe_indicators","symbol":"BTCUSDT","interval":"15m"}

# Send current candle request  
{"type":"get_current_candle","symbol":"BTCUSDT","interval":"15m"}

# Send indicators snapshot request
{"type":"get_indicators","symbol":"BTCUSDT","interval":"15m"}
```
