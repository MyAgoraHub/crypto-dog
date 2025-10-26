import { CryptoDogWebSocketHandler } from "./clients/cryptoDogWebsocketHandler.js";
import {IndicatorList} from "./indicator/Indicators.js"
import {getInterval, getKlineCandles} from "./clients/cryptoDogRequestHandler.js"; 
import {createIndicatorData} from "././cryptoDogTools.js";
import blessed from 'blessed';
import contrib from 'blessed-contrib';
import chalk from 'chalk';

const wsHandler = new CryptoDogWebSocketHandler({
  testnet: false,  // or false for live
  throttleMs: 5000
});

export class CryptoDogLifeFeedAgent {
    constructor() {
        this.wsHandler = wsHandler;
        this.minLoadSize = 201;
        this.startTime = null;
        this.endTime = null;
        this.maxSize = 2000;
        this.klineData = [];

    }

    isKlineDataLoaded() {
        return this.klineData.length > 0;
    }

    isNewDataPoint(open, high, low, close, volume, timestamp) {
        // If no data loaded yet, this is definitely new
        if (!this.isKlineDataLoaded()) {
            return true;
        }
        
        const lastEntry = this.klineData[this.klineData.length - 1];
        const [lastTimestamp, lastOpen, lastHigh, lastLow, lastClose, lastVolume] = lastEntry;
        
        // Check if this is the same candle (same timestamp)
        const isSameTimestamp = lastTimestamp === timestamp;
        
        // Check if all OHLCV values are identical (duplicate data)
        const isIdenticalData = (
            lastOpen === open &&
            lastHigh === high &&
            lastLow === low &&
            lastClose === close &&
            lastVolume === volume
        );
        
        // It's new data if it's NOT the same timestamp AND NOT identical data
        return !isSameTimestamp && !isIdenticalData;
    }

    loadData(open, close, high, low, volume, timestamp, start, end) {
        let currentDate = new Date();
        let addNewCandle = new Date(end) <= currentDate;
        if (addNewCandle) {
            this.klineData.push([timestamp, open, high, low, close, volume]);
        } else  {
            // we only need to update buffer if we are adding the last entry
            if(this.isNewDataPoint(open, high, low, close, volume, timestamp)) {
                this.klineData[this.klineData.length - 1] = [timestamp, open, high, low, close, volume];
            }
           
        }
        this.trimDataBuffer();
    }

    trimDataBuffer() {
        // Trim data arrays to maintain only the latest maxSize entries
        if (this.klineData.length <= this.maxSize) return;
        this.klineData = this.klineData.slice(this.klineData.length - this.maxSize);
    }

