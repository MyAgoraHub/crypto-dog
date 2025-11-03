import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { RestClientV5 } from 'bybit-api';
import { 
  getKlineCandles, 
  getTickers, 
  getOrderBook,
  getIntervals
} from './core/clients/cryptoDogRequestHandler.js';
import { 
  getAllSignals, 
  getActiveSignals, 
  saveSignal, 
  updateSignal, 
  deleteSignal,
  getSignalById 
} from './core/repository/dbManager.js';
import { backtestSignal } from './core/cryptoDogBacktest.js';
import {
  rsiMarketData,
  superTrendMarketData,
  macdMarketData,
  bollingerMarketData,
  emaMarketData,
  smaMarketData,
  atrMarketData,
  stochasticMarketData,
  williamsRMarketData,
  cciMarketData,
  adxMarketData,
  mfiMarketData,
  multiDivergenceDetectorMarketData,
  emaMultiPeriodMarketData,
  smaMultiPeriodMarketData,
  ichimokuCloudMarketData
} from './core/indicator/impl/indicatorManager.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Get intervals
app.get('/api/intervals', (req, res) => {
  res.json(getIntervals());
});

// Get symbols list
app.get('/api/symbols', async (req, res) => {
  try {
    const { category = 'spot' } = req.query;
    const data = await getTickers(category);
    res.json(data);
  } catch (error) {
    console.error('Error fetching symbols:', error);
    res.status(500).json({ error: 'Failed to fetch symbols' });
  }
});

