# Crypto Dog CLI - Complete Guide

## 📋 Table of Contents
- [Installation](#installation)
- [Available Commands](#available-commands)
- [Signal Management](#signal-management)
- [Trading Tools](#trading-tools)
- [Process Management](#process-management)
- [Data Queries](#data-queries)
- [Examples & Use Cases](#examples--use-cases)

---

## 🚀 Installation

```bash
# Install dependencies
npm install

# Make CLI globally available (optional)
npm link

# Or run directly
node crypto-dog-cli.js <command>
```

---

## 📌 Available Commands

### Quick Reference
```bash
crypto-dog --help                    # Show all commands
crypto-dog intervals                 # List trading intervals
crypto-dog tickers                   # Get market data
crypto-dog calculate                 # Risk/reward calculator
crypto-dog signal-types              # List signal types
crypto-dog create-signal             # Create a signal
crypto-dog list-signals              # View all signals
crypto-dog clear-signals             # Delete all signals
crypto-dog start-monitor             # Start signal processor
crypto-dog start-server              # Start API server
```

---

## 🎯 Signal Management

### List Available Signal Types
```bash
crypto-dog signal-types
```

**Output:**
```
📋 Available Signal Types:

Indicator-Based Signals:
  rsi-ob          - RSI Overbought (requires --value, e.g., 70)
  rsi-os          - RSI Oversold (requires --value, e.g., 30)
  crocodile-dive  - Crocodile Dive (Bearish EMA pattern)
  crocodile       - Crocodile (Bullish EMA pattern)
  cross-up        - EMA Cross Up
  cross-down      - EMA Cross Down
  multi-div       - Multi Divergence Detector
  uptrend         - Uptrend Signal
  downtrend       - Downtrend Signal
  woodies         - Woodies Pivot Signal
  supertrend-long - SuperTrend Long
  supertrend-short- SuperTrend Short

Price Action Signals:
  price-gt        - Price Greater Than (requires --value)
  price-lt        - Price Less Than (requires --value)
  price-gte       - Price Greater Than or Equal (requires --value)
  price-lte       - Price Less Than or Equal (requires --value)
  price-eq        - Price Equal (requires --value)
```

### Create Signals

#### RSI Signals
```bash
# Alert when BTC RSI goes above 70 (overbought)
crypto-dog create-signal -s BTCUSDT -i 1h -t rsi-ob -v 70

# Alert when ETH RSI goes below 30 (oversold)
crypto-dog create-signal -s ETHUSDT -i 15m -t rsi-os -v 30 -m 5
```

#### Price Action Signals
```bash
# Alert when BTC price goes above $50,000
crypto-dog create-signal -s BTCUSDT -i 5m -t price-gt -v 50000

# Alert when ADA price goes below $0.50
crypto-dog create-signal -s ADAUSDT -i 1h -t price-lt -v 0.50

# Alert when ETH reaches exactly $3,000
crypto-dog create-signal -s ETHUSDT -i 15m -t price-eq -v 3000
```

#### Trend & Pattern Signals
```bash
# Bullish EMA pattern (Crocodile)
crypto-dog create-signal -s BTCUSDT -i 4h -t crocodile

# Bearish EMA pattern (Crocodile Dive)
crypto-dog create-signal -s ETHUSDT -i 1h -t crocodile-dive

# EMA Cross Up (bullish crossover)
crypto-dog create-signal -s SOLUSDT -i 15m -t cross-up

# EMA Cross Down (bearish crossover)
crypto-dog create-signal -s BNBUSDT -i 1h -t cross-down

# Uptrend detection
crypto-dog create-signal -s ADAUSDT -i 4h -t uptrend

# Downtrend detection
crypto-dog create-signal -s XRPUSDT -i 1h -t downtrend
```

#### Advanced Signals
```bash
# Multi-divergence detection
crypto-dog create-signal -s BTCUSDT -i 4h -t multi-div -m 2

# SuperTrend long signal
crypto-dog create-signal -s ETHUSDT -i 1h -t supertrend-long

# SuperTrend short signal
crypto-dog create-signal -s BTCUSDT -i 4h -t supertrend-short

# Woodies Pivot Points
crypto-dog create-signal -s BTCUSDT -i 1D -t woodies
```

### List Signals
```bash
# Show all signals
crypto-dog list-signals

# Show only active signals
crypto-dog list-signals --active

# Show only triggered signals
crypto-dog list-signals --triggered
```

**Sample Output:**
```
✔ Found 3 signal(s)

📊 Configured Signals:

┌────────────┬──────────┬──────────────────────────────┬────────────┬──────────┐
│ Symbol     │ Interval │ Type                         │ Triggers   │ Status   │
├────────────┼──────────┼──────────────────────────────┼────────────┼──────────┤
│ BTCUSDT    │ 1h       │ INDICATOR_RSI_OB_Signal      │ 2/3        │ Active   │
│ ETHUSDT    │ 15m      │ PRICE_ACTION_LT-0.67         │ 1/3        │ Active   │
│ ADAUSDT    │ 4h       │ INDICATOR_CROCODILE_Signal   │ 0/3        │ Active   │
└────────────┴──────────┴──────────────────────────────┴────────────┴──────────┘
```

### Delete Signals
```bash
# Delete all signals (requires confirmation)
crypto-dog clear-signals --yes
```

---

## 💰 Trading Tools

### Stop-Loss & Profit Calculator

#### Long Position
```bash
# Calculate for long position
crypto-dog calculate -e 50000 -t long -s 2 -p 5 -a 1000

# With custom risk/reward
crypto-dog calculate -e 50000 -t long -s 1.5 -p 6 -a 5000
```

**Output:**
```
💰 Trading Calculator Results:

Position Details:
  Type: LONG
  Entry Price: $50000.00
  Position Size: $1000.00

Stop-Loss:
  Price: $49000.00
  Distance: 2%
  Loss Amount: -$20.00

Profit Target:
  Price: $52500.00
  Distance: 5%
  Profit Amount: +$50.00

Risk/Reward:
  Ratio: 2.50:1
  Rating: Excellent ✓
```

#### Short Position
```bash
# Calculate for short position
crypto-dog calculate -e 3000 -t short -s 3 -p 7 -a 500

# Tight stop-loss
crypto-dog calculate -e 3000 -t short -s 1 -p 3 -a 1000
```

**Options:**
- `-e, --entry <price>` - Entry price (required)
- `-t, --type <type>` - Position type: long/short (required)
- `-s, --stop-loss <percentage>` - Stop-loss % (default: 2)
- `-p, --profit <percentage>` - Profit target % (default: 5)
- `-a, --amount <amount>` - Position size (default: 100)

---

## 🔄 Process Management

### Start Signal Monitor
```bash
# Run in foreground (see logs in real-time)
crypto-dog start-monitor

# Run in background (daemon mode)
crypto-dog start-monitor --daemon

# Stop background process
kill <PID>
```

**In Termux:** Automatically sends push notifications when signals trigger! 🔔

### Start API Server
```bash
# Start on default port (3000)
crypto-dog start-server

# Start on custom port
crypto-dog start-server --port 8080
```

**Access:**
- API: `http://localhost:3000`
- Portal: `http://localhost:5173` (run `npm run portal:dev` separately)

---

## 📊 Data Queries

### Get Ticker Data
```bash
# Get top 10 spot tickers
crypto-dog tickers -c spot

# Get specific symbol
crypto-dog tickers -c spot -s BTCUSDT

# Get futures tickers
crypto-dog tickers -c linear -s BTCUSDT
```

**Categories:**
- `spot` - Spot trading
- `linear` - USDT perpetual
- `inverse` - Inverse perpetual
- `option` - Options

### List Trading Intervals
```bash
crypto-dog intervals
```

**Output:**
```
📊 Available Intervals:

┌────────────┬────────────┬──────────────────────────────┐
│ Key        │ Value      │ Label                        │
├────────────┼────────────┼──────────────────────────────┤
│ 1m         │ 1          │ 1 minute                     │
│ 5m         │ 5          │ 5 minutes                    │
│ 15m        │ 15         │ 15 minutes                   │
│ 1h         │ 60         │ 1 hour                       │
│ 4h         │ 240        │ 4 hours                      │
│ 1D         │ D          │ 1 day                        │
└────────────┴────────────┴──────────────────────────────┘
```

---

## 💡 Examples & Use Cases

### Use Case 1: Scalping Setup (Short Timeframes)
```bash
# RSI oversold on 5m chart
crypto-dog create-signal -s BTCUSDT -i 5m -t rsi-os -v 25 -m 10

# Price breaks above resistance
crypto-dog create-signal -s BTCUSDT -i 5m -t price-gt -v 51000

# EMA cross up confirmation
crypto-dog create-signal -s BTCUSDT -i 5m -t cross-up -m 5

# Start monitoring
crypto-dog start-monitor
```

### Use Case 2: Swing Trading Setup (4H/1D)
```bash
# RSI overbought on 4h
crypto-dog create-signal -s ETHUSDT -i 4h -t rsi-ob -v 70 -m 3

# Multi-divergence detection
crypto-dog create-signal -s ETHUSDT -i 4h -t multi-div -m 2

# SuperTrend reversal
crypto-dog create-signal -s ETHUSDT -i 4h -t supertrend-short -m 1

# Daily Woodies pivot
crypto-dog create-signal -s ETHUSDT -i 1D -t woodies

# Start monitoring in background
crypto-dog start-monitor --daemon
```

### Use Case 3: Price Level Alerts
```bash
# Alert at support level
crypto-dog create-signal -s BTCUSDT -i 1h -t price-lte -v 45000 -m 1

# Alert at resistance level
crypto-dog create-signal -s BTCUSDT -i 1h -t price-gte -v 55000 -m 1

# Alert at breakout level
crypto-dog create-signal -s ETHUSDT -i 15m -t price-gt -v 3200 -m 3

# Monitor
crypto-dog start-monitor
```

### Use Case 4: Risk Management Workflow
```bash
# 1. Calculate position sizing
crypto-dog calculate -e 50000 -t long -s 2 -p 6 -a 5000

# 2. Set stop-loss alert
crypto-dog create-signal -s BTCUSDT -i 5m -t price-lt -v 49000 -m 1

# 3. Set take-profit alert
crypto-dog create-signal -s BTCUSDT -i 5m -t price-gt -v 53000 -m 1

# 4. Monitor signals
crypto-dog start-monitor

# 5. Check triggered signals
crypto-dog list-signals --triggered
```

### Use Case 5: Multi-Symbol Monitoring
```bash
# Setup signals for portfolio
crypto-dog create-signal -s BTCUSDT -i 1h -t rsi-os -v 30
crypto-dog create-signal -s ETHUSDT -i 1h -t rsi-os -v 30
crypto-dog create-signal -s ADAUSDT -i 1h -t rsi-os -v 30
crypto-dog create-signal -s SOLUSDT -i 1h -t rsi-os -v 30
crypto-dog create-signal -s BNBUSDT -i 1h -t rsi-os -v 30

# View all signals
crypto-dog list-signals

# Start monitoring all
crypto-dog start-monitor --daemon
```

---

## 🐕 Full Workflow Example

### Day Trading Bitcoin

```bash
# 1. Check current market
crypto-dog tickers -c spot -s BTCUSDT

# 2. Setup signals
crypto-dog create-signal -s BTCUSDT -i 15m -t rsi-os -v 30 -m 5
crypto-dog create-signal -s BTCUSDT -i 15m -t cross-up -m 3
crypto-dog create-signal -s BTCUSDT -i 15m -t price-lt -v 48000 -m 1

# 3. Calculate entry
crypto-dog calculate -e 49000 -t long -s 2 -p 5 -a 1000

# 4. Start monitoring
crypto-dog start-monitor

# 5. Also start web server for visual monitoring
crypto-dog start-server

# 6. Open browser: http://localhost:3000
# Navigate to "Signals" page to see real-time updates

# 7. Check triggered signals
crypto-dog list-signals --triggered

# 8. Clean up after trading session
crypto-dog clear-signals --yes
```

---

## 🔔 Termux Integration

When running in **Termux** (Android terminal), the signal monitor automatically sends push notifications!

### Setup in Termux:
```bash
# Install Termux API
pkg install termux-api

# Install Termux:API app from F-Droid or Play Store

# Test notification
termux-notification --title "Test" --content "Crypto Dog is ready!" --sound

# Start monitoring (will send notifications)
crypto-dog start-monitor --daemon
```

**Notifications include:**
- 🚨 Signal triggered alerts
- ✓ Signal completion notices
- Symbol, type, and trigger count

---

## 📝 Tips & Best Practices

1. **Start with few signals** - Test with 1-2 signals before creating many
2. **Use appropriate timeframes** - Match signal timeframe to your trading style
3. **Set realistic max triggers** - 3-5 triggers usually sufficient
4. **Monitor in background** - Use `--daemon` flag for continuous monitoring
5. **Review regularly** - Check `list-signals --triggered` daily
6. **Calculate risk first** - Always use the calculator before entering trades
7. **Clean up periodically** - Remove old signals with `clear-signals`

---

## 🆘 Troubleshooting

### Signal not triggering?
```bash
# Check if signal is active
crypto-dog list-signals

# Verify signal configuration
crypto-dog list-signals --active

# Restart monitor
crypto-dog start-monitor
```

### Monitor not running?
```bash
# Check if process is running
ps aux | grep cryptoDogSignalProcessor

# Restart in foreground to see errors
crypto-dog start-monitor
```

### API errors?
```bash
# Check server status
curl http://localhost:3000/api/signals

# Restart server
crypto-dog start-server
```

---

## 🎓 Learn More

- **Portal UI**: Run `npm run portal:dev` for visual interface
- **Source Code**: Check `crypto-dog-cli.js` for implementation
- **Signal Types**: See `core/cryptoDogSignalManager.js` for signal logic
- **Indicators**: Check `core/indicator/` for indicator implementations

---

**Happy Trading! 🐕📈**
