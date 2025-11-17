# 🎯 Enhanced Backtest API - Signal Mapping Guide

## Overview

The backtest API has been enhanced to support seamless signal mapping, eliminating the need to manually provide both `signalType` and `indicator` fields. You can now use a single `signalKey` that automatically maps to the correct signal configuration.

## New Endpoints

### 1. Get All Signal Types
```http
GET /api/signal-types
```

Returns all available signal types with their metadata:

```json
{
  "total": 70,
  "categories": ["oscillator", "trend", "price-action", "momentum", "volatility", "volume"],
  "signals": [
    {
      "key": "rsi-os",
      "name": "RSI Oversold (Long)",
      "description": "Enter LONG when RSI < value",
      "category": "oscillator",
      "direction": "long",
      "defaultValue": 30,
      "valueType": "number"
    },
    // ... more signals
  ],
  "grouped": {
    "oscillator": [...],
    "trend": [...],
    // ... grouped by category
  }
}
```

### 2. Get Signal Type Details
```http
GET /api/signal-types/{signalKey}
```

Returns detailed information about a specific signal including the auto-mapped values:

```json
{
  "key": "rsi-os",
  "name": "RSI Oversold (Long)",
  "description": "Enter LONG when RSI < value",
  "category": "oscillator",
  "direction": "long",
  "defaultValue": 30,
  "valueType": "number",
  "signalType": "INDICATOR_RsiOsSignal",
  "indicator": "RsiIndicator",
  "evaluateFunction": "signalAgent.os"
}
```

## Enhanced Backtest Endpoint

### New Format (Recommended)
```http
POST /api/backtest
Content-Type: application/json

{
  "signalKey": "rsi-os",
  "symbol": "BTCUSDT",
  "timeframe": "15",
  "iterations": 10,
  "candles": 200,
  "risk": 2,
  "reward": 5,
  "capital": 10000,
  "value": 25  // Optional: override default value
}
```

### Legacy Format (Still Supported)
```http
POST /api/backtest
Content-Type: application/json

{
  "signalType": "INDICATOR_RsiOsSignal",
  "indicator": "RsiIndicator",
  "value": 30,
  "symbol": "BTCUSDT",
  "timeframe": "15",
  "iterations": 10,
  "candles": 200,
  "risk": 2,
  "reward": 5,
  "capital": 10000
}
```

## Available Signal Keys

### Oscillator Signals
- `rsi-os` - RSI Oversold (Long)
- `rsi-ob` - RSI Overbought (Short)
- `stochastic-oversold` - Stochastic < 20
- `stochastic-overbought` - Stochastic > 80
- `williams-oversold` - Williams %R < -80
- `williams-overbought` - Williams %R > -20
- `mfi-oversold` - Money Flow Index < 20
- `mfi-overbought` - Money Flow Index > 80
- `cci-oversold` - CCI < -100
- `cci-overbought` - CCI > 100

### Trend Signals
- `supertrend-long` - SuperTrend Long
- `supertrend-short` - SuperTrend Short
- `uptrend` - General Uptrend
- `downtrend` - General Downtrend
- `golden-cross` - Fast MA > Slow MA
- `death-cross` - Fast MA < Slow MA
- `ma-support` - Price finds support at MA
- `ma-resistance` - Price hits resistance at MA

### Price Action Signals
- `price-gt` - Price Above Level
- `price-lt` - Price Below Level
- `price-gte` - Price At/Above Level
- `price-lte` - Price At/Below Level
- `price-eq` - Price Equals Level

### Momentum Signals
- `macd-bullish` - MACD Bullish Cross
- `macd-bearish` - MACD Bearish Cross
- `macd-histogram-positive` - MACD Histogram > 0
- `macd-histogram-negative` - MACD Histogram < 0

### Volatility Signals
- `bollinger-upper-touch` - Price touches upper band
- `bollinger-lower-touch` - Price touches lower band
- `bollinger-squeeze` - Bands are squeezing
- `bollinger-expansion` - Bands are expanding
- `atr-high-volatility` - ATR above average

### Volume Signals
- `volume-spike` - Volume spike detection
- `obv-bullish` - On Balance Volume trending up
- `obv-bearish` - On Balance Volume trending down

