# CryptoDog Trading System - Troubleshooting Guide

## Current Status: All INDICATOR Signals Fixed ✅

All reported INDICATOR signal issues have been resolved:

- ✅ **INDICATOR_CrocodileSignal**: Fixed mapping from 'ema' → 'Ema3Indicator'
- ✅ **INDICATOR_CrossUpSignal**: Fixed mapping from 'ema' → 'EMAIndicator'  
- ✅ **INDICATOR_CrossDownSignal**: Fixed mapping from 'ema' → 'EMAIndicator'
- ✅ **INDICATOR_UptrendSignal**: Fixed mapping from 'trend' → 'SuperTrendIndicator' + logic fix
- ✅ **INDICATOR_DownTrendSignal**: Fixed mapping from 'trend' → 'SuperTrendIndicator' + logic fix
- ✅ **INDICATOR_Woodies**: Fixed mapping from 'pivot' → 'Woodies'
- ✅ **INDICATOR_DivergenceDetector**: Fixed mapping from 'divergence' → 'MultiDivergenceDetector'
- ✅ **INDICATOR_RsiOsSignal**: Fixed missing threshold value (30 for oversold)
- ✅ **INDICATOR_RsiObSignal**: Fixed missing threshold value (70 for overbought)

**Root Cause**: All signals were mapped to invalid indicator keys that don't exist in `IndicatorList.getIndicator()`, and RSI signals lacked proper threshold values.

**Solution Applied**: Systematically corrected all invalid mappings to use valid indicator class names from Indicators.js, and added default threshold values for RSI signals.

**Testing**: All signals now generate trades in backtesting. Use the interactive backtest menu to test any INDICATOR signal.

## Overview
This guide helps troubleshoot issues with signals, backtesting, and indicator calculations in the CryptoDog trading system.

## Common Issues & Solutions

### 1. "getData is not a function" Error
**Symptoms**: Backtest fails with `TypeError: getData is not a function`

**Causes**:
- Signal uses an indicator that doesn't exist in `IndicatorList.getIndicator()` map
- Signal is marked as INDICATOR but works with raw price data

**Solutions**:
1. Check if the indicator exists in `/core/indicator/Indicators.js` in the `getIndicator` map
2. For price-based signals, modify backtest to skip indicator calculation:
   ```javascript
   if (signal.signalType.includes('INDICATOR') && signal.indicator !== 'price')
   ```
3. Add proper data model handling in backtest for the signal type

**Examples**:
- Fibonacci signals: Use OHLC data instead of indicators
- Support/Resistance signals: Need price + support/resistance levels

### 2. Signal Not Triggering
**Symptoms**: Backtest runs but finds 0 signals

**Causes**:
- Wrong data model passed to signal evaluation function
- Signal logic expects different data structure
- Indicator calculation failing silently

**Debug Steps**:
1. Check signal evaluation function in `/core/cryptoDogSignalAgent.js`
2. Verify data model in backtest matches what the function expects
3. Add debug logging in backtest to see what data is passed
4. Test evaluation function manually with sample data

### 3. Indicator Calculation Errors
**Symptoms**: Errors during indicator calculation phase

**Causes**:
- Missing dependencies in technicalindicators library
- Wrong arguments passed to indicator functions
- Data arrays have different lengths

**Solutions**:
1. Check indicator implementation in `/core/indicator/Indicators.js`
2. Verify input data (o, h, l, c, v arrays) are properly formatted
3. Add error handling around indicator calculations

### 4. Data Model Mismatches
**Symptoms**: Signal evaluation fails or returns unexpected results

**Common Data Model Patterns**:
```javascript
// Simple indicator value
{ value: indicatorData[i] }

// OHLC data
{ high: h[i], low: l[i], price: c[i] }

// Complex indicators
{ macd: data.MACD, signal: data.signal, histogram: data.histogram }

// Support/Resistance
{ price: c[i], support: level, resistance: level, previousPrice: c[i-1] }
```

**Fix**: Add specific case in backtest data model building for the signal type.

