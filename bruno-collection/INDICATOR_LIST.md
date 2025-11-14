# Complete Indicator List

This document lists all 40 technical indicators available in the Crypto Dog API.

## Quick Reference

### API Endpoint
```
GET /api/indicator/:name
POST /api/indicators/batch
```

## Indicators by Category

### 📊 Oscillators & Momentum (9)
| Indicator | ID | Description |
|-----------|----|----|
| RSI | `rsi` | Relative Strength Index - Measures overbought/oversold conditions |
| MACD | `macd` | Moving Average Convergence Divergence - Trend following momentum |
| Stochastic | `stochastic` | Stochastic Oscillator - Compares closing price to price range |
| Williams %R | `williamsr` | Williams Percent Range - Momentum indicator |
| CCI | `cci` | Commodity Channel Index - Identifies cyclical trends |
| MFI | `mfi` | Money Flow Index - Volume-weighted RSI |
| KSI | `ksi` | KSI Indicator - Custom momentum indicator |
| Awesome Oscillator | `awesomeoscillator` | Bill Williams' momentum indicator |
| ROC | `roc` | Rate of Change - Momentum oscillator |

### 📈 Trend Indicators (4)
| Indicator | ID | Description |
|-----------|----|----|
| SuperTrend | `supertrend` | Volatility-based trend indicator |
| ADX | `adx` | Average Directional Index - Trend strength |
| Ichimoku Cloud | `ichimoku` | Comprehensive trend system |
| Parabolic SAR | `psar` | Stop and Reverse - Trend direction & reversal points |

### 📉 Moving Averages (11)
| Indicator | ID | Description |
|-----------|----|----|
| EMA | `ema` | Exponential Moving Average (default: 20) |
| SMA | `sma` | Simple Moving Average (default: 20) |
| WMA | `wma` | Weighted Moving Average |
| ZEMA | `zema` | Zero-Lag Exponential Moving Average |
| EMA3 | `ema3` | Triple EMA system |
| EMA4 | `ema4` | Quad EMA system |
| EMA 10/20 | `ema10and20` | Common EMA pair |
| SMA3 | `sma3` | Triple SMA system |
| EMA Multi | `emamulti` | Multi-Period EMA (20, 50, 200) |
| SMA Multi | `smamulti` | Multi-Period SMA (20, 50, 200) |
| Wilder's WMA | `wilderswma` | Wilder's Weighted Moving Average |

### 💥 Volatility (2)
| Indicator | ID | Description |
|-----------|----|----|
| Bollinger Bands | `bollinger` | Price envelope indicator |
| ATR | `atr` | Average True Range - Volatility measurement |

### 📦 Volume Indicators (5)
| Indicator | ID | Description |
|-----------|----|----|
| OBV | `obv` | On-Balance Volume - Cumulative volume |
| ADL | `adl` | Accumulation/Distribution Line |
| Volume Profile | `volumeprofile` | Price levels by volume |
| VWAP | `vwap` | Volume Weighted Average Price |
| Force Index | `forceindex` | Volume-weighted price change |

### 🎯 Support/Resistance & Patterns (4)
| Indicator | ID | Description |
|-----------|----|----|
| Floor Pivots | `floorpivots` | Standard pivot points |
| Woodies Pivots | `woodies` | Woodies pivot point system |
| Support & Resistance | `supportandresistance` | Automatic S/R levels |
| Pattern Recognition | `patternrecognition` | Candlestick patterns |

### 🚀 Advanced Indicators (5)
| Indicator | ID | Description |
|-----------|----|----|
| Multi-Divergence | `multidivergence` | Detects bullish/bearish divergences |
| Dynamic Grid Signals | `dynamicgridsignals` | Grid trading signals |
| TRIX | `trix` | Triple Exponential Average |
| Z-Score | `zscore` | Statistical analysis indicator |

## Usage Examples

### Single Indicator
```bash
# Get RSI for BTC 15-min chart
GET /api/indicator/rsi?symbol=BTCUSDT&interval=15&iterations=5&candles=200
```

### Batch Request (Multiple Indicators)
```bash
POST /api/indicators/batch
{
  "symbol": "BTCUSDT",
  "interval": "15",
  "indicators": ["rsi", "macd", "bollinger", "ema", "adx"]
}
```

### All Indicators for Chart
```javascript
// Expo/React Native Example
const indicators = [
  'rsi', 'macd', 'stochastic', 'adx', 'bollinger',
  'ema', 'sma', 'obv', 'vwap', 'ichimoku'
];

const response = await axios.post('/api/indicators/batch', {
  symbol: 'BTCUSDT',
  interval: '15',
  indicators
});
```

## Response Format

All indicators return a consistent format:

```json
{
  "symbol": "BTCUSDT",
  "interval": "15",
  "type": "RSI",
  "currentValue": 65.43,
  "history": [50.2, 52.1, 55.3, ..., 65.43],
  "signal": "no-signal"
}
```

### Multi-Value Indicators

Some indicators return objects with multiple values:

**Bollinger Bands:**
```json
{
  "currentValue": {
    "upper": 42500,
    "middle": 42000,
    "lower": 41500,
    "pb": 0.65
  }
}
```

**MACD:**
```json
{
  "currentValue": {
    "MACD": 125.5,
    "signal": 120.3,
    "histogram": 5.2
  }
}
```

**Ichimoku:**
```json
{
  "currentValue": {
    "tenkan": 42100,
    "kijun": 42000,
    "senkouA": 42050,
    "senkouB": 41900,
    "chikou": 42200
  }
}
```

## Performance Tips

1. **Use Batch Requests** - Calculate multiple indicators in one call
2. **Cache Results** - Server caches data automatically
3. **Optimal Candles** - 200 candles is recommended for most indicators
4. **Iterations** - 5 iterations provides good balance between speed and data

## Notes

- All indicators use the same parameter structure
- Cache is automatically managed for performance
- WebSocket support available for real-time updates
- Default values: `category=spot`, `symbol=BTCUSDT`, `interval=15`, `iterations=5`, `candles=200`

---

**Total Indicators:** 40  
**Last Updated:** November 14, 2025
