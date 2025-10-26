#!/usr/bin/env node

import blessed from 'blessed';
import contrib from 'blessed-contrib';

// Sample indicator data (from your context.txt)
const sampleIndicators = {
  'RSI(14)': 68.84,
  'MACD': { MACD: 663.27, signal: 563.70, histogram: 99.57 },
  'SuperTrend': { trend: 'long', value: 112771.15 },
  'ATR(14)': 280.54,
  'Bollinger Upper': { middle: 112878.75, upper: 114143.57, lower: 111613.93, pb: 0.77 },
  'Williams %R': -22.11,
  'MFI(14)': 79.04,
  'OBV': 1077.08,
  'Stochastic %K': { k: 77.89, d: 76.26 },
  'ADX(14)': { adx: 57.96, pdi: 31.99, mdi: 8.59 },
  'CCI(20)': 84.47,
  'Awesome Oscillator': 1217.35,
  'Ichimoku Tenkan': { conversion: 113318.3, base: 112798.4, spanA: 113058.35, spanB: 112608 },
  'PSAR': 112896.20,
  'ROC(12)': 1.02,
  'TRIX(15)': 0.06,
  'Force Index': 14059.64,
  'Z-Score(20)': { o: 1.30, h: 1.02, l: 1.37, c: 1.08, v: -1.06 },
  'Multi-Divergence': { c: 113560.2, hasDivergence: false, divergence: [] },
  'VWAP': 111499.85,
  'Floor Pivots': { floor: { pivot: 113597.5, r1: 113656.2, r2: 113752.2, r3: 113810.9, s1: 113501.5, s2: 113442.8, s3: 113346.8 } },
  'Woodies Pivots': { woodies: { pivot: 113588.17, r1: 113637.55, r2: 113742.87, s1: 113482.85, s2: 113433.47 } },
  'EMA': { fast: 112976.16, medium: 112373.27, slow: 111436.04 },
  'SMA': { fastPeriod: 112878.75, mediumPeriod: 112102.87, slowPeriod: 111427.48 },
  'ZEMA(20)': 112976.16,
  'Wilders Smoothing': 112776.16,
  'WMA(20)': 113194.15,
  'ADL': 767
};

// Create screen
const screen = blessed.screen({
  smartCSR: true,
  title: 'CryptoDog Live Feed Demo'
});

// Create grid
const grid = new contrib.grid({rows: 12, cols: 12, screen: screen});

// Create table
const table = grid.set(0, 0, 10, 12, contrib.table, {
  keys: true,
  fg: 'white',
  selectedFg: 'white',
  selectedBg: 'blue',
  interactive: true,
  label: '📊 Live Indicators - BTCUSDT 1m (Demo)',
  width: '100%',
  height: '90%',
  border: {type: "line", fg: 'cyan'},
  columnSpacing: 2,
  columnWidth: [20, 15, 25, 20]
});

// Status bar
const statusBar = grid.set(10, 0, 2, 12, contrib.log, {
  fg: "green",
  selectedFg: "green",
  label: '📈 Status & Updates'
});

// Format data for table
function formatIndicatorData(indicators) {
  const rows = [];

  const formatValue = (value, key) => {
    if (typeof value === 'number') {
      if (key.includes('Volume') || key.includes('OBV') || key.includes('ADL')) {
        return value.toLocaleString();
      }
      return value.toFixed(key.includes('%') ? 2 : 4);
    }
    if (typeof value === 'object' && value !== null) {
      if (value.trend) return `${value.trend.toUpperCase()}`;
      if (value.MACD !== undefined) return `${value.MACD.toFixed(2)}`;
      if (value.upper !== undefined) return `${value.upper.toFixed(2)}`;
      if (value.k !== undefined) return `${value.k.toFixed(2)}`;
      if (value.adx !== undefined) return `${value.adx.toFixed(2)}`;
      if (value.pivot !== undefined) return `${value.pivot.toFixed(2)}`;
      return JSON.stringify(value).substring(0, 20) + '...';
    }
    return String(value);
  };

  Object.entries(indicators).forEach(([key, value]) => {
    let status = '🟢';
    let change = '→';

    if (key === 'RSI(14)') {
      const rsi = parseFloat(value);
      if (rsi > 70) status = '🔴';
      else if (rsi < 30) status = '🟢';
      else status = '🟡';
    } else if (key.includes('MACD')) {
      if (value && value.histogram !== undefined) {
        status = value.histogram > 0 ? '🟢' : '🔴';
      }
    } else if (key.includes('SuperTrend')) {
      if (value && value.trend) {
        status = value.trend === 'long' ? '🟢' : '🔴';
      }
    } else if (key.includes('ADX')) {
      if (value && value.adx !== undefined) {
        const adx = value.adx;
        if (adx > 25) status = '🟢';
        else if (adx < 20) status = '🔴';
        else status = '🟡';
      }
    }

    rows.push([
      key,
      formatValue(value, key),
      status,
      change
    ]);
  });

  return rows;
}

// Update table
function updateTable(indicators) {
  const tableData = {
    headers: ['📊 Indicator', '💰 Value', '📈 Status', '⚡ Change'],
    data: formatIndicatorData(indicators)
  };

  table.setData(tableData);
  screen.render();
}

// Initial data
updateTable(sampleIndicators);
statusBar.log('🚀 Demo loaded with sample indicator data');
statusBar.log('⌨️ Press q to quit, r to refresh');

// Key bindings
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  statusBar.log('👋 Goodbye!');
  setTimeout(() => {
    screen.destroy();
    process.exit(0);
  }, 500);
});

screen.key(['r'], function(ch, key) {
  statusBar.log('🔄 Refreshing data...');
  // Simulate data update
  setTimeout(() => {
    updateTable(sampleIndicators);
    statusBar.log('✅ Data refreshed');
  }, 1000);
});

// Render
screen.render();
console.log('Demo started! Press q to quit.');