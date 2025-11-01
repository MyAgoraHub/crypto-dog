import { CryptoDogWebSocketHandler } from "../core/clients/cryptoDogWebsocketHandler.js";
import blessed from 'blessed';
import contrib from 'blessed-contrib';

class OrderbookDashboard {
  constructor(symbol, depth = 50) {
    this.symbol = symbol;
    this.depth = depth;
    this.orderbook = {
      bids: new Map(), // price -> quantity
      asks: new Map(), // price -> quantity
      lastUpdateId: 0,
      lastSequence: 0
    };

    this.screen = null;
    this.grid = null;
    this.components = {};
    this.isRunning = false;

    this.wsHandler = new CryptoDogWebSocketHandler({
      testnet: false,
      throttleMs: 100 // Faster updates for orderbook
    });

    this.initDashboard();
    this.setupWebSocket();
  }

  initDashboard() {
    // Create blessed screen
    this.screen = blessed.screen({
      smartCSR: true,
      title: `Bybit Orderbook - ${this.symbol}`,
      fullUnicode: true
    });

    // Create grid layout
    this.grid = new contrib.grid({ rows: 12, cols: 12, screen: this.screen });

    // Header box
    this.components.header = this.grid.set(0, 0, 2, 12, contrib.log, {
      fg: 'cyan',
      selectedFg: 'cyan',
      label: '📊 Bybit Orderbook Dashboard',
      border: { type: "line", fg: 'cyan' },
      width: '100%'
    });

    // Asks table (top)
    this.components.asksTable = this.grid.set(2, 0, 4, 12, contrib.table, {
      keys: false,
      fg: 'red',
      selectedFg: 'white',
      selectedBg: 'red',
      label: '🔴 ASKS (Sell Orders)',
      border: { type: "line", fg: 'red' },
      columnSpacing: 2,
      columnWidth: [15, 12, 12] // Price, Quantity, Total
    });

    // Bids table (bottom)
    this.components.bidsTable = this.grid.set(6, 0, 4, 12, contrib.table, {
      keys: false,
      fg: 'green',
      selectedFg: 'white',
      selectedBg: 'green',
      label: '🟢 BIDS (Buy Orders)',
      border: { type: "line", fg: 'green' },
      columnSpacing: 2,
      columnWidth: [15, 12, 12] // Price, Quantity, Total
    });

    // Status bar
    this.components.statusBar = this.grid.set(10, 0, 2, 12, contrib.log, {
      fg: "yellow",
      selectedFg: "yellow",
      label: 'Status',
      width: '100%'
    });

    // Set up key bindings
    this.screen.key(['escape', 'q', 'C-c'], () => {
      this.stop();
      process.exit(0);
    });

    this.screen.key(['r'], () => {
      this.resetOrderbook();
    });

    // Initial render
    this.updateHeader();
    this.updateTables();
    this.updateStatus('Connecting to WebSocket...');

    this.screen.render();
  }

  setupWebSocket() {
    const topic = `orderbook.${this.depth}.${this.symbol}`;

    this.wsHandler.subscribeToTopics([topic], 'spot');

    this.wsHandler.onUpdate((data) => {
      if (data.topic === topic) {
        this.updateOrderbook(data.data);
        this.updateDisplay();
      }
    });

    this.wsHandler.onException((err) => {
      this.updateStatus(`❌ WebSocket error: ${err.message}`);
    });

    this.isRunning = true;
  }

  updateOrderbook(data) {
    const { b: bids, a: asks, u: updateId, seq: sequence } = data;

    // Skip if this is an older update
    if (updateId && updateId <= this.orderbook.lastUpdateId) {
      return;
    }

    if (sequence && sequence <= this.orderbook.lastSequence) {
      return;
    }

    // Update bids
    if (bids && Array.isArray(bids)) {
      bids.forEach(([price, quantity]) => {
        const qty = parseFloat(quantity);
        if (qty === 0) {
          this.orderbook.bids.delete(price);
        } else {
          this.orderbook.bids.set(price, quantity);
        }
      });
    }

    // Update asks
    if (asks && Array.isArray(asks)) {
      asks.forEach(([price, quantity]) => {
        const qty = parseFloat(quantity);
        if (qty === 0) {
          this.orderbook.asks.delete(price);
        } else {
          this.orderbook.asks.set(price, quantity);
        }
      });
    }

    // Update tracking
    if (updateId) this.orderbook.last
    if (sequence) this.orderbook.lastSequence = sequence;
  }