// Get ticker data
app.get('/api/tickers', async (req, res) => {
  try {
    const { category = 'spot', symbol = 'BTCUSDT' } = req.query;
    const data = await getTickers(category, symbol);
    res.json(data);
  } catch (error) {
    console.error('Error fetching ticker:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get candle data
app.get('/api/candles', async (req, res) => {
  try {
    const { 
      category = 'spot', 
      symbol = 'BTCUSDT', 
      interval = '15', 
      limit = 50 
    } = req.query;
    
    const data = await getKlineCandles(
      category, 
      symbol, 
      interval, 
      null, // start
      null, // end
      parseInt(limit)
    );
    res.json(data);
  } catch (error) {
    console.error('Error fetching candles:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get order book
app.get('/api/orderbook', async (req, res) => {
  try {
    const { category = 'spot', symbol = 'BTCUSDT', limit = 25 } = req.query;
    const data = await getOrderBook(category, symbol, parseInt(limit));
    res.json(data);
  } catch (error) {
    console.error('Error fetching order book:', error);
    res.status(500).json({ error: error.message });
  }
});

// Indicator map
const indicatorMap = {
  rsi: rsiMarketData,
  supertrend: superTrendMarketData,
  sma: smaMarketData,
  ema: emaMarketData,
  macd: macdMarketData,
  bollinger: bollingerMarketData,
  atr: atrMarketData,
  stochastic: stochasticMarketData,
  williamsr: williamsRMarketData,
  cci: cciMarketData,
  adx: adxMarketData,
  ichimoku: ichimokuCloudMarketData,
  mfi: mfiMarketData,
  multidivergence: multiDivergenceDetectorMarketData,
  emamulti: emaMultiPeriodMarketData,
  smamulti: smaMultiPeriodMarketData
};

// Get indicator data
app.get('/api/indicator/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { 
      category = 'spot', 
      symbol = 'BTCUSDT', 
      interval = '15',
      iterations = 5,
      candles = 200
    } = req.query;

    const indicatorFunc = indicatorMap[name.toLowerCase()];
    if (!indicatorFunc) {
      return res.status(404).json({ error: `Indicator '${name}' not found` });
    }

    const data = await indicatorFunc(
      category, 
      symbol, 
      interval, 
      parseInt(iterations), 
      parseInt(candles)
    );
    
    res.json(data);
  } catch (error) {
    console.error(`Error fetching ${req.params.name} indicator:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Get multiple indicators at once
app.post('/api/indicators/batch', async (req, res) => {
  try {
    const { indicators = [] } = req.body;

    const results = await Promise.allSettled(
      indicators.map(async (indicator) => {
        // Support both string array format and object array format
        let indicatorName, category, symbol, interval, iterations, candles, forceRefresh;
        
        if (typeof indicator === 'string') {
          // Old format: simple string array with shared parameters
          indicatorName = indicator;
          category = req.body.category || 'spot';
          symbol = req.body.symbol || 'BTCUSDT';
          interval = req.body.interval || '15';
          iterations = req.body.iterations || 5;
          candles = req.body.candles || 200;
          forceRefresh = req.body.forceRefresh || false;
        } else {
          // New format: each indicator has its own parameters
          indicatorName = indicator.name;
          category = indicator.category || 'spot';
          symbol = indicator.symbol || 'BTCUSDT';
          interval = indicator.interval || '15';
          iterations = indicator.limit || indicator.iterations || 5;
          candles = indicator.candles || 200;
          forceRefresh = indicator.forceRefresh || false;
        }

        // Clear cache if force refresh is requested
        if (forceRefresh) {
          clearCache(category, symbol, interval);
        }

        const indicatorFunc = indicatorMap[indicatorName.toLowerCase()];
        if (!indicatorFunc) {
          throw new Error(`Indicator '${indicatorName}' not found`);
        }
        return indicatorFunc(category, symbol, interval, parseInt(iterations), parseInt(candles));
      })
    );

    const data = results.map((result, index) => ({
      indicator: typeof indicators[index] === 'string' ? indicators[index] : indicators[index].name,
      status: result.status,
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason.message : null
    }));

    res.json({ results: data });
  } catch (error) {
    console.error('Error fetching batch indicators:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get available indicators
app.get('/api/indicators', (req, res) => {
  res.json({
    indicators: Object.keys(indicatorMap).map(key => ({
      id: key,
      name: key.toUpperCase(),
      available: true
    }))
  });
});

// Cache management endpoints
app.get('/api/cache/stats', (req, res) => {
  res.json(getCacheStats());
});

app.delete('/api/cache', (req, res) => {
  const { category, symbol, interval } = req.query;
  clearCache(category, symbol, interval);
  res.json({ success: true, message: 'Cache cleared' });
});

// Signal Management Endpoints
app.get('/api/signals', async (req, res) => {
  try {
    const signals = await getAllSignals();
    res.json({ success: true, signals });
  } catch (error) {
    console.error('Error fetching signals:', error);
    res.status(500).json({ error: 'Failed to fetch signals' });
  }
});

app.get('/api/signals/active', async (req, res) => {
  try {
    const signals = await getActiveSignals();
    res.json({ success: true, signals });
  } catch (error) {
    console.error('Error fetching active signals:', error);
    res.status(500).json({ error: 'Failed to fetch active signals' });
  }
});

app.get('/api/signals/triggered', async (req, res) => {
  try {
    const allSignals = await getAllSignals();
    const triggeredSignals = allSignals.filter(s => s.triggerCount > 0);
    console.log('Total signals:', allSignals.length);
    console.log('Triggered signals (triggerCount > 0):', triggeredSignals.length);
    console.log('Triggered signal IDs:', triggeredSignals.map(s => ({ id: s.id, triggerCount: s.triggerCount })));
    res.json({ success: true, signals: triggeredSignals });
  } catch (error) {
    console.error('Error fetching triggered signals:', error);
    res.status(500).json({ error: 'Failed to fetch triggered signals' });
  }
});

app.get('/api/signals/:id', async (req, res) => {
  try {
    const signal = getSignalById(req.params.id);
    if (!signal) {
      return res.status(404).json({ error: 'Signal not found' });
    }
    res.json({ success: true, signal });
  } catch (error) {
    console.error('Error fetching signal:', error);
    res.status(500).json({ error: 'Failed to fetch signal' });
  }
});

app.post('/api/signals', async (req, res) => {
  try {
    const signal = req.body;
    await saveSignal(signal);
    res.json({ success: true, message: 'Signal created', signal });
  } catch (error) {
    console.error('Error creating signal:', error);
    res.status(500).json({ error: 'Failed to create signal' });
  }
});

app.put('/api/signals/:id', async (req, res) => {
  try {
    const updatedSignal = req.body;
    await updateSignal(updatedSignal);
    res.json({ success: true, message: 'Signal updated', signal: updatedSignal });
  } catch (error) {
    console.error('Error updating signal:', error);
    res.status(500).json({ error: 'Failed to update signal' });
  }
});

app.delete('/api/signals/:id', async (req, res) => {
  try {
    await deleteSignal(req.params.id);
    res.json({ success: true, message: 'Signal deleted' });
  } catch (error) {
    console.error('Error deleting signal:', error);
    res.status(500).json({ error: 'Failed to delete signal' });
  }
});

// Backtest endpoint
app.post('/api/backtest', async (req, res) => {
  try {
    const {
      symbol,
      timeframe,
      signalType,
      indicator,
      value,
      iterations = 10,
      candles = 200,
      risk = 2,
      reward = 5,
      capital = 10000
    } = req.body;

    console.log('Running backtest with params:', {
      symbol,
      timeframe,
      signalType,
      indicator,
      value,
      iterations,
      candles,
      risk,
      reward,
      capital
    });

    // Map signal type to evaluate function (matching CLI backtest.js)
    const evaluateFunctionMap = {
      'INDICATOR_RsiObSignal': 'signalAgent.ob',
      'INDICATOR_RsiOsSignal': 'signalAgent.os',
      'INDICATOR_CrocodileDiveSignal': 'signalAgent.crocodileDive',
      'INDICATOR_CrocodileSignal': 'signalAgent.crocodile',
      'INDICATOR_CrossUpSignal': 'signalAgent.crossOver',
      'INDICATOR_CrossDownSignal': 'signalAgent.crossUnder',
      'INDICATOR_DivergenceDetector': 'signalAgent.multiDiv',
      'INDICATOR_UptrendSignal': 'signalAgent.uptrendTrend',
      'INDICATOR_DownTrendSignal': 'signalAgent.downTrend',
      'INDICATOR_Woodies': 'signalAgent.woodies',
      'INDICATOR_SuperTrendSignal': 'signalAgent.superTrend',
      'PRICE_ACTION_GT': 'signalAgent.gt',
      'PRICE_ACTION_LT': 'signalAgent.lt',
      'PRICE_ACTION_GTE': 'signalAgent.gte',
      'PRICE_ACTION_LTE': 'signalAgent.lte',
      'PRICE_ACTION_EQ': 'signalAgent.eq',
      'INDICATOR_MacdBullishSignal': 'signalAgent.macdBullish',
      'INDICATOR_MacdBearishSignal': 'signalAgent.macdBearish',
      'INDICATOR_BollingerUpperTouchSignal': 'signalAgent.bollingerUpperTouch',
      'INDICATOR_BollingerLowerTouchSignal': 'signalAgent.bollingerLowerTouch',
      'INDICATOR_StochasticOverboughtSignal': 'signalAgent.stochasticOverbought',
      'INDICATOR_StochasticOversoldSignal': 'signalAgent.stochasticOversold',
      'INDICATOR_WilliamsOverboughtSignal': 'signalAgent.williamsOverbought',
      'INDICATOR_WilliamsOversoldSignal': 'signalAgent.williamsOversold',
      'INDICATOR_GoldenCrossSignal': 'signalAgent.goldenCross',
      'INDICATOR_DeathCrossSignal': 'signalAgent.deathCross',
      'INDICATOR_VolumeSpikeSignal': 'signalAgent.volumeSpike',
      'INDICATOR_IchimokuBullishSignal': 'signalAgent.ichimokuBullish',
      'INDICATOR_IchimokuBearishSignal': 'signalAgent.ichimokuBearish',
      'INDICATOR_AdxStrongTrendSignal': 'signalAgent.adxStrongTrend',
      'INDICATOR_MfiOverboughtSignal': 'signalAgent.mfiOverbought',
      'INDICATOR_MfiOversoldSignal': 'signalAgent.mfiOversold',
      'INDICATOR_AtrHighVolatilitySignal': 'signalAgent.atrHighVolatility',
      'INDICATOR_ParabolicSarBullishSignal': 'signalAgent.parabolicSarBullish',
      'INDICATOR_ParabolicSarBearishSignal': 'signalAgent.parabolicSarBearish',
      'INDICATOR_CciOverboughtSignal': 'signalAgent.cciOverbought',
      'INDICATOR_CciOversoldSignal': 'signalAgent.cciOversold',
      'INDICATOR_MacdHistogramPositiveSignal': 'signalAgent.macdHistogramPositive',
      'INDICATOR_MacdHistogramNegativeSignal': 'signalAgent.macdHistogramNegative',
      'INDICATOR_BollingerSqueezeSignal': 'signalAgent.bollingerSqueeze',
      'INDICATOR_BollingerExpansionSignal': 'signalAgent.bollingerExpansion',
      'INDICATOR_StochasticBullishCrossSignal': 'signalAgent.stochasticBullishCross',
      'INDICATOR_StochasticBearishCrossSignal': 'signalAgent.stochasticBearishCross',
      'INDICATOR_MaSupportSignal': 'signalAgent.maSupport',
      'INDICATOR_MaResistanceSignal': 'signalAgent.maResistance',
      'INDICATOR_ObvBullishSignal': 'signalAgent.obvBullish',
      'INDICATOR_ObvBearishSignal': 'signalAgent.obvBearish',
      'INDICATOR_IchimokuTkCrossBullishSignal': 'signalAgent.ichimokuTkCrossBullish',
      'INDICATOR_IchimokuTkCrossBearishSignal': 'signalAgent.ichimokuTkCrossBearish',
      'INDICATOR_FibonacciRetracementSignal': 'signalAgent.fibonacciRetracement',
      'INDICATOR_SupportBreakoutSignal': 'signalAgent.supportBreakout',
      'INDICATOR_ResistanceBreakoutSignal': 'signalAgent.resistanceBreakout',
      'INDICATOR_AdxWeakTrendSignal': 'signalAgent.adxWeakTrend',
      'INDICATOR_TemaBullishSignal': 'signalAgent.temaBullish',
      'INDICATOR_TemaBearishSignal': 'signalAgent.temaBearish',
      'INDICATOR_KeltnerUpperBreakoutSignal': 'signalAgent.keltnerUpperBreakout',
      'INDICATOR_KeltnerLowerBreakoutSignal': 'signalAgent.keltnerLowerBreakout',
      'INDICATOR_DonchianUpperBreakoutSignal': 'signalAgent.donchianUpperBreakout',
      'INDICATOR_DonchianLowerBreakoutSignal': 'signalAgent.donchianLowerBreakout',
      'INDICATOR_ElderImpulseBullSignal': 'signalAgent.elderImpulseBull',
      'INDICATOR_ElderImpulseBearSignal': 'signalAgent.elderImpulseBear',
      'INDICATOR_ElderImpulseBlueSignal': 'signalAgent.elderImpulseBlue'
    };

    // Create signal object for backtesting
    const signal = {
      symbol,
      timeframe,
      signalType,
      indicator,
      value,
      evaluate: evaluateFunctionMap[signalType] || 'signalAgent.gt', // Add evaluate function
      indicatorArgs: {}
    };

    // Run backtest
    const results = await backtestSignal(
      signal,
      parseInt(iterations),
      parseInt(candles),
      parseFloat(risk),
      parseFloat(reward),
      parseFloat(capital)
    );

    res.json(results);
  } catch (error) {
    console.error('Error running backtest:', error);
    res.status(500).json({ 
      error: 'Failed to run backtest',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Create HTTP server
const server = createServer(app);

// WebSocket Server for real-time updates
const wss = new WebSocketServer({ server, path: '/ws' });

// Store active WebSocket connections and their subscriptions
const wsClients = new Map();

wss.on('connection', (ws) => {
  const clientId = Date.now().toString();
  console.log(`✅ WebSocket client connected: ${clientId}`);
  
  wsClients.set(clientId, {
    ws,
    subscriptions: new Set(),
    bybitHandler: null
  });

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());
      const client = wsClients.get(clientId);
      
      if (data.type === 'subscribe') {
        // Create Bybit WebSocket handler if not exists
        if (!client.bybitHandler) {
          client.bybitHandler = new CryptoDogWebSocketHandler();
          
          // Forward updates to the web client
          client.bybitHandler.onUpdate((update) => {
            if (ws.readyState === ws.OPEN) {
              ws.send(JSON.stringify({
                type: 'update',
                data: update
              }));
            }
          });

          client.bybitHandler.onOpen(() => {
            console.log(`Bybit WS opened for client ${clientId}`);
          });

          client.bybitHandler.onException((error) => {
            console.error(`Bybit WS error for client ${clientId}:`, error);
            ws.send(JSON.stringify({
              type: 'error',
              error: error.message
            }));
          });
        }

        // Subscribe to topics
        const { topics, category } = data;
        client.bybitHandler.subscribeToTopics(topics, category);
        topics.forEach(topic => client.subscriptions.add(topic));
        
        ws.send(JSON.stringify({
          type: 'subscribed',
          topics,
          category
        }));
      } else if (data.type === 'unsubscribe') {
        // Note: Bybit API doesn't support unsubscribe easily, 
        // so we'd need to track and filter on our end
        const { topics } = data;
        topics.forEach(topic => client.subscriptions.delete(topic));
        
        ws.send(JSON.stringify({
          type: 'unsubscribed',
          topics
        }));
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        error: error.message
      }));
    }
  });

  ws.on('close', () => {
    console.log(`❌ WebSocket client disconnected: ${clientId}`);
    const client = wsClients.get(clientId);
    if (client?.bybitHandler) {
      // Cleanup if needed
    }
    wsClients.delete(clientId);
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error for client ${clientId}:`, error);
  });

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connected',
    clientId,
    message: 'Connected to Crypto Dog WebSocket server'
  }));
});

// Start server
server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║   🐕 Crypto Dog Server Running       ║
╠═══════════════════════════════════════╣
║  HTTP API: http://localhost:${PORT}     ║
║  WebSocket: ws://localhost:${PORT}/ws   ║
╚═══════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