    processData () {
        let {o,h,l,c,v, buffer } = createIndicatorData(this.klineData);
        
        // Technical Indicators
        let rsi = IndicatorList.getIndicator("RsiIndicator")(o,h,l,c,v, {period:14}, buffer);
        let macd = IndicatorList.getIndicator("MacdIndicator")(o,h,l,c,v, {fastPeriod:12, slowPeriod:26, signalPeriod:9}, buffer);
        let superTrend = IndicatorList.getIndicator("SuperTrendIndicator")(o,h,l,c,v, {period:10, multiplier:3}, buffer);
        let floorPivots = IndicatorList.getIndicator("FloorPivots")(o,h,l,c,v, {}, buffer);
        let woodies = IndicatorList.getIndicator("Woodies")(o,h,l,c,v, {}, buffer);
        let sma = IndicatorList.getIndicator("SmaIndicator")(o,h,l,c,v, {period:20}, buffer);
        let atr = IndicatorList.getIndicator("AtrIndicator")(o,h,l,c,v, {period:14}, buffer);
        let bollinger = IndicatorList.getIndicator("BollingerIndicator")(o,h,l,c,v, {period:20, stdDev:2}, buffer);
        let williamsR = IndicatorList.getIndicator("WilliamsRIndicator")(o,h,l,c,v, {period:14}, buffer);
        let mfi = IndicatorList.getIndicator("MfiIndicator")(o,h,l,c,v, {period:14}, buffer);
        let obv = IndicatorList.getIndicator("ObvIndicator")(o,h,l,c,v, {}, buffer);
        
        // Moving Averages
    
        let emaFast = IndicatorList.getIndicator("EMAIndicator")(o,h,l,c,v, {period:20}, buffer);
        let emaMedium = IndicatorList.getIndicator("EMAIndicator")(o,h,l,c,v, {period:50}, buffer);
        let emaSlow = IndicatorList.getIndicator("EMAIndicator")(o,h,l,c,v, {period:200}, buffer);
        let smaFast = IndicatorList.getIndicator("SmaIndicator")(o,h,l,c,v, {period:20}, buffer);
        let smaMed = IndicatorList.getIndicator("SmaIndicator")(o,h,l,c,v, {period:50}, buffer);
        let smaSlow = IndicatorList.getIndicator("SmaIndicator")(o,h,l,c,v, {period:200}, buffer);
        let zema = IndicatorList.getIndicator("ZEMAIndicator")(o,h,l,c,v, {period:20}, buffer);
        let wilders = IndicatorList.getIndicator("WildersSmoothingWeighteMovingAvg")(o,h,l,c,v, {period:14}, buffer);
        let wma = IndicatorList.getIndicator("WeighteMovingAvg")(o,h,l,c,v, {period:20}, buffer);
        
        // Volume Indicators
        let adl = IndicatorList.getIndicator("AdlIndicator")(o,h,l,c,v, {}, buffer);
        let volumeProfile = IndicatorList.getIndicator("VolumeProfile")(o,h,l,c,v, {}, buffer);
        let volumeWeightedAvgPrice = IndicatorList.getIndicator("VolumeWeightedAvgPrice")(o,h,l,c,v, {}, buffer);
        
        // Oscillators
        let adx = IndicatorList.getIndicator("AdxIndicator")(o,h,l,c,v, {period:14}, buffer);
        let awesomeOscillator = IndicatorList.getIndicator("AwesomeOscillatorIndicator")(o,h,l,c,v, {}, buffer);
        let cci = IndicatorList.getIndicator("CciIndicator")(o,h,l,c,v, {period:20}, buffer);
        let stochastic = IndicatorList.getIndicator("StochasticIndicator")(o,h,l,c,v, {kPeriod:14, dPeriod:3}, buffer);
        
        // Advanced Indicators
        let ichimoku = IndicatorList.getIndicator("IchimokuCloudIndicator")(o,h,l,c,v, {}, buffer);
        let trix = IndicatorList.getIndicator("TrixIndicator")(o,h,l,c,v, {period:15}, buffer);
        let forceIndex = IndicatorList.getIndicator("ForceIndexIndiactor")(o,h,l,c,v, {period:13}, buffer);
        let roc = IndicatorList.getIndicator("RocIndicator")(o,h,l,c,v, {period:12}, buffer);
        let psar = IndicatorList.getIndicator("PsarIndicator")(o,h,l,c,v, {acceleration:0.02, maxAcceleration:0.2}, buffer);
        
        // Statistical Indicators
        let zScore = IndicatorList.getIndicator("ZScore")(o,h,l,c,v, {period:20}, buffer);
        let multiDivergence = IndicatorList.getIndicator("MultiDivergenceDetector")(o,h,l,c,v, {}, buffer);
        let dynamicGrid = IndicatorList.getIndicator("DynamicGridSignals")(o,h,l,c,v, {}, buffer);
        let supportResistance = IndicatorList.getIndicator("SupportAndResistance")(o,h,l,c,v, {}, buffer);
        
        // Log latest values for key indicators
        console.log('📊 Latest Indicator Values:');
        console.log('RSI(14):', rsi.pop());
        console.log('MACD:', macd.pop());
        console.log('SuperTrend:', superTrend.pop());
         console.log('ATR(14):', atr.pop());
        console.log('Bollinger Upper:', bollinger.pop());
        console.log('Williams %R:', williamsR.pop());
        console.log('MFI(14):', mfi.pop());
        console.log('OBV:', obv.pop());
        console.log('Stochastic %K:', stochastic.pop(), '%D:', stochastic.pop());
        console.log('ADX(14):', adx.pop());
        console.log('CCI(20):', cci.pop());
        console.log('Awesome Oscillator:', awesomeOscillator.pop());
        console.log('Ichimoku Tenkan:', ichimoku.pop());
        console.log('PSAR:', psar.pop());
        console.log('ROC(12):', roc.pop());
        console.log('TRIX(15):', trix.pop());
        console.log('Force Index:', forceIndex.pop());
        console.log('Z-Score(20):',{o:zScore.o.pop(), h:zScore.h.pop(), l:zScore.l.pop(), c:zScore.c.pop(), v:zScore.v.pop()});
        console.log('Multi-Divergence:', multiDivergence.pop());
        console.log('Dynamic Grid:', dynamicGrid.pop());
        console.log('Support/Resistance:', supportResistance.pop());
        console.log('Volume Profile:', volumeProfile.pop());
        console.log('VWAP:', volumeWeightedAvgPrice.pop());
        console.log('Floor Pivots:', floorPivots.pop());
        console.log('Woodies Pivots:', woodies.pop());
        console.log("EMA:", {fast: emaFast.pop(), medium: emaMedium.pop(), slow: emaSlow.pop()})
        console.log('SMA:', {fastPeriod: smaFast.pop(), mediumPeriod: smaMed.pop(), slowPeriod: smaSlow.pop()});
        console.log('ZEMA(20):', zema.pop());
        console.log('Wilders Smoothing:', wilders.pop());
        console.log('WMA(20):', wma.pop());
        console.log('ADL:', adl.pop());
        console.log('---');
    }

