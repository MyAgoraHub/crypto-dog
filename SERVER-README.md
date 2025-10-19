# 🐕 Crypto Dog - Full Stack Setup

## Quick Start

### 1. Start the Backend Server

```bash
# From /home/benjamin/develop/crypto-dog
npm run server
```

The server will start on `http://localhost:3000` with:
- **HTTP API**: REST endpoints for tickers, candles, indicators
- **WebSocket**: Real-time market data at `ws://localhost:3000/ws`

### 2. Start the Frontend Portal

```bash
# From /home/benjamin/develop/crypto-dog/portal
npm run dev
```

The portal will start on `http://localhost:5173` (or another port if 5173 is busy)

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────┐
│  Vue 3 Portal   │ ◄─────► │  Express Server  │ ◄─────► │   Bybit API │
│  (Frontend)     │  HTTP   │   (Backend)      │  API    │             │
│  Port 5173      │   WS    │   Port 3000      │  Calls  │             │
└─────────────────┘         └──────────────────┘         └─────────────┘
```

## API Endpoints

### Health Check
```bash
GET http://localhost:3000/health
```

### Get Ticker Data
```bash
GET http://localhost:3000/api/ticker?category=spot&symbol=BTCUSDT
```

### Get Candle Data
```bash
GET http://localhost:3000/api/candles?category=spot&symbol=BTCUSDT&interval=15&limit=50
```

### Get Indicator Data
```bash
GET http://localhost:3000/api/indicator/rsi?category=spot&symbol=BTCUSDT&interval=15&iterations=5&candles=200
```

**Available Indicators:**
- `rsi` - Relative Strength Index
- `supertrend` - SuperTrend
- `sma` - Simple Moving Average
- `ema` - Exponential Moving Average
- `macd` - MACD
- `bollinger` - Bollinger Bands
- `atr` - Average True Range
- `stochastic` - Stochastic Oscillator
- `williamsr` - Williams %R
- `cci` - Commodity Channel Index
- `adx` - Average Directional Index
- `ichimoku` - Ichimoku Cloud

### Get Multiple Indicators (Batch)
```bash
POST http://localhost:3000/api/indicators/batch
Content-Type: application/json

{
  "indicators": ["rsi", "macd", "supertrend"],
  "category": "spot",
  "symbol": "BTCUSDT",
  "interval": "15",
  "iterations": 5,
  "candles": 200
}
```

### Cache Management
```bash
# Get cache statistics
GET http://localhost:3000/api/cache/stats

# Clear all cache
DELETE http://localhost:3000/api/cache

# Clear specific cache
DELETE http://localhost:3000/api/cache?category=spot&symbol=BTCUSDT&interval=15
```

## WebSocket Usage

### Connect to WebSocket
```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

ws.onopen = () => {
  console.log('Connected');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};
```

### Subscribe to Topics
```javascript
// Subscribe to ticker updates
ws.send(JSON.stringify({
  type: 'subscribe',
  topics: ['tickers.BTCUSDT'],
  category: 'spot'
}));

// Subscribe to order book
ws.send(JSON.stringify({
  type: 'subscribe',
  topics: ['orderbook.50.BTCUSDT'],
  category: 'spot'
}));

// Subscribe to kline/candles
ws.send(JSON.stringify({
  type: 'subscribe',
  topics: ['kline.15.BTCUSDT'],
  category: 'spot'
}));
```

### Message Types

**Connected:**
```json
{
  "type": "connected",
  "clientId": "1234567890",
  "message": "Connected to Crypto Dog WebSocket server"
}
```

**Subscribed:**
```json
{
  "type": "subscribed",
  "topics": ["tickers.BTCUSDT"],
  "category": "spot"
}
```

**Update:**
```json
{
  "type": "update",
  "data": {
    "topic": "tickers.BTCUSDT",
    "data": { /* Bybit market data */ }
  }
}
```

**Error:**
```json
{
  "type": "error",
  "error": "Error message"
}
```

## Development

### Backend Development
```bash
cd /home/benjamin/develop/crypto-dog
npm run dev
```

### Frontend Development
```bash
cd /home/benjamin/develop/crypto-dog/portal
npm run dev
```

### CLI Tools
```bash
# Use the CLI directly
npm run cli -- intervals
npm run cli -- tickers -c spot -s BTCUSDT
npm run cli -- candles -c spot -s BTCUSDT -i 15 -l 50
```

## Features

### ✅ Backend Features
- Real-time WebSocket connections
- Smart caching with auto-preload
- 12+ technical indicators
- Order book depth
- Historical candle data
- Batch indicator requests
- Cache management

### ✅ Frontend Features (Portal)
- Live ticker displays
- Interactive charts
- Symbol autocomplete
- Multiple indicators
- Order book visualization
- Real-time WebSocket updates
- Responsive dashboard

## Environment Variables

Create `.env` file in the backend root:
```env
PORT=3000
BYBIT_API_KEY=your_api_key_here
BYBIT_API_SECRET=your_api_secret_here
```

Create `.env` file in the portal:
```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000/ws
```

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or change port
PORT=3001 npm run server
```

### WebSocket Not Connecting
1. Check backend server is running
2. Check console for errors
3. Verify WebSocket URL in portal `.env`

### Cache Issues
```bash
# Clear cache via API
curl -X DELETE http://localhost:3000/api/cache
```

## Production Build

### Backend
```bash
# Already production-ready, just run:
node server.js
```

### Frontend
```bash
cd portal
npm run build
# Serve with any static file server or integrate with backend
```

## Support

For issues or questions, check the logs:
- Backend: Terminal running `npm run server`
- Frontend: Browser console (F12)
- WebSocket: Use browser DevTools > Network > WS
