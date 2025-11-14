# Crypto Dog API - Bruno Collection

This Bruno collection provides complete API documentation and testing capabilities for the Crypto Dog trading server.

## 📋 Collection Structure

### 1. Market Data
- **Get Intervals** - List available time intervals
- **Get Symbols** - Fetch trading pairs
- **Get Tickers** - Current price data
- **Get Candles** - OHLCV candlestick data
- **Get Order Book** - Current bids/asks

### 2. Indicators
- **Get Available Indicators** - List all technical indicators
- **Get Single Indicator** - Calculate one indicator (RSI, MACD, etc.)
- **Get Batch Indicators** - Calculate multiple indicators at once
- **Calculate All Indicators** - Process raw kline data with all indicators

### 3. Signals
- **Get All Signals** - Retrieve all trading signals
- **Get Active Signals** - Only active signals
- **Get Triggered Signals** - Signals that have fired
- **Get Signal by ID** - Fetch specific signal
- **Create Signal** - Add new trading signal
- **Update Signal** - Modify existing signal
- **Delete Signal** - Remove signal

### 4. Backtesting
- **Run Backtest** - Simulate trading strategy on historical data

### 5. Cache
- **Get Cache Stats** - View cache statistics
- **Clear Cache** - Clear cached data

## 🚀 Getting Started