    async startRealTimeKlineFeed(interval, symbol) {
        let ohlcv = await getKlineCandles("spot", symbol, getInterval(interval).value, null, null, this.minLoadSize);
        // may have to reverse here we adding in incorrect order
        this.klineData = ohlcv.result.list.reverse();
        
        // Suppress all console output during WebSocket setup to prevent dashboard corruption
        const originalConsoleLog = console.log;
        const originalConsoleWarn = console.warn;
        const originalConsoleError = console.error;
        const originalConsoleInfo = console.info;
        
        console.log = () => {};
        console.warn = () => {};
        console.error = () => {};
        console.info = () => {};
        
        // Also suppress stdout writes that might come from the library
        const originalStdoutWrite = process.stdout.write;
        process.stdout.write = () => {};
        
        this.wsHandler.subscribeToTopics([`kline.${ getInterval(interval).value}.${symbol}`], 'spot');
        
        // Restore console methods after connection is established
        setTimeout(() => {
            console.log = originalConsoleLog;
            console.warn = originalConsoleWarn;
            console.error = originalConsoleError;
            console.info = originalConsoleInfo;
            process.stdout.write = originalStdoutWrite;
        }, 3000); // Keep suppressed for 3 seconds to ensure connection is stable
        
        // Suppress WebSocket connection logging to avoid messing up the dashboard
        this.wsHandler.onOpen(() => {
            // Connection established
        });
        
        this.wsHandler.onUpdate((update) => {
            try {
                let {open, close, high, low, volume, timestamp, start, end} = update.data[0];

                // Validate timestamp
                if (!timestamp || isNaN(timestamp)) {
                    console.error('Invalid timestamp received:', timestamp);
                    return;
                }
                // Convert timestamp to number if it's a string
                timestamp = Number(timestamp);
                 this.loadData(open, close, high, low, volume, timestamp, start, end);
                 this.processData();
            } catch (error) {
                console.error('Error processing WebSocket data:', error);
                console.error('Data received:', update);
            }
        });

        this.wsHandler.onException((err) => {
            console.error('WebSocket error:', err);
        });
    }
}

export const startRealTimeKlineFeed = (interval, symbol) => {
    const agent = new CryptoDogLifeFeedAgent();
    agent.startRealTimeKlineFeed(interval, symbol);
}