### 5. INDICATOR_CrocodileSignal Not Yielding Results
**Symptoms**: Crocodile signal backtests show 0 signals found

**Root Cause**: 
- Signal was mapped to use invalid indicator key `'ema'`
- `'ema'` is not defined in `IndicatorList.getIndicator()` map
- Signal expects `ema1`, `ema2`, `ema3` data structure

**Solution**:
Change indicator mapping from `'ema'` to `'Ema3Indicator'`:
```javascript
'crocodile': 'Ema3Indicator',
'crocodile-dive': 'Ema3Indicator',
```

**Why This Works**:
- `Ema3Indicator` returns object with `ema1`, `ema2`, `ema3` arrays
- Crocodile signal logic: `(data.ema2 > data.ema3) && (data.ema1 > data.ema2)`
- Data model correctly passes `indicatorData.ema1[i]`, etc. to signal function

**Testing**: Run backtest with crocodile signal - should now generate trades.

### 6. INDICATOR_CrossUpSignal/CrossDownSignal Not Yielding Results
**Symptoms**: EMA crossover signals show 0 signals found

**Root Cause**: 
- Signals were mapped to use invalid indicator key `'ema'`
- `'ema'` is not defined in `IndicatorList.getIndicator()` map
- Signals expect array of EMA values for crossover detection

**Solution**:
Change indicator mapping from `'ema'` to `'EMAIndicator'`:
```javascript
'cross-up': 'EMAIndicator',
'cross-down': 'EMAIndicator',
```

**Why This Works**:
- `EMAIndicator` returns array of EMA values (default period 200)
- Cross signals use `indicatorArgs: { period: 200 }` 
- Data model correctly builds: `{all: [prev_values], current: current_value}`
- `crossOver` logic: `data.all.every(element => element > data.current)`

**Testing**: Run backtest with cross-up/cross-down signals - should detect EMA crossovers.

### 7. INDICATOR_DivergenceDetector Not Yielding Results
**Symptoms**: Multi-divergence signal backtests show 0 signals found

**Root Cause**: 
- Signal was mapped to use invalid indicator key `'divergence'`
- `'divergence'` is not defined in `IndicatorList.getIndicator()` map
- Signal expects divergence data structure with `hasDivergence` and `divergence` array

**Solution**:
Change indicator mapping from `'divergence'` to `'MultiDivergenceDetector'`:
```javascript
'multi-div': 'MultiDivergenceDetector',
```

**Why This Works**:
- `MultiDivergenceDetector` returns array with `{c, hasDivergence, divergence}` objects
- Detects divergences across RSI, MACD, Stochastic, and Williams %R indicators
- Signal logic: `data.hasDivergence && data.divergence.filter(div => div.type !== 'Pending Divergence')`
- Returns confirmed divergences for trading signals

**Testing**: Run backtest with multi-div signal - should detect price divergences.

### 8. INDICATOR_UptrendSignal/INDICATOR_DownTrendSignal Not Working
**Symptoms**: Uptrend/downtrend signals show 0 signals or broken logic

**Root Cause**: 
- Signals were mapped to invalid indicator key `'trend'`
- Signal functions had broken logic: `data.c > data` (comparing number to object)
- No proper trend detection implementation

**Solution**:
1. Change indicator mapping to `'SuperTrendIndicator'`:
```javascript
'uptrend': 'SuperTrendIndicator',
'downtrend': 'SuperTrendIndicator',
```

2. Fix signal functions to use SuperTrend data:
```javascript
uptrendTrend: (data, model) => {
    return { signal: data.data && data.data.trend === 'long', data:data}
},
downTrend: (data, model) => {
    return { signal: data.data && data.data.trend === 'short', data:data}
}
```

**Why This Works**:
- `SuperTrendIndicator` returns `{ trend: 'long'|'short', value: number }` objects
- Signals now properly detect trend direction from SuperTrend
- Data model passes `{ data: superTrendData[i], c: c[i] }` to signal functions

**Testing**: Run backtest with uptrend/downtrend signals - should detect trend changes.

## File Structure & Key Locations

