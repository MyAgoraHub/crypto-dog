# 🐕 Crypto Dog CLI

A beautiful command-line tool for cryptocurrency trading and data analysis using the Bybit API.

## Features

- 📊 **Ticker Data**: Real-time price information
- 📈 **Candlestick Data**: Historical OHLCV data with customizable intervals
- 📖 **Order Book**: Live bid/ask depth data
- 🔴 **WebSocket Streaming**: Real-time market data streams
- 🕐 **Historical Data Loading**: Fetch large amounts of historical data with automatic pagination

## Installation

```bash
npm install
```

## Usage

### Show Available Commands

```bash
node crypto-dog-cli.js --help
```

### List Available Intervals

```bash
node crypto-dog-cli.js intervals
```

### Get Ticker Data

Get all tickers for a category:
```bash
node crypto-dog-cli.js tickers -c spot
```

Get ticker for a specific symbol:
```bash
node crypto-dog-cli.js tickers -c spot -s BTCUSDT
```

### Get Candle Data

```bash
node crypto-dog-cli.js candles -c spot -s BTCUSDT -i 5 -l 20
```

Options:
- `-c, --category`: Market category (spot, linear, inverse)
- `-s, --symbol`: Trading symbol (e.g., BTCUSDT)
- `-i, --interval`: Time interval (1, 5, 15, 60, 240, D, W, M)
- `-l, --limit`: Number of candles (default: 10)

### Load Historical Data

Fetch large amounts of historical data:
```bash
node crypto-dog-cli.js load-history -c spot -s BTCUSDT -i 240 -n 10 -l 200
```

This will fetch 10 iterations of 200 candles each (up to 2000 candles total).

Options:
- `-n, --iterations`: Number of iterations (default: 5)
- `-l, --limit`: Candles per request (default: 200)

### Get Order Book

```bash
node crypto-dog-cli.js orderbook -c spot -s BTCUSDT -l 10
```

### Stream Live Data (WebSocket)

Stream ticker data:
```bash
node crypto-dog-cli.js stream -c spot -t tickers.BTCUSDT --throttle 2000
```

Stream multiple topics:
```bash
node crypto-dog-cli.js stream -c linear -t orderbook.50.BTCUSDT kline.5.ETHUSDT --throttle 1000
```

Options:
- `-c, --category`: Market category
- `-t, --topics`: Topics to subscribe (space-separated)
- `--throttle`: Update throttle in milliseconds (default: 1000)
- `--testnet`: Use testnet instead of mainnet

## Available Topics for WebSocket

- `tickers.<SYMBOL>`: Real-time ticker updates
- `orderbook.<DEPTH>.<SYMBOL>`: Order book updates (depth: 1, 50, 200, 500)
- `kline.<INTERVAL>.<SYMBOL>`: Candlestick updates
- `publicTrade.<SYMBOL>`: Public trades

## Examples

### Quick Price Check
```bash
node crypto-dog-cli.js tickers -c spot -s BTCUSDT
```

### Get 4-hour candles for analysis
```bash
node crypto-dog-cli.js candles -c spot -s BTCUSDT -i 240 -l 50
```

### Watch live orderbook
```bash
node crypto-dog-cli.js stream -c spot -t orderbook.50.BTCUSDT --throttle 500
```

### Load massive historical data
```bash
node crypto-dog-cli.js load-history -c spot -s BTCUSDT -i 60 -n 20 -l 200
```

## Terminal Compatibility

This CLI is designed to work beautifully in:
- ✅ Linux/Unix terminals
- ✅ macOS Terminal
- ✅ Windows Terminal / PowerShell
- ✅ Android Termux
- ✅ SSH sessions

The colored output and tables are optimized for both dark and light themes.

## Notes

- The CLI includes automatic rate limiting to prevent API errors
- Historical data loading will stop automatically when no more data is available
- WebSocket streams can be stopped with Ctrl+C
- All timestamps are displayed in ISO 8601 format (UTC)

## License

ISC