### Prerequisites
1. Install [Bruno](https://www.usebruno.com/) API client
2. Start the Crypto Dog server:
   ```bash
   node server.js
   ```

### Import Collection
1. Open Bruno
2. Click "Open Collection"
3. Navigate to `/home/benjamin/develop/crypto-dog/bruno-collection`
4. Select the folder

### Environment Variables
The collection includes a "Local" environment with:
- `baseUrl`: http://localhost:3000
- `wsUrl`: ws://localhost:3000/ws
- `symbol`: BTCUSDT
- `category`: spot
- `interval`: 15

You can modify these in the Environment settings or create new environments (e.g., Production, Staging).

## 📊 Common Use Cases

### Fetch Market Data
1. Run **Get Intervals** to see available timeframes
2. Run **Get Symbols** to list trading pairs
3. Run **Get Candles** to fetch historical data

### Calculate Indicators
1. Run **Get Available Indicators** to see what's available
2. Use **Get Single Indicator** for one indicator (change URL path)
3. Use **Get Batch Indicators** for multiple indicators at once

### Create and Test a Strategy
1. Use **Create Signal** to define your signal
2. Run **Run Backtest** to test it historically
3. Check results and refine parameters

### Monitor Active Signals
1. Run **Get Active Signals** to see running signals
2. Use **Get Triggered Signals** to see which have fired
3. Update or delete signals as needed

## 🔧 WebSocket Connection

The server provides WebSocket support at `ws://localhost:3000/ws` for real-time market data.

### Quick Test

Open `websocket-tester.html` in your browser for a visual WebSocket testing tool!

Or use the browser console:

```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

ws.onopen = () => {
  console.log('✅ Connected!');
  
  // Subscribe to Bitcoin 15min candles
  ws.send(JSON.stringify({
    type: 'subscribe',
    topics: ['kline.15.BTCUSDT', 'tickers.BTCUSDT'],
    category: 'spot'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('📊 Received:', data);
};
```

### Available Topics

- **Kline/Candles**: `kline.{interval}.{symbol}` (e.g., `kline.15.BTCUSDT`)
- **Ticker**: `tickers.{symbol}` (e.g., `tickers.BTCUSDT`)
- **Trades**: `publicTrade.{symbol}` (e.g., `publicTrade.BTCUSDT`)
- **Order Book**: `orderbook.{depth}.{symbol}` (e.g., `orderbook.50.BTCUSDT`)

**📖 For complete WebSocket documentation, see [WEBSOCKET_GUIDE.md](./WEBSOCKET_GUIDE.md)**

## 📱 Expo/React Native Integration

When integrating with Expo:

### 1. Install Dependencies
```bash
npm install axios
```

### 2. API Service Example
```javascript
// services/cryptoDogApi.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000'; // Change for production

export const cryptoDogApi = {
  // Market Data
  getCandles: (symbol, interval, limit = 50) =>
    axios.get(`${API_BASE_URL}/api/candles`, {
      params: { symbol, interval, limit, category: 'spot' }
    }),

  // Indicators
  getBatchIndicators: (symbol, interval, indicators) =>
    axios.post(`${API_BASE_URL}/api/indicators/batch`, {
      symbol,
      interval,
      indicators,
      iterations: 5,
      candles: 200
    }),

  // Signals
  getActiveSignals: () =>
    axios.get(`${API_BASE_URL}/api/signals/active`),

  createSignal: (signal) =>
    axios.post(`${API_BASE_URL}/api/signals`, signal),

  // Backtest
  runBacktest: (config) =>
    axios.post(`${API_BASE_URL}/api/backtest`, config)
};
```

### 3. Component Example
```javascript
import { cryptoDogApi } from './services/cryptoDogApi';

export default function MarketScreen() {
  const [candles, setCandles] = useState([]);

  useEffect(() => {
    cryptoDogApi.getCandles('BTCUSDT', '15', 50)
      .then(response => setCandles(response.data))
      .catch(error => console.error(error));
  }, []);

  return (
    <View>
      {/* Render your candles */}
    </View>
  );
}
```

## 🎯 Available Indicators

### Oscillators & Momentum
- **rsi** - Relative Strength Index
- **macd** - Moving Average Convergence Divergence
- **stochastic** - Stochastic Oscillator
- **williamsr** - Williams %R
- **cci** - Commodity Channel Index
- **mfi** - Money Flow Index
- **ksi** - KSI Indicator
- **awesomeoscillator** - Awesome Oscillator
- **roc** - Rate of Change

### Trend Indicators
- **supertrend** - SuperTrend
- **adx** - Average Directional Index
- **ichimoku** - Ichimoku Cloud
- **psar** - Parabolic SAR

### Moving Averages
- **ema** - Exponential Moving Average
- **sma** - Simple Moving Average
- **wma** - Weighted Moving Average
- **zema** - Zero-Lag EMA
- **ema3** - Triple EMA
- **ema4** - Quad EMA
- **ema10and20** - EMA 10 & 20
- **sma3** - Triple SMA
- **emamulti** - Multi-Period EMA (20, 50, 200)
- **smamulti** - Multi-Period SMA (20, 50, 200)
- **wilderswma** - Wilder's Weighted Moving Average

### Volatility
- **bollinger** - Bollinger Bands
- **atr** - Average True Range

### Volume Indicators
- **obv** - On-Balance Volume
- **adl** - Accumulation/Distribution Line
- **volumeprofile** - Volume Profile
- **vwap** - Volume Weighted Average Price
- **forceindex** - Force Index

### Support/Resistance & Patterns
- **floorpivots** - Floor Pivot Points
- **woodies** - Woodies Pivot Points
- **supportandresistance** - Support & Resistance Levels
- **patternrecognition** - Candlestick Pattern Recognition

### Advanced Indicators
- **multidivergence** - Multi-Divergence Detector
- **dynamicgridsignals** - Dynamic Grid Signals
- **trix** - TRIX (Triple Exponential Average)
- **zscore** - Z-Score Statistical Analysis

## 📝 Notes

- All endpoints use JSON format
- CORS is enabled for development
- Default port is 3000 (configurable via PORT env variable)
- Cache can be cleared to force fresh data
- Backtesting uses real historical data

## 🐛 Troubleshooting

### Connection Refused
Make sure the server is running:
```bash
node server.js
```

### Invalid Data
Check that you're using valid symbols and intervals with **Get Symbols** and **Get Intervals**.

### Backtest Errors
Ensure you have enough historical data (minimum candles requirement varies by indicator).

## 📖 Further Reading

- Server source: `/home/benjamin/develop/crypto-dog/server.js`
- CLI commands: `/home/benjamin/develop/crypto-dog/crypto-dog-cli.js`
- Indicator implementations: `/home/benjamin/develop/crypto-dog/core/indicator/impl/`

---

**Happy Trading! 🐕🚀**
