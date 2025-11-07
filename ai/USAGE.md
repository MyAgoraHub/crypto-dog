# How to Use the AI Analysis Pipeline

## 🚀 Quick Start

### Run Everything (First Time)
```bash
# From crypto-dog root directory
node ai/run-all.js
```

This will:
1. ✅ Create labels from price data
2. ✅ Analyze all indicators
3. ✅ Detect trading patterns
4. ✅ Test prediction model
5. ✅ Run full backtest

**Time:** ~5-10 seconds

---

## ⚡ Quick Mode (Testing Changes)

If you've already created labels and just want to test model changes:

```bash
node ai/run-all.js --quick
```

This skips steps 1-3 and runs only:
- ✅ Prediction model testing
- ✅ Backtesting

**Time:** ~2 seconds

---

## 🎯 Individual Scripts

Run specific parts independently:

```bash
# Step 1: Create labels
node ai/1-label-creator.js

# Step 2: Analyze features
node ai/2-feature-analyzer.js

# Step 3: Detect patterns
node ai/3-pattern-detector.js

# Step 4: Test predictor
node ai/4-predictor.js

# Step 5: Run backtest
node ai/5-backtester.js

# API example
node ai/api/predict.js
```

---

## 🔧 Workflow for Testing New Ideas

### Scenario 1: Testing Different Parameters

1. **Edit `ai/4-predictor.js`:**
```javascript
const CONFIG = {
    weights: {
        superTrend: 30,  // Changed from 25
        rsi: 25,         // Changed from 20
        // ...
    },
    thresholds: {
        strongBuy: 70,   // Changed from 60
        buy: 50,         // Changed from 40
        // ...
    }
};
```

2. **Run quick test:**
```bash
node ai/run-all.js --quick
```

3. **Check results:**
```bash
# View backtest results
cat ai/output/backtest_results.json | jq '.metrics'

# Or just look at the terminal output
```

### Scenario 2: Testing Different Label Thresholds

1. **Edit `ai/1-label-creator.js`:**
```javascript
const CONFIG = {
    lookAhead: 5,      // Changed from 3
    upThreshold: 0.5,  // Changed from 0.3
    downThreshold: -0.5 // Changed from -0.3
};
```

2. **Run full pipeline:**
```bash
node ai/run-all.js
```

### Scenario 3: Using a Different CSV File

1. **Update the file path in `ai/1-label-creator.js`:**
```javascript
const CONFIG = {
    inputFile: '../my-new-data.csv',  // Your new file
    // ...
};
```

2. **Run full pipeline:**
```bash
node ai/run-all.js
```

---

## 📊 Understanding the Output

### Terminal Output

After running, you'll see:

```
📊 BACKTEST RESULTS
======================================================================
💰 Performance Summary:
   Initial Capital:    $10000
   Final Capital:      $9518.84
   Total Return:       -4.81%        ← Main metric

📈 Trading Statistics:
   Win Rate:           43.18%        ← Need 50%+ to be profitable
   Profit Factor:      1.04          ← Need 1.5+ for good system
   Max Drawdown:       17.68%        ← Risk metric
```

### Output Files

All results are saved to `ai/output/`:

```
ai/output/
├── labeled_data.csv           # Data with UP/DOWN/NEUTRAL labels
├── feature_analysis.json      # Indicator correlations
├── pattern_analysis.json      # Pattern effectiveness
├── model_test_results.json    # Model accuracy
└── backtest_results.json      # Trading performance
```

**View with:**
```bash
# Pretty print JSON
cat ai/output/backtest_results.json | jq

# Or open in VS Code
code ai/output/backtest_results.json
```

---

## 🎯 Optimization Workflow

### Goal: Improve from 43% to 55%+ Win Rate

**Iteration 1: Increase Confidence Threshold**

```javascript
// ai/4-predictor.js
filters: {
    minConfidence: 70,  // Was 50
}
```

```bash
node ai/run-all.js --quick
```

**Expected:** Fewer trades, but higher accuracy

---

**Iteration 2: Only Trade Strong Signals**

```javascript
// ai/5-backtester.js
onlyStrongSignals: true  // Was false
```

```bash
node ai/run-all.js --quick
```

**Expected:** Even fewer trades, highest accuracy

---

**Iteration 3: Better Risk Management**

```javascript
// ai/5-backtester.js
stopLossPercent: 1.5,    // Tighter stop
takeProfitPercent: 4.0,  // Larger target
```

```bash
node ai/run-all.js --quick
```

**Expected:** Better risk/reward ratio

---

**Iteration 4: Add Filters**

```javascript
// ai/4-predictor.js
filters: {
    minConfidence: 70,
    useADXFilter: true,   // Only trade strong trends
    useBBFilter: true     // Avoid ranging markets
}
```

```bash
node ai/run-all.js --quick
```

**Expected:** Better entry quality

---

## 📈 Tracking Your Experiments

Create a simple log file:

```bash
# experiments.md
## Experiment 1: Baseline
- Config: Default settings
- Win Rate: 43.18%
- Return: -4.81%
- Notes: Too many false signals

## Experiment 2: Higher Confidence
- Config: minConfidence = 70
- Win Rate: ???
- Return: ???
- Notes: Testing...
```

---

## 🔄 Common Commands

```bash
# Full analysis
node ai/run-all.js

# Quick test after changes
node ai/run-all.js --quick

# Skip label creation (use existing)
node ai/run-all.js --skip-labels

# Test predictor only
node ai/4-predictor.js

# Test backtester only
node ai/5-backtester.js

# View results
cat ai/output/backtest_results.json | jq '.metrics'

# Check performance report
cat ai/PERFORMANCE_REPORT.md
```

---

## 💡 Pro Tips

1. **Always use `--quick` when testing parameter changes**
   - Saves time by skipping label creation
   - Labels don't change unless you modify thresholds

2. **Keep track of what you change**
   - Take notes on each experiment
   - Screenshot good results

3. **Start with small changes**
   - Change one thing at a time
   - Easier to understand what improved

4. **Watch multiple metrics**
   - Win rate alone isn't enough
   - Check profit factor, drawdown, return

5. **Test on different data**
   - Create CSVs from different time periods
   - Bull market vs bear market vs ranging

---

## 🚨 Troubleshooting

### Error: "Cannot find module"
```bash
# Make sure you're in the right directory
cd /home/benjamin/develop/crypto-dog

# Check file exists
ls ai/run-all.js
```

### Error: "No labeled data found"
```bash
# Run full pipeline first
node ai/run-all.js

# Or create labels manually
node ai/1-label-creator.js
```

### Performance not improving
- Try more extreme threshold changes (60 → 80)
- Check if data has enough variety (different market conditions)
- Consider that 15m timeframe is inherently noisy
- May need different indicators or ML model

---

## 📚 Next Steps

1. **Experiment with parameters** using the workflow above
2. **Document your findings** in experiments.md
3. **Compare results** across iterations
4. **When satisfied**, integrate with your trading bot
5. **Paper trade** before going live

**Remember:** Always test thoroughly before risking real money!