### Advanced Signals
- `ichimoku-bullish` - Ichimoku bullish setup
- `ichimoku-bearish` - Ichimoku bearish setup
- `adx-strong-trend` - ADX > 25
- `adx-weak-trend` - ADX < 20
- `fibonacci-retracement` - Fibonacci levels
- `support-breakout` - Support breakout
- `resistance-breakout` - Resistance breakout

## Response Format

Both the new and legacy formats return the same enhanced response:

```json
{
  "success": true,
  "signal": {
    "symbol": "BTCUSDT",
    "timeframe": "15",
    "signalType": "INDICATOR_RsiOsSignal",
    "indicator": "RsiIndicator",
    "value": 30,
    "evaluate": "signalAgent.os",
    "indicatorArgs": {},
    "key": "rsi-os",        // Only present when using signalKey
    "mappedFrom": "signalKey" // "signalKey" or "legacy"
  },
  "results": {
    "signal": {
      "symbol": "BTCUSDT",
      "type": "RSI Oversold Signal"
    },
    "performance": {
      "initialCapital": "10000.00",
      "finalCapital": "12500.00",
      "netProfit": "2500.00",
      "returnPercent": "25.00",
      "maxDrawdown": "5.50"
    },
    "trades": {
      "total": 25,
      "wins": 15,
      "losses": 10,
      "winRate": "60.00",
      "avgWin": "300.00",
      "avgLoss": "150.00",
      "profitFactor": "2.00"
    },
    "period": {
      "start": "2023-01-01T00:00:00Z",
      "end": "2023-12-31T23:59:59Z",
      "candles": 2000
    }
  }
}
```

## Benefits of New Format

### 1. **Simplified API Calls**
```javascript
// OLD WAY - Required mapping knowledge
const response = await fetch('/api/backtest', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    signalType: 'INDICATOR_RsiOsSignal',  // Had to know this
    indicator: 'RsiIndicator',            // Had to know this
    value: 30                             // Had to know default
  })
});

// NEW WAY - Just use the signal key
const response = await fetch('/api/backtest', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    signalKey: 'rsi-os'  // That's it!
  })
});
```

### 2. **Auto Default Values**
Signal keys automatically use appropriate default values:
- `rsi-os` → value: 30
- `rsi-ob` → value: 70
- `stochastic-oversold` → value: 20
- `supertrend-long` → value: 'long'

### 3. **Type Safety**
Each signal key maps to the exact correct signalType, indicator, and evaluation function, eliminating mapping errors.

### 4. **Discoverable**
Use `/api/signal-types` to discover all available signals with their descriptions and default values.

## Migration Guide

### For Existing Code
Your existing code using `signalType` and `indicator` will continue to work unchanged.

### For New Code
Use the new `signalKey` format for cleaner, more maintainable code:

```javascript
// Get available signals
const signalTypes = await fetch('/api/signal-types').then(r => r.json());

// Use a signal key
const backtest = await fetch('/api/backtest', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    signalKey: 'rsi-os',
    symbol: 'BTCUSDT',
    timeframe: '15'
  })
});
```

## Error Handling

### Invalid Signal Key
```json
{
  "error": "Signal type 'invalid-key' not found"
}
```

### Missing Parameters
```json
{
  "error": "Either signalKey or both signalType and indicator must be provided",
  "example": {
    "newFormat": { "signalKey": "rsi-os", "symbol": "BTCUSDT", "timeframe": "15" },
    "legacyFormat": { "signalType": "INDICATOR_RsiOsSignal", "indicator": "RsiIndicator", "value": 30 }
  }
}
```

## Testing

Use the Bruno collection to test the new endpoints:
- `Signals/Get Signal Types.bru`
- `Signals/Get Signal Type Details.bru`
- `Signals/Backtest with Signal Key.bru`
- `Signals/Backtest Legacy Format.bru`

## Summary

The enhanced backtest API provides:
✅ **Single signal key** instead of signalType + indicator  
✅ **Automatic default values** for each signal  
✅ **Complete signal discovery** via /api/signal-types  
✅ **Backward compatibility** with existing code  
✅ **70+ pre-configured signals** ready to use  
✅ **Type-safe mappings** eliminate configuration errors