export async function startLiveFeed(symbol = 'BTCUSDT', interval = '1m', theme = 'dark') {
  const screen = blessed.screen({
    smartCSR: true,
    title: `CryptoDog Live Feed - ${symbol} ${interval}`
  });

  // Create grid layout - simplified for Termux compatibility, using log windows
  const grid = new contrib.grid({rows: 12, cols: 12, screen: screen});

  // Price Display at top - simple log
  const priceLog = grid.set(0, 0, 2, 12, contrib.log, {
    fg: theme === 'dark' ? 'green' : 'black',
    selectedFg: 'green',
    label: `${symbol} Price`,
    border: {type: "line", fg: theme === 'dark' ? 'cyan' : 'blue'}
  });

  // Oscillators Log - shows oscillator indicators
  const oscillatorsLog = grid.set(2, 0, 3, 12, contrib.log, {
    fg: theme === 'dark' ? 'white' : 'black',
    selectedFg: 'white',
    label: `Oscillators`,
    border: {type: "line", fg: theme === 'dark' ? 'cyan' : 'blue'}
  });

  // Trend Indicators Log - shows trend indicators
  const trendLog = grid.set(5, 0, 3, 12, contrib.log, {
    fg: theme === 'dark' ? 'white' : 'black',
    selectedFg: 'white',
    label: `Trend Indicators`,
    border: {type: "line", fg: theme === 'dark' ? 'cyan' : 'blue'}
  });

  // Moving Averages & Advanced Log - shows MAs and advanced indicators
  const maLog = grid.set(8, 0, 2, 12, contrib.log, {
    fg: theme === 'dark' ? 'white' : 'black',
    selectedFg: 'white',
    label: `MAs & Advanced`,
    border: {type: "line", fg: theme === 'dark' ? 'cyan' : 'blue'}
  });

  // Status bar at bottom - full width
  const statusBar = grid.set(10, 0, 2, 12, contrib.log, {
    fg: "green",
    selectedFg: "green",
    label: 'Status & Updates'
  });

  // Initialize log data
  let priceData = 'Current Price: Loading...\n';
  let oscillatorsData = '';
  let trendData = '';
  let maData = '';

  // Function to format indicator values intelligently
  function formatIndicatorValue(value, key) {
    if (value === 'N/A' || value === null || value === undefined) return 'N/A';

    if (typeof value === 'number') {
      if (key.includes('%') || key.includes('ROC') || key.includes('TRIX')) {
        return value.toFixed(2);
      }
      if (key.includes('Volume') || key.includes('OBV') || key.includes('ADL')) {
        return value.toLocaleString();
      }
      return value.toFixed(key.includes('ATR') ? 2 : 2);
    }

    if (typeof value === 'object' && value !== null) {
      // Handle specific indicator types
      if (key.includes('MACD')) {
        return value.MACD ? `${value.MACD.toFixed(2)}` : 'N/A';
      }
      if (key.includes('SuperTrend')) {
        return value.trend ? `${value.trend.toUpperCase()}` : 'N/A';
      }
      if (key.includes('Bollinger')) {
        return value.upper ? `${value.upper.toFixed(2)}` : 'N/A';
      }
      if (key.includes('Stochastic')) {
        return value.k ? `${value.k.toFixed(2)}` : 'N/A';
      }
      if (key.includes('ADX')) {
        return value.adx ? `${value.adx.toFixed(2)}` : 'N/A';
      }
      if (key.includes('Ichimoku')) {
        return value.conversion ? `${value.conversion.toFixed(2)}` : 'N/A';
      }
      if (key.includes('Floor Pivots') || key.includes('Woodies')) {
        return value.floor?.pivot ? `${value.floor.pivot.toFixed(2)}` :
               value.woodies?.pivot ? `${value.woodies.pivot.toFixed(2)}` : 'N/A';
      }
      if (key.includes('EMA') || key.includes('SMA')) {
        if (key.includes('Fast')) return value.fast ? `${value.fast.toFixed(2)}` : 'N/A';
        if (key.includes('Medium')) return value.medium ? `${value.medium.toFixed(2)}` : 'N/A';
        if (key.includes('Slow')) return value.slow ? `${value.slow.toFixed(2)}` : 'N/A';
        return value.fastPeriod ? `${value.fastPeriod.toFixed(2)}` : 'N/A';
      }
      if (key.includes('Z-Score')) {
        return value.c ? `${value.c.toFixed(3)}` : 'N/A';
      }
      if (key.includes('Multi-Divergence')) {
        return value.hasDivergence ? 'DIVERGENCE' : 'NORMAL';
      }
      if (key.includes('Volume Profile')) {
        return value.totalVolume ? `${value.totalVolume.toFixed(0)}` : 'N/A';
      }
      if (key.includes('Support/Resistance')) {
        return value.level ? `${value.level.toFixed(2)}` : 'N/A';
      }
      if (key.includes('Dynamic Grid')) {
        return value.grid ? `${value.grid.length} levels` : 'N/A';
      }
    }

    return String(value).substring(0, 8);
  }

  // Function to determine status emoji
  function getStatusEmoji(value, key) {
    if (value === 'N/A') return chalk.yellow('○');

    if (key === 'RSI(14)') {
      const rsi = parseFloat(value);
      if (rsi > 70) return chalk.red('▼');
      if (rsi < 30) return chalk.green('▲');
      return chalk.yellow('~');
    }

    if (key.includes('MACD')) {
      if (typeof value === 'object' && value.histogram !== undefined) {
        return value.histogram > 0 ? chalk.green('▲') : chalk.red('▼');
      }
    }

    if (key.includes('SuperTrend')) {
      if (typeof value === 'object' && value.trend) {
        return value.trend === 'long' ? chalk.green('▲') : chalk.red('▼');
      }
    }

    if (key.includes('ADX')) {
      if (typeof value === 'object' && value.adx !== undefined) {
        const adx = value.adx;
        if (adx > 25) return chalk.green('▲');
        if (adx < 20) return chalk.red('▼');
        return chalk.yellow('~');
      }
    }

    if (key.includes('Williams %R')) {
      const williams = parseFloat(value);
      if (williams > -20) return chalk.red('▼');
      if (williams < -80) return chalk.green('▲');
      return chalk.yellow('~');
    }

    if (key.includes('Stochastic')) {
      if (typeof value === 'object' && value.k !== undefined) {
        const k = value.k;
        if (k > 80) return chalk.red('▼');
        if (k < 20) return chalk.green('▲');
        return chalk.yellow('~');
      }
    }

    if (key.includes('CCI')) {
      const cci = parseFloat(value);
      if (cci > 100) return chalk.red('▼');
      if (cci < -100) return chalk.green('▲');
      return chalk.yellow('~');
    }

    if (key.includes('MFI')) {
      const mfi = parseFloat(value);
      if (mfi > 80) return chalk.red('▼');
      if (mfi < 20) return chalk.green('▲');
      return chalk.yellow('~');
    }

    return chalk.yellow('○');
  }

  // Update dashboard function
  function updateDashboard(indicators, currentPrice, previousPrice) {
    // Update price log
    priceLog.setContent(''); // Clear previous content
    if (currentPrice && !isNaN(currentPrice)) {
      // Determine color based on price change
      let priceColor = chalk.green; // Default to green
      if (previousPrice !== null && !isNaN(previousPrice)) {
        if (currentPrice > previousPrice) {
          priceColor = chalk.green;
        } else if (currentPrice < previousPrice) {
          priceColor = chalk.red;
        } else {
          priceColor = chalk.yellow; // Same price
        }
      }
      
      const priceText = priceColor(`PRICE: $${currentPrice.toFixed(2)}`);
      priceLog.log(priceText);
    } else {
      priceLog.log('PRICE: Loading...');
    }

    // Clear and update oscillator indicators
    oscillatorsLog.setContent('');
    oscillatorsLog.log('Oscillators:');
    oscillatorsLog.log('─'.repeat(50));

    // Clear and update trend indicators
    trendLog.setContent('');
    trendLog.log('Trend Indicators:');
    trendLog.log('─'.repeat(50));

    // Clear and update MA/advanced indicators
    maLog.setContent('');
    maLog.log('MAs & Advanced:');
    maLog.log('─'.repeat(50));

    // Categorize and log indicators
    Object.entries(indicators).forEach(([key, value]) => {
      const formattedValue = formatIndicatorValue(value, key);
      const status = getStatusEmoji(value, key);
      const line = `${status}  ${key}: ${formattedValue}`;

      // Categorize indicators into appropriate logs
      if (['RSI(14)', 'Stochastic', 'Williams %R', 'CCI(20)', 'MFI(14)', 'Awesome Oscillator'].includes(key)) {
        oscillatorsLog.log(line);
      } else if (['MACD', 'SuperTrend', 'ADX(14)', 'ATR(14)', 'PSAR', 'ROC(12)', 'TRIX(15)', 'Force Index'].includes(key)) {
        trendLog.log(line);
      } else {
        // All other indicators go to MA/Advanced log
        maLog.log(line);
      }
    });

    screen.render();
  }

  // Initial empty dashboard
  updateDashboard({}, 0, null);

  // Status updates
  statusBar.log(`STARTING live feed for ${symbol} ${interval}`);
  statusBar.log(`THEME: ${theme}`);
  statusBar.log(`CONNECTING to data stream...`);

  // Key bindings
  screen.key(['escape', 'q', 'C-c'], function(ch, key) {
    statusBar.log('SHUTTING DOWN live feed...');
    setTimeout(() => {
      screen.destroy();
      process.exit(0);
    }, 1000);
  });

  screen.key(['r'], function(ch, key) {
    statusBar.log('REFRESHING data...');
    // Trigger data refresh
  });

  // Start the real-time feed
  try {
    // Create a custom agent that extends the original
    class LiveFeedAgent extends CryptoDogLifeFeedAgent {
      constructor(updateCallback) {
        super();
        this.updateCallback = updateCallback;
        this.currentPrice = 0;
        this.previousPrice = null;
      }

      processData() {
        // Do all the indicator calculations (copied from parent)
        let {o,h,l,c,v, buffer } = createIndicatorData(this.klineData);
        
        // Update current price from latest candle
        if (c.length > 0) {
          this.previousPrice = this.currentPrice; // Store previous price
          this.currentPrice = c[c.length - 1];
        }
        
        // Technical Indicators
        let rsi = IndicatorList.getIndicator("RsiIndicator")(o,h,l,c,v, {period:14}, buffer);
        let macd = IndicatorList.getIndicator("MacdIndicator")(o,h,l,c,v, {fastPeriod:12, slowPeriod:26, signalPeriod:9}, buffer);
        let superTrend = IndicatorList.getIndicator("SuperTrendIndicator")(o,h,l,c,v, {period:10, multiplier:3}, buffer);
        let floorPivots = IndicatorList.getIndicator("FloorPivots")(o,h,l,c,v, {}, buffer);
        let woodies = IndicatorList.getIndicator("Woodies")(o,h,l,c,v, {}, buffer);
        let sma = IndicatorList.getIndicator("SmaIndicator")(o,h,l,c,v, {period:20}, buffer);
        let atr = IndicatorList.getIndicator("AtrIndicator")(o,h,l,c,v, {period:14}, buffer);
        let bollinger = IndicatorList.getIndicator("BollingerIndicator")(o,h,l,c,v, {period:20, stdDev:2}, buffer);
        let williamsR = IndicatorList.getIndicator("WilliamsRIndicator")(o,h,l,c,v, {period:14}, buffer);
        let mfi = IndicatorList.getIndicator("MfiIndicator")(o,h,l,c,v, {period:14}, buffer);
        let obv = IndicatorList.getIndicator("ObvIndicator")(o,h,l,c,v, {}, buffer);
        
        // Moving Averages
        let emaFast = IndicatorList.getIndicator("EMAIndicator")(o,h,l,c,v, {period:20}, buffer);
        let emaMedium = IndicatorList.getIndicator("EMAIndicator")(o,h,l,c,v, {period:50}, buffer);
        let emaSlow = IndicatorList.getIndicator("EMAIndicator")(o,h,l,c,v, {period:200}, buffer);
        let smaFast = IndicatorList.getIndicator("SmaIndicator")(o,h,l,c,v, {period:20}, buffer);
        let smaMed = IndicatorList.getIndicator("SmaIndicator")(o,h,l,c,v, {period:50}, buffer);
        let smaSlow = IndicatorList.getIndicator("SmaIndicator")(o,h,l,c,v, {period:200}, buffer);
        let zema = IndicatorList.getIndicator("ZEMAIndicator")(o,h,l,c,v, {period:20}, buffer);
        let wilders = IndicatorList.getIndicator("WildersSmoothingWeighteMovingAvg")(o,h,l,c,v, {period:14}, buffer);
        let wma = IndicatorList.getIndicator("WeighteMovingAvg")(o,h,l,c,v, {period:20}, buffer);
        
        // Volume Indicators
        let adl = IndicatorList.getIndicator("AdlIndicator")(o,h,l,c,v, {}, buffer);
        let volumeProfile = IndicatorList.getIndicator("VolumeProfile")(o,h,l,c,v, {}, buffer);
        let volumeWeightedAvgPrice = IndicatorList.getIndicator("VolumeWeightedAvgPrice")(o,h,l,c,v, {}, buffer);
        
        // Oscillators
        let adx = IndicatorList.getIndicator("AdxIndicator")(o,h,l,c,v, {period:14}, buffer);
        let awesomeOscillator = IndicatorList.getIndicator("AwesomeOscillatorIndicator")(o,h,l,c,v, {}, buffer);
        let cci = IndicatorList.getIndicator("CciIndicator")(o,h,l,c,v, {period:20}, buffer);
        let stochastic = IndicatorList.getIndicator("StochasticIndicator")(o,h,l,c,v, {kPeriod:14, dPeriod:3}, buffer);
        
        // Advanced Indicators
        let ichimoku = IndicatorList.getIndicator("IchimokuCloudIndicator")(o,h,l,c,v, {}, buffer);
        let trix = IndicatorList.getIndicator("TrixIndicator")(o,h,l,c,v, {period:15}, buffer);
        let forceIndex = IndicatorList.getIndicator("ForceIndexIndiactor")(o,h,l,c,v, {period:13}, buffer);
        let roc = IndicatorList.getIndicator("RocIndicator")(o,h,l,c,v, {period:12}, buffer);
        let psar = IndicatorList.getIndicator("PsarIndicator")(o,h,l,c,v, {acceleration:0.02, maxAcceleration:0.2}, buffer);
        
        // Statistical Indicators
        let zScore = IndicatorList.getIndicator("ZScore")(o,h,l,c,v, {period:20}, buffer);
        let multiDivergence = IndicatorList.getIndicator("MultiDivergenceDetector")(o,h,l,c,v, {}, buffer);
        let dynamicGrid = IndicatorList.getIndicator("DynamicGridSignals")(o,h,l,c,v, {}, buffer);
        let supportResistance = IndicatorList.getIndicator("SupportAndResistance")(o,h,l,c,v, {}, buffer);

        // Collect latest values for dashboard (no console logging)
        const indicators = {
          'RSI(14)': rsi.length > 0 ? rsi[rsi.length - 1] : 'N/A',
          'MACD': macd.length > 0 ? macd[macd.length - 1] : 'N/A',
          'SuperTrend': superTrend.length > 0 ? superTrend[superTrend.length - 1] : 'N/A',
          'ATR(14)': atr.length > 0 ? atr[atr.length - 1] : 'N/A',
          'Bollinger Upper': bollinger.length > 0 ? bollinger[bollinger.length - 1] : 'N/A',
          'Williams %R': williamsR.length > 0 ? williamsR[williamsR.length - 1] : 'N/A',
          'MFI(14)': mfi.length > 0 ? mfi[mfi.length - 1] : 'N/A',
          'OBV': obv.length > 0 ? obv[obv.length - 1] : 'N/A',
          'Stochastic': stochastic.length > 0 ? stochastic[stochastic.length - 1] : 'N/A',
          'ADX(14)': adx.length > 0 ? adx[adx.length - 1] : 'N/A',
          'CCI(20)': cci.length > 0 ? cci[cci.length - 1] : 'N/A',
          'Awesome Oscillator': awesomeOscillator.length > 0 ? awesomeOscillator[awesomeOscillator.length - 1] : 'N/A',
          'Ichimoku Tenkan': ichimoku.length > 0 ? ichimoku[ichimoku.length - 1] : 'N/A',
          'PSAR': psar.length > 0 ? psar[psar.length - 1] : 'N/A',
          'ROC(12)': roc.length > 0 ? roc[roc.length - 1] : 'N/A',
          'TRIX(15)': trix.length > 0 ? trix[trix.length - 1] : 'N/A',
          'Force Index': forceIndex.length > 0 ? forceIndex[forceIndex.length - 1] : 'N/A',
          'Z-Score(20)': zScore && zScore.c && zScore.c.length > 0 ? zScore.c[zScore.c.length - 1] : 'N/A',
          'Multi-Divergence': multiDivergence.length > 0 ? multiDivergence[multiDivergence.length - 1] : 'N/A',
          'Dynamic Grid': dynamicGrid.length > 0 ? dynamicGrid[dynamicGrid.length - 1] : 'N/A',
          'Support/Resistance': supportResistance.length > 0 ? supportResistance[supportResistance.length - 1] : 'N/A',
          'Volume Profile': volumeProfile.length > 0 ? volumeProfile[volumeProfile.length - 1] : 'N/A',
          'VWAP': volumeWeightedAvgPrice.length > 0 ? volumeWeightedAvgPrice[volumeWeightedAvgPrice.length - 1] : 'N/A',
          'Floor Pivots': floorPivots.length > 0 ? floorPivots[floorPivots.length - 1] : 'N/A',
          'Woodies Pivots': woodies.length > 0 ? woodies[woodies.length - 1] : 'N/A',
          'EMA Fast(20)': emaFast.length > 0 ? emaFast[emaFast.length - 1] : 'N/A',
          'EMA Medium(50)': emaMedium.length > 0 ? emaMedium[emaMedium.length - 1] : 'N/A',
          'EMA Slow(200)': emaSlow.length > 0 ? emaSlow[emaSlow.length - 1] : 'N/A',
          'SMA Fast(20)': smaFast.length > 0 ? smaFast[smaFast.length - 1] : 'N/A',
          'SMA Medium(50)': smaMed.length > 0 ? smaMed[smaMed.length - 1] : 'N/A',
          'SMA Slow(200)': smaSlow.length > 0 ? smaSlow[smaSlow.length - 1] : 'N/A',
          'ZEMA(20)': zema.length > 0 ? zema[zema.length - 1] : 'N/A',
          'Wilders Smoothing': wilders.length > 0 ? wilders[wilders.length - 1] : 'N/A',
          'WMA(20)': wma.length > 0 ? wma[wma.length - 1] : 'N/A',
          'ADL': adl.length > 0 ? adl[adl.length - 1] : 'N/A'
        };

        // Update the dashboard
        if (this.updateCallback) {
          this.updateCallback(indicators, this.currentPrice, this.previousPrice);
        }

        // Update status bar
        const timestamp = new Date().toLocaleTimeString();
        statusBar.log(`UPDATED at ${timestamp}`);
      }
    }

    const agent = new LiveFeedAgent(updateDashboard);

    // Start the feed
    await agent.startRealTimeKlineFeed(interval, symbol);

  } catch (error) {
    statusBar.log(`ERROR: ${error.message}`);
    screen.render();
  }
}