### Core Files
- `/core/cryptoDogSignalAgent.js` - Signal evaluation functions
- `/core/cryptoDogBacktest.js` - Backtesting engine
- `/core/indicator/Indicators.js` - Indicator calculations
- `/core/cryptoDogSignalManager.js` - Signal creation/management

### Command Files
- `/commands/backtest.js` - Backtest command & signal mappings
- `/commands/signals.js` - Signal listing command

### Key Functions
- `backtestSignal()` - Main backtesting function
- `IndicatorList.getIndicator()` - Maps indicator names to functions
- Signal agent functions - Evaluate signals (e.g., `supportBreakout`, `fibonacciRetracement`)

## Adding New Signals

### 1. Create Signal Function
Add to `/core/cryptoDogSignalAgent.js`:
```javascript
signalName: (data, model) => {
    // Logic here
    return { signal: boolean, data: data };
}
```

### 2. Map in Backtest Command
Add to `/commands/backtest.js` mappings:
- `signalTypes`: CLI name → internal type
- `indicators`: CLI name → indicator name
- `evaluateFunctions`: CLI name → evaluation function

### 3. Handle Data Model
Add case in `/core/cryptoDogBacktest.js` data model building for the signal type.

### 4. Test
Run backtest and verify signal triggers correctly.

## Testing Checklist

1. ✅ Signal function exists and returns correct format
2. ✅ Indicator mapping exists (if needed)
3. ✅ Data model building handles signal type
4. ✅ Backtest runs without errors
5. ✅ Signals are triggered (check debug output)
6. ✅ Trade execution works correctly

## Debug Commands

```bash
# Test specific signal
node crypto-dog-cli.js backtest -s BTCUSDT -i 1h -t signal-name --iterations 3

# Check signal mappings
node crypto-dog-cli.js signals

# Test indicator calculation
# Add debug logging in backtest to see indicatorData
```

## Common Signal Types

- **INDICATOR_***: Uses calculated indicators
- **PRICE_ACTION_***: Uses raw price data
- **Fibonacci**: Uses OHLC data
- **Support/Resistance**: Uses price + calculated levels

Remember: When adding new signals, always test with small iteration counts first to catch issues quickly.

## Interactive Backtest Interface ✅

### Status: Fully Functional
The interactive backtest menu system is now fully operational and provides an intuitive way to select and test trading signals.

**Usage:**
```bash
crypto-dog-cli.js backtest -s BTCUSDT -i 1h --iterations 15
```

**Features:**
- ✅ Interactive signal selection menu with blessed UI
- ✅ 16+ available signals organized by category
- ✅ Automatic default values for signals that need parameters
- ✅ Real-time backtest execution with progress indicators
- ✅ Keyboard navigation (arrow keys, Enter to select, Esc to exit)

**Available Signal Categories:**
- **RSI Signals**: Oversold/Overbought entries
- **SuperTrend**: Trend-following entries  
- **Price Action**: Level-based entries
- **Pattern Recognition**: EMA patterns, crossovers
- **Technical Indicators**: MACD, Bollinger, Stochastic, etc.
- **Volume Analysis**: OBV, MFI, volume spikes
- **Advanced**: Fibonacci, Support/Resistance, Elder Impulse

## Troubleshooting Interactive Mode
**Issue: Menu doesn't appear**
- Ensure blessed and blessed-contrib are installed: `npm install blessed blessed-contrib`
- Check that terminal supports interactive mode (avoid VS Code integrated terminal)
- Try running in a proper terminal emulator

**Issue: Signal selection fails**
- Verify signal mappings in `commands/backtest.js`
- Check that indicator exists in `IndicatorList.getIndicator()`
- Ensure signal function exists in `cryptoDogSignalAgent.js`

**Issue: Backtest runs but shows 0 signals**
- Check data model building in `cryptoDogBacktest.js`
- Verify indicator calculation returns expected format
- Test signal function manually with sample data

**Issue: Blessed interface hangs or crashes**
- This is a known issue with blessed in some environments
- The core backtesting still works - use direct API calls if needed
- Consider using alternative terminal UI libraries for better compatibility
