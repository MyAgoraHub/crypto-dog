# Simplified Backtest API

## Overview

The Crypto Dog backtest API has been simplified to automatically map `signalType` to the correct `indicator`, eliminating the need to manually specify both parameters.

## Key Features

✅ **Automatic Mapping**: Just provide `signalType`, the `indicator` is auto-mapped  
✅ **Backward Compatible**: Still accepts explicit `indicator` parameter  
✅ **Simplified Usage**: No more complex signal key mappings  
✅ **Error Handling**: Clear error messages for unmapped signal types  

## API Usage

### New Simplified Format (Recommended)

```json
{
  "signalType": "INDICATOR_RsiOsSignal",
  "value": 30,
  "symbol": "BTCUSDT",
  "timeframe": "15",
  "iterations": 5,
  "candles": 100,
  "risk": 2,
  "reward": 5,
  "capital": 10000
}
```

### Legacy Format (Still Supported)

```json
{
  "signalType": "INDICATOR_RsiOsSignal",
  "indicator": "RsiIndicator",
  "value": 30,
  "symbol": "BTCUSDT",
  "timeframe": "15"
}
```

## Signal Type Mappings

The API automatically maps these signal types to their corresponding indicators:

| Signal Type | Auto-Mapped Indicator | Description |
|-------------|----------------------|-------------|
| `INDICATOR_RsiObSignal` | `RsiIndicator` | RSI Overbought Signal |
| `INDICATOR_RsiOsSignal` | `RsiIndicator` | RSI Oversold Signal |
| `INDICATOR_MacdBullishSignal` | `MacdIndicator` | MACD Bullish Signal |
| `INDICATOR_MacdBearishSignal` | `MacdIndicator` | MACD Bearish Signal |
| `INDICATOR_BollingerUpperTouchSignal` | `BollingerBandsIndicator` | Bollinger Upper Band Touch |
| `INDICATOR_BollingerLowerTouchSignal` | `BollingerBandsIndicator` | Bollinger Lower Band Touch |
| `INDICATOR_StochasticOverboughtSignal` | `StochasticIndicator` | Stochastic Overbought |
| `INDICATOR_StochasticOversoldSignal` | `StochasticIndicator` | Stochastic Oversold |
| `INDICATOR_SuperTrendSignal` | `SuperTrendIndicator` | SuperTrend Signal |
| `INDICATOR_GoldenCrossSignal` | `EmaIndicator` | Golden Cross Signal |
| `INDICATOR_DeathCrossSignal` | `EmaIndicator` | Death Cross Signal |

## API Endpoints

### POST /api/backtest

**Required Parameters:**
- `signalType` - The signal type to test (e.g., "INDICATOR_RsiOsSignal")

**Optional Parameters:**
- `indicator` - Override auto-mapping (for backward compatibility)
- `value` - Signal threshold value (default: 0)
- `symbol` - Trading pair (default: "BTCUSDT")
- `timeframe` - Time interval (default: "15")
- `iterations` - Number of iterations (default: 10)
- `candles` - Candles per iteration (default: 200)
- `risk` - Risk percentage (default: 2)
- `reward` - Reward percentage (default: 5)
- `capital` - Initial capital (default: 10000)

### GET /api/signal-types

Returns all available signal types with their auto-mapped indicators.

### GET /api/signal-types/:signalType

Returns details for a specific signal type including default values and evaluation functions.

## Example Responses

### Successful Backtest Response

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
    "autoMappedIndicator": true
  },
  "results": {
    "totalTrades": 2,
    "winningTrades": 1,
    "losingTrades": 1,
    "winRate": 50,
    "totalReturn": 150.75,
    "maxDrawdown": -75.25
  }
}
```

### Error Response

```json
{
  "error": "Unable to auto-map indicator for signalType: INVALID_SIGNAL. Please provide the indicator parameter.",
  "availableSignalTypes": ["INDICATOR_RsiObSignal", "INDICATOR_RsiOsSignal", ...]
}
```

## Benefits

1. **Easier Integration**: No need to maintain signal key mappings
2. **Less Error-Prone**: Automatic mapping prevents mismatched signal/indicator pairs
3. **Backward Compatible**: Existing code continues to work
4. **Clear Documentation**: Simple parameter structure
5. **Better Error Messages**: Clear feedback for invalid signal types

## Migration Guide

If you're using the old complex signal key system:

**Before:**
```json
{
  "signalKey": "rsi-os",
  "symbol": "BTCUSDT"
}
```

**After:**
```json
{
  "signalType": "INDICATOR_RsiOsSignal",
  "value": 30,
  "symbol": "BTCUSDT"
}
```

## Testing

Use the Bruno collection tests:
- `Backtest with Auto-Mapping.bru` - Tests the new simplified format
- `Backtest Legacy Format.bru` - Tests backward compatibility

## Implementation Notes

- Fixed `getInterval()` function to handle both `'15'` and `'15m'` formats
- Removed complex signal mapping utilities in favor of direct lookup table
- Maintained all existing evaluation functions and logic
- Added `autoMappedIndicator` flag in response to indicate when mapping was used