  updateDisplay() {
    this.updateHeader();
    this.updateTables();
    this.updateStatus(`✅ Connected | Last Update: ${this.orderbook.lastUpdateId} | Sequence: ${this.orderbook.lastSequence}`);
    this.screen.render();
  }

  updateHeader() {
    const timestamp = new Date().toLocaleTimeString();
    const bidsCount = this.orderbook.bids.size;
    const asksCount = this.orderbook.asks.size;

    const headerText = [
      `📊 BYBIT ORDERBOOK DASHBOARD`,
      `─`.repeat(60),
      `Symbol: ${this.symbol} | Depth: ${this.depth} | Time: ${timestamp}`,
      `Bids: ${bidsCount} | Asks: ${asksCount} | Updates: ${this.orderbook.lastUpdateId}`,
      `─`.repeat(60)
    ].join('\n');

    this.components.header.setContent(headerText);
  }

  updateTables() {
    // Update asks table (sell orders) - lowest to highest
    const sortedAsks = Array.from(this.orderbook.asks.entries())
      .sort(([a], [b]) => parseFloat(a) - parseFloat(b))
      .slice(0, 20); // Show top 20 asks

    let askTotal = 0;
    const askData = []; // Just the data rows

    sortedAsks.forEach(([price, quantity], index) => {
      const qty = parseFloat(quantity);
      askTotal += qty;

      askData.push([
        price,
        quantity,
        askTotal.toFixed(4)
      ]);
    });

    // Set data with proper blessed-contrib format
    this.components.asksTable.setData({
      headers: ['Price', 'Quantity', 'Total'],
      data: askData
    });

    // Update bids table (buy orders) - highest to lowest
    const sortedBids = Array.from(this.orderbook.bids.entries())
      .sort(([a], [b]) => parseFloat(b) - parseFloat(a))
      .slice(0, 20); // Show top 20 bids

    let bidTotal = 0;
    const bidData = []; // Just the data rows

    sortedBids.forEach(([price, quantity], index) => {
      const qty = parseFloat(quantity);
      bidTotal += qty;

      bidData.push([
        price,
        quantity,
        bidTotal.toFixed(4)
      ]);
    });

    // Set data with proper blessed-contrib format
    this.components.bidsTable.setData({
      headers: ['Price', 'Quantity', 'Total'],
      data: bidData
    });
  }

  updateStatus(message) {
    // Calculate spread if available
    const spread = this.calculateSpread();
    const spreadText = spread ?
      ` | Spread: ${spread.price.toFixed(2)} (${spread.percent.toFixed(4)}%)` : '';

    this.components.statusBar.setContent(`${message}${spreadText}\nPress 'q' or Ctrl+C to exit | 'r' to reset`);
  }

  calculateSpread() {
    if (this.orderbook.asks.size === 0 || this.orderbook.bids.size === 0) {
      return null;
    }

    const bestAsk = Math.min(...Array.from(this.orderbook.asks.keys()).map(p => parseFloat(p)));
    const bestBid = Math.max(...Array.from(this.orderbook.bids.keys()).map(p => parseFloat(p)));

    return {
      price: bestAsk - bestBid,
      percent: ((bestAsk - bestBid) / bestBid) * 100
    };
  }

  resetOrderbook() {
    this.orderbook.bids.clear();
    this.orderbook.asks.clear();
    this.orderbook.lastUpdateId = 0;
    this.orderbook.lastSequence = 0;
    this.updateDisplay();
    this.updateStatus('Orderbook reset - waiting for new data...');
  }

  getOrderbook() {
    return {
      bids: Object.fromEntries(this.orderbook.bids),
      asks: Object.fromEntries(this.orderbook.asks),
      lastUpdateId: this.orderbook.lastUpdateId,
      lastSequence: this.orderbook.lastSequence
    };
  }

  stop() {
    this.isRunning = false;
    // Note: The WebSocket handler doesn't have a close method
    // The connection will close naturally when the process exits
    if (this.screen) {
      this.screen.destroy();
    }
  }
}

// Main execution
console.log('🚀 Starting Bybit Orderbook Dashboard...');

const symbol = process.argv[2] || 'BTCUSDT';
const depth = parseInt(process.argv[3]) || 50;

console.log(`📊 Symbol: ${symbol}`);
console.log(`📏 Depth: ${depth}`);
console.log('Loading dashboard...\n');

// Create dashboard
const dashboard = new OrderbookDashboard(symbol, depth);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down orderbook dashboard...');
  dashboard.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down orderbook dashboard...');
  dashboard.stop();
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  dashboard.stop();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  dashboard.stop();
  process.exit(1);
});
