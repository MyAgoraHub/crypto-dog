# AI Trading Model - Crypto Dog

This directory contains the AI/ML components for building predictive trading models.

## 📁 Structure

```
ai/
├── utils/
│   ├── csv-reader.js          # CSV parsing utilities
│   └── stats.js                # Statistical functions
├── output/                     # Generated analysis files
├── 1-label-creator.js          # Create price labels (UP/DOWN/NEUTRAL)
├── 2-feature-analyzer.js       # Analyze indicator correlations
├── 3-pattern-detector.js       # Detect trading patterns
├── 4-predictor.js              # Prediction model (rule-based)
├── 5-backtester.js             # Backtest trading performance
├── README.md                   # This file
├── ANALYSIS_RESULTS.md         # Analysis findings
├── PERFORMANCE_REPORT.md       # Backtest results
└── QUICKSTART.md               # Quick reference
```

## 🚀 Quick Start

### Step 1: Create Labels
First, analyze the CSV and label each row based on future price movement:

```bash
node ai/1-label-creator.js
```

**What it does:**
- Reads the CSV file
- Looks ahead N candles (default: 3)
- Labels each row as UP, DOWN, or NEUTRAL based on price change
- Outputs: `output/labeled_data.csv`

**Configuration (edit in file):**
- `lookAhead`: How many candles to look ahead (default: 3)
- `upThreshold`: % gain to label as UP (default: 0.3%)
- `downThreshold`: % loss to label as DOWN (default: -0.3%)

### Step 2: Analyze Features
Discover which indicators correlate with price movements:

```bash
node ai/2-feature-analyzer.js
```

**What it does:**
- Calculates correlation between each indicator and price labels
- Identifies top bullish and bearish indicators
- Groups indicators by predictive power (HIGH/MEDIUM/LOW)
- Outputs: `output/feature_analysis.json`

### Step 3: Detect Patterns
Find multi-indicator patterns that predict trends:

```bash
node ai/3-pattern-detector.js
```

**What it does:**
- Tests 20+ predefined patterns (RSI oversold, MACD bullish, etc.)
- Calculates support (how often pattern occurs)
- Calculates confidence (how often pattern is correct)
- Outputs: `output/pattern_analysis.json`

**Pattern Examples:**
- RSI Oversold (RSI < 30) → Expect UP
- MACD Bullish Histogram → Expect UP
- Strong Bullish (SuperTrend long + MACD > 0 + RSI 40-70) → Expect UP

### Step 4: Test Prediction Model
Run the prediction model on historical data:

```bash
node ai/4-predictor.js
```

**What it does:**
- Scores each candle using weighted indicators
- Generates BUY/SELL/HOLD signals with confidence
- Tests accuracy against actual price movements
- Outputs: `output/model_test_results.json`

**Signal Types:**
- STRONG_BUY / STRONG_SELL (high confidence)
- BUY / SELL (medium confidence)
- HOLD (low confidence or conflicting signals)

### Step 5: Run Backtest
Simulate actual trading with the model:

```bash
node ai/5-backtester.js
```

**What it does:**
- Simulates trades based on model signals
- Applies stop loss (2%) and take profit (3%)
- Tracks all trades, P&L, and drawdown
- Calculates win rate, profit factor, returns
- Outputs: `output/backtest_results.json`

**Metrics:**
- Win rate, profit factor, max drawdown
- Average win vs average loss
- Total return, best/worst trades
- Full equity curve

## 📊 Understanding the Output

### Label Distribution
Shows how many UP/DOWN/NEUTRAL trends exist in your data:
```
UP:      150 rows (45.45%)
DOWN:    120 rows (36.36%)
NEUTRAL:  60 rows (18.18%)
```

### Feature Correlation
- **Positive correlation**: Indicator value ↑ → Price UP
- **Negative correlation**: Indicator value ↑ → Price DOWN
- **Correlation ranges:** -1 (perfect negative) to +1 (perfect positive)

### Pattern Metrics
- **Support**: % of data where pattern occurs (higher = more common)
- **Confidence**: % of time pattern predicts correctly (higher = more reliable)
- **Effective Pattern**: Meets both minimum support (5%) and confidence (65%) thresholds

## 🔧 Customization

### Adjust Label Thresholds
Edit `ai/1-label-creator.js`:
```javascript
const CONFIG = {
    lookAhead: 5,        // Look further ahead
    upThreshold: 0.5,    // Require bigger gains
    downThreshold: -0.5  // Require bigger losses
};
```

### Add Custom Patterns
Edit `ai/3-pattern-detector.js` and add to `PATTERNS` array:
```javascript
{
    name: 'My Custom Pattern',
    condition: (row) => row.RsiIndicator < 25 && row.Volume > 100,
    expectedLabel: 'UP'
}
```

## 📈 Next Steps

After running the analysis:

1. **Review Results**: Check `output/` directory for JSON files
2. **Check Performance**: Read `PERFORMANCE_REPORT.md` for backtest results
3. **Identify Issues**: Current model has 43% win rate (needs improvement)
4. **Optimize Parameters**: Adjust thresholds, filters, and risk management
5. **Iterate**: Re-run backtest with improvements

## 🔧 Current Performance

**Backtest Results (Initial Model):**
- Win Rate: 43.18% (19/44 trades)
- Total Return: -4.81%
- Profit Factor: 1.04
- Max Drawdown: -17.68%

**Status:** ⚠️ Model needs optimization before live trading

**See PERFORMANCE_REPORT.md for detailed analysis and improvement recommendations.**

## 🎯 Goals

- [x] Label historical data
- [x] Analyze indicator correlations
- [x] Detect trading patterns
- [x] Build rule-based model
- [x] Create backtesting framework
- [ ] Optimize model parameters
- [ ] Implement ML model (Random Forest/XGBoost)
- [ ] Real-time prediction API
- [ ] Multi-timeframe analysis
- [ ] Paper trading integration

## 📝 Notes

- All analysis is based on your `cryptoDogAiContext_BTCUSDT_15m.csv` file
- Patterns are tested individually (not combined yet)
- Results are statistical - not financial advice!
- Higher confidence patterns should be validated through backtesting
