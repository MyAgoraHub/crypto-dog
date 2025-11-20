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
import { CryptoDogWebSocketHandler } from './core/clients/cryptoDogWebsocketHandler.js';
import { cryptoDogTradeBotAgent } from './core/cryptoDogTradeBotAgent.js';
// Signal mapping utilities removed - using direct signalType to indicator mapping
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
  ichimokuCloudMarketData,
  ksiMarketData,
  obvMarketData,
  ema4MarketData,
  ema3MarketData,
  ema10And20MarketData,
  sma3MarketData,
  adlMarketData,
  awesomeOscillatorMarketData,
  wmaMarketData,
  wildersWmaMarketData,
  volumeProfileMarketData,
  vwapMarketData,
  trixMarketData,
  forceIndexMarketData,
  rocMarketData,
  psarMarketData,
  zemaMarketData,
  zScoreMarketData,
  patternRecognitionMarketData,
  floorPivotsMarketData,
  woodiesMarketData,
  dynamicGridSignalsMarketData,
  supportAndResistanceMarketData,
  getCacheStats,
  clearCache
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
  smamulti: smaMultiPeriodMarketData,
  ksi: ksiMarketData,
  obv: obvMarketData,
  ema4: ema4MarketData,
  ema3: ema3MarketData,
  ema10and20: ema10And20MarketData,
  sma3: sma3MarketData,
  adl: adlMarketData,
  awesomeoscillator: awesomeOscillatorMarketData,
  wma: wmaMarketData,
  wilderswma: wildersWmaMarketData,
  volumeprofile: volumeProfileMarketData,
  vwap: vwapMarketData,
  trix: trixMarketData,
  forceindex: forceIndexMarketData,
  roc: rocMarketData,
  psar: psarMarketData,
  zema: zemaMarketData,
  zscore: zScoreMarketData,
  patternrecognition: patternRecognitionMarketData,
  floorpivots: floorPivotsMarketData,
  woodies: woodiesMarketData,
  dynamicgridsignals: dynamicGridSignalsMarketData,
  supportandresistance: supportAndResistanceMarketData
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

// Get all available signal types for backtesting  
app.get('/api/signal-types', (req, res) => {
  try {
    // Return the available signal types directly from our mapping
    const signalTypes = [
      { signalType: 'INDICATOR_RsiObSignal', indicator: 'RsiIndicator', category: 'RSI', description: 'RSI Overbought Signal' },
      { signalType: 'INDICATOR_RsiOsSignal', indicator: 'RsiIndicator', category: 'RSI', description: 'RSI Oversold Signal' },
      { signalType: 'INDICATOR_MacdBullishSignal', indicator: 'MacdIndicator', category: 'MACD', description: 'MACD Bullish Signal' },
      { signalType: 'INDICATOR_MacdBearishSignal', indicator: 'MacdIndicator', category: 'MACD', description: 'MACD Bearish Signal' },
      { signalType: 'INDICATOR_BollingerUpperTouchSignal', indicator: 'BollingerBandsIndicator', category: 'Bollinger Bands', description: 'Bollinger Upper Band Touch' },
      { signalType: 'INDICATOR_BollingerLowerTouchSignal', indicator: 'BollingerBandsIndicator', category: 'Bollinger Bands', description: 'Bollinger Lower Band Touch' },
      { signalType: 'INDICATOR_StochasticOverboughtSignal', indicator: 'StochasticIndicator', category: 'Stochastic', description: 'Stochastic Overbought' },
      { signalType: 'INDICATOR_StochasticOversoldSignal', indicator: 'StochasticIndicator', category: 'Stochastic', description: 'Stochastic Oversold' },
      { signalType: 'INDICATOR_SuperTrendSignal', indicator: 'SuperTrendIndicator', category: 'SuperTrend', description: 'SuperTrend Signal' },
      { signalType: 'INDICATOR_GoldenCrossSignal', indicator: 'EmaIndicator', category: 'Moving Average', description: 'Golden Cross Signal' },
      { signalType: 'INDICATOR_DeathCrossSignal', indicator: 'EmaIndicator', category: 'Moving Average', description: 'Death Cross Signal' },
      
      // Price Action Signals
      { signalType: 'PRICE_ACTION_GT', indicator: 'PriceIndicator', category: 'Price Action', description: 'Price Above Level' },
      { signalType: 'PRICE_ACTION_LT', indicator: 'PriceIndicator', category: 'Price Action', description: 'Price Below Level' },
      { signalType: 'PRICE_ACTION_GTE', indicator: 'PriceIndicator', category: 'Price Action', description: 'Price At/Above Level' },
      { signalType: 'PRICE_ACTION_LTE', indicator: 'PriceIndicator', category: 'Price Action', description: 'Price At/Below Level' },
      { signalType: 'PRICE_ACTION_EQ', indicator: 'PriceIndicator', category: 'Price Action', description: 'Price Equal to Level' }
    ];
    
    // Group by category
    const grouped = signalTypes.reduce((acc, signal) => {
      if (!acc[signal.category]) {
        acc[signal.category] = [];
      }
      acc[signal.category].push(signal);
      return acc;
    }, {});

    res.json({
      total: signalTypes.length,
      categories: Object.keys(grouped),
      signals: signalTypes,
      grouped: grouped
    });
  } catch (error) {
    console.error('Error fetching signal types:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get signal details by signalType
app.get('/api/signal-types/:signalType', (req, res) => {
  try {
    const { signalType } = req.params;
    
    // Use the same mapping as the backtest endpoint
    const signalTypeToIndicatorMap = {
      'INDICATOR_RsiObSignal': 'RsiIndicator',
      'INDICATOR_RsiOsSignal': 'RsiIndicator',
      'INDICATOR_MacdBullishSignal': 'MacdIndicator',
      'INDICATOR_MacdBearishSignal': 'MacdIndicator',
      'INDICATOR_MacdHistogramPositiveSignal': 'MacdIndicator',
      'INDICATOR_MacdHistogramNegativeSignal': 'MacdIndicator',
      'INDICATOR_BollingerUpperTouchSignal': 'BollingerBandsIndicator',
      'INDICATOR_BollingerLowerTouchSignal': 'BollingerBandsIndicator',
      'INDICATOR_BollingerSqueezeSignal': 'BollingerBandsIndicator',
      'INDICATOR_BollingerExpansionSignal': 'BollingerBandsIndicator',
      'INDICATOR_StochasticOverboughtSignal': 'StochasticIndicator',
      'INDICATOR_StochasticOversoldSignal': 'StochasticIndicator',
      'INDICATOR_StochasticBullishCrossSignal': 'StochasticIndicator',
      'INDICATOR_StochasticBearishCrossSignal': 'StochasticIndicator',
      'INDICATOR_WilliamsOverboughtSignal': 'WilliamsRIndicator',
      'INDICATOR_WilliamsOversoldSignal': 'WilliamsRIndicator',
      'INDICATOR_CciOverboughtSignal': 'CciIndicator',
      'INDICATOR_CciOversoldSignal': 'CciIndicator',
      'INDICATOR_AdxStrongTrendSignal': 'AdxIndicator',
      'INDICATOR_AdxWeakTrendSignal': 'AdxIndicator',
      'INDICATOR_MfiOverboughtSignal': 'MfiIndicator',
      'INDICATOR_MfiOversoldSignal': 'MfiIndicator',
      'INDICATOR_AtrHighVolatilitySignal': 'AtrIndicator',
      'INDICATOR_ParabolicSarBullishSignal': 'ParabolicSarIndicator',
      'INDICATOR_ParabolicSarBearishSignal': 'ParabolicSarIndicator',
      'INDICATOR_IchimokuBullishSignal': 'IchimokuIndicator',
      'INDICATOR_IchimokuBearishSignal': 'IchimokuIndicator',
      'INDICATOR_IchimokuTkCrossBullishSignal': 'IchimokuIndicator',
      'INDICATOR_IchimokuTkCrossBearishSignal': 'IchimokuIndicator',
      'INDICATOR_SuperTrendSignal': 'SuperTrendIndicator',
      'INDICATOR_GoldenCrossSignal': 'EmaIndicator',
      'INDICATOR_DeathCrossSignal': 'EmaIndicator',
      'INDICATOR_MaSupportSignal': 'EmaIndicator',
      'INDICATOR_MaResistanceSignal': 'EmaIndicator',
      'INDICATOR_CrossUpSignal': 'EmaIndicator',
      'INDICATOR_CrossDownSignal': 'EmaIndicator',
      'INDICATOR_ObvBullishSignal': 'ObvIndicator',
      'INDICATOR_ObvBearishSignal': 'ObvIndicator',
      'INDICATOR_VolumeSpikeSignal': 'VolumeIndicator',
      'INDICATOR_TemaBullishSignal': 'TripleEmaIndicator',
      'INDICATOR_TemaBearishSignal': 'TripleEmaIndicator',
      'INDICATOR_UptrendSignal': 'TrendlineIndicator',
      'INDICATOR_DownTrendSignal': 'TrendlineIndicator',
      'INDICATOR_SupportBreakoutSignal': 'SupportResistanceIndicator',
      'INDICATOR_ResistanceBreakoutSignal': 'SupportResistanceIndicator',
      'INDICATOR_FibonacciRetracementSignal': 'FibonacciIndicator',
      'INDICATOR_CrocodileSignal': 'CrocodileIndicator',
      'INDICATOR_CrocodileDiveSignal': 'CrocodileIndicator',
      'INDICATOR_DivergenceDetector': 'MultiDivergenceIndicator',
      'INDICATOR_Woodies': 'WoodiesIndicator',
      'INDICATOR_KeltnerUpperBreakoutSignal': 'KeltnerChannelsIndicator',
      'INDICATOR_KeltnerLowerBreakoutSignal': 'KeltnerChannelsIndicator',
      'INDICATOR_DonchianUpperBreakoutSignal': 'DonchianChannelsIndicator',
      'INDICATOR_DonchianLowerBreakoutSignal': 'DonchianChannelsIndicator',
      'INDICATOR_ElderImpulseBullSignal': 'ElderImpulseIndicator',
      'INDICATOR_ElderImpulseBearSignal': 'ElderImpulseIndicator',
      'INDICATOR_ElderImpulseBlueSignal': 'ElderImpulseIndicator',
      'PRICE_ACTION_GT': 'PriceIndicator',
      'PRICE_ACTION_LT': 'PriceIndicator',
      'PRICE_ACTION_GTE': 'PriceIndicator',
      'PRICE_ACTION_LTE': 'PriceIndicator',
      'PRICE_ACTION_EQ': 'PriceIndicator'
    };

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

    const indicator = signalTypeToIndicatorMap[signalType];
    if (!indicator) {
      return res.status(404).json({ 
        error: `Signal type '${signalType}' not found`,
        availableSignalTypes: Object.keys(signalTypeToIndicatorMap)
      });
    }

    // Find from the signal types list for additional details
    const signalTypes = [
      { signalType: 'INDICATOR_RsiObSignal', indicator: 'RsiIndicator', category: 'RSI', description: 'RSI Overbought Signal' },
      { signalType: 'INDICATOR_RsiOsSignal', indicator: 'RsiIndicator', category: 'RSI', description: 'RSI Oversold Signal' },
      { signalType: 'INDICATOR_MacdBullishSignal', indicator: 'MacdIndicator', category: 'MACD', description: 'MACD Bullish Signal' },
      { signalType: 'INDICATOR_MacdBearishSignal', indicator: 'MacdIndicator', category: 'MACD', description: 'MACD Bearish Signal' },
      { signalType: 'INDICATOR_BollingerUpperTouchSignal', indicator: 'BollingerBandsIndicator', category: 'Bollinger Bands', description: 'Bollinger Upper Band Touch' },
      { signalType: 'INDICATOR_BollingerLowerTouchSignal', indicator: 'BollingerBandsIndicator', category: 'Bollinger Bands', description: 'Bollinger Lower Band Touch' },
      { signalType: 'INDICATOR_StochasticOverboughtSignal', indicator: 'StochasticIndicator', category: 'Stochastic', description: 'Stochastic Overbought' },
      { signalType: 'INDICATOR_StochasticOversoldSignal', indicator: 'StochasticIndicator', category: 'Stochastic', description: 'Stochastic Oversold' },
      { signalType: 'INDICATOR_SuperTrendSignal', indicator: 'SuperTrendIndicator', category: 'SuperTrend', description: 'SuperTrend Signal' },
      { signalType: 'INDICATOR_GoldenCrossSignal', indicator: 'EmaIndicator', category: 'Moving Average', description: 'Golden Cross Signal' },
      { signalType: 'INDICATOR_DeathCrossSignal', indicator: 'EmaIndicator', category: 'Moving Average', description: 'Death Cross Signal' },
      
      // Price Action Signals
      { signalType: 'PRICE_ACTION_GT', indicator: 'PriceIndicator', category: 'Price Action', description: 'Price Above Level' },
      { signalType: 'PRICE_ACTION_LT', indicator: 'PriceIndicator', category: 'Price Action', description: 'Price Below Level' },
      { signalType: 'PRICE_ACTION_GTE', indicator: 'PriceIndicator', category: 'Price Action', description: 'Price At/Above Level' },
      { signalType: 'PRICE_ACTION_LTE', indicator: 'PriceIndicator', category: 'Price Action', description: 'Price At/Below Level' },
      { signalType: 'PRICE_ACTION_EQ', indicator: 'PriceIndicator', category: 'Price Action', description: 'Price Equal to Level' }
    ];

    const signalInfo = signalTypes.find(s => s.signalType === signalType);

    res.json({
      signalType,
      indicator,
      evaluate: evaluateFunctionMap[signalType] || 'signalAgent.gt',
      category: signalInfo?.category || 'Unknown',
      description: signalInfo?.description || signalType,
      defaultValue: signalType.includes('RsiOb') ? 70 : signalType.includes('RsiOs') ? 30 : 0
    });
  } catch (error) {
    console.error('Error fetching signal type:', error);
    res.status(500).json({ error: error.message });
  }
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

// Backtest endpoint (Enhanced with automatic indicator mapping)
app.post('/api/backtest', async (req, res) => {
  try {
    const { 
      signalType,
      indicator,           // Optional: will be auto-mapped from signalType if not provided
      value = 0,
      symbol = 'BTCUSDT', 
      timeframe = '15', 
      iterations = 10,
      candles = 200,
      risk = 2,
      reward = 5,
      capital = 10000
    } = req.body;

    if (!signalType) {
      return res.status(400).json({ 
        error: 'signalType is required',
        example: { 
          signalType: 'INDICATOR_RsiOsSignal',
          symbol: 'BTCUSDT',
          timeframe: '15',
          value: 30
        }
      });
    }

    // Auto-map indicator from signalType if not provided
    let finalIndicator = indicator;
    if (!finalIndicator) {
      // Create a reverse mapping from signalType to indicator
      const signalTypeToIndicatorMap = {
        'INDICATOR_RsiObSignal': 'RsiIndicator',
        'INDICATOR_RsiOsSignal': 'RsiIndicator',
        'INDICATOR_MacdBullishSignal': 'MacdIndicator',
        'INDICATOR_MacdBearishSignal': 'MacdIndicator',
        'INDICATOR_MacdHistogramPositiveSignal': 'MacdIndicator',
        'INDICATOR_MacdHistogramNegativeSignal': 'MacdIndicator',
        'INDICATOR_BollingerUpperTouchSignal': 'BollingerBandsIndicator',
        'INDICATOR_BollingerLowerTouchSignal': 'BollingerBandsIndicator',
        'INDICATOR_BollingerSqueezeSignal': 'BollingerBandsIndicator',
        'INDICATOR_BollingerExpansionSignal': 'BollingerBandsIndicator',
        'INDICATOR_StochasticOverboughtSignal': 'StochasticIndicator',
        'INDICATOR_StochasticOversoldSignal': 'StochasticIndicator',
        'INDICATOR_StochasticBullishCrossSignal': 'StochasticIndicator',
        'INDICATOR_StochasticBearishCrossSignal': 'StochasticIndicator',
        'INDICATOR_WilliamsOverboughtSignal': 'WilliamsRIndicator',
        'INDICATOR_WilliamsOversoldSignal': 'WilliamsRIndicator',
        'INDICATOR_CciOverboughtSignal': 'CciIndicator',
        'INDICATOR_CciOversoldSignal': 'CciIndicator',
        'INDICATOR_AdxStrongTrendSignal': 'AdxIndicator',
        'INDICATOR_AdxWeakTrendSignal': 'AdxIndicator',
        'INDICATOR_MfiOverboughtSignal': 'MfiIndicator',
        'INDICATOR_MfiOversoldSignal': 'MfiIndicator',
        'INDICATOR_AtrHighVolatilitySignal': 'AtrIndicator',
        'INDICATOR_ParabolicSarBullishSignal': 'ParabolicSarIndicator',
        'INDICATOR_ParabolicSarBearishSignal': 'ParabolicSarIndicator',
        'INDICATOR_IchimokuBullishSignal': 'IchimokuIndicator',
        'INDICATOR_IchimokuBearishSignal': 'IchimokuIndicator',
        'INDICATOR_IchimokuTkCrossBullishSignal': 'IchimokuIndicator',
        'INDICATOR_IchimokuTkCrossBearishSignal': 'IchimokuIndicator',
        'INDICATOR_SuperTrendSignal': 'SuperTrendIndicator',
        'INDICATOR_GoldenCrossSignal': 'EmaIndicator',
        'INDICATOR_DeathCrossSignal': 'EmaIndicator',
        'INDICATOR_MaSupportSignal': 'EmaIndicator',
        'INDICATOR_MaResistanceSignal': 'EmaIndicator',
        'INDICATOR_CrossUpSignal': 'EmaIndicator',
        'INDICATOR_CrossDownSignal': 'EmaIndicator',
        'INDICATOR_ObvBullishSignal': 'ObvIndicator',
        'INDICATOR_ObvBearishSignal': 'ObvIndicator',
        'INDICATOR_VolumeSpikeSignal': 'VolumeIndicator',
        'INDICATOR_TemaBullishSignal': 'TripleEmaIndicator',
        'INDICATOR_TemaBearishSignal': 'TripleEmaIndicator',
        'INDICATOR_UptrendSignal': 'TrendlineIndicator',
        'INDICATOR_DownTrendSignal': 'TrendlineIndicator',
        'INDICATOR_SupportBreakoutSignal': 'SupportResistanceIndicator',
        'INDICATOR_ResistanceBreakoutSignal': 'SupportResistanceIndicator',
        'INDICATOR_FibonacciRetracementSignal': 'FibonacciIndicator',
        'INDICATOR_CrocodileSignal': 'CrocodileIndicator',
        'INDICATOR_CrocodileDiveSignal': 'CrocodileIndicator',
        'INDICATOR_DivergenceDetector': 'MultiDivergenceIndicator',
        'INDICATOR_Woodies': 'WoodiesIndicator',
        'INDICATOR_KeltnerUpperBreakoutSignal': 'KeltnerChannelsIndicator',
        'INDICATOR_KeltnerLowerBreakoutSignal': 'KeltnerChannelsIndicator',
        'INDICATOR_DonchianUpperBreakoutSignal': 'DonchianChannelsIndicator',
        'INDICATOR_DonchianLowerBreakoutSignal': 'DonchianChannelsIndicator',
        'INDICATOR_ElderImpulseBullSignal': 'ElderImpulseIndicator',
        'INDICATOR_ElderImpulseBearSignal': 'ElderImpulseIndicator',
        'INDICATOR_ElderImpulseBlueSignal': 'ElderImpulseIndicator',
        // Price Action Signals
        'PRICE_ACTION_GT': 'PriceIndicator',
        'PRICE_ACTION_LT': 'PriceIndicator',
        'PRICE_ACTION_GTE': 'PriceIndicator',
        'PRICE_ACTION_LTE': 'PriceIndicator',
        'PRICE_ACTION_EQ': 'PriceIndicator'
      };

      finalIndicator = signalTypeToIndicatorMap[signalType];
      
      if (!finalIndicator) {
        return res.status(400).json({ 
          error: `Unable to auto-map indicator for signalType: ${signalType}. Please provide the indicator parameter.`,
          availableSignalTypes: Object.keys(signalTypeToIndicatorMap)
        });
      }
      
      console.log(`Auto-mapped ${signalType} → ${finalIndicator}`);
    }

    console.log('Running backtest with params:', {
      symbol: symbol.toUpperCase(),
      timeframe,
      signalType,
      indicator: finalIndicator,
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
      symbol: symbol.toUpperCase(),
      timeframe,
      signalType,
      indicator: finalIndicator,
      value,
      evaluate: evaluateFunctionMap[signalType] || 'signalAgent.gt',
      indicatorArgs: signalType === 'INDICATOR_CrossUpSignal' || signalType === 'INDICATOR_CrossDownSignal' ? { period: 200 } : {}
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

    res.json({
      success: true,
      signal: {
        ...signal,
        autoMappedIndicator: !indicator // Show if indicator was auto-mapped
      },
      results
    });
  } catch (error) {
    console.error('Error running backtest:', error);
    res.status(500).json({ 
      error: 'Failed to run backtest',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Calculate all indicators from kline data (like CLI agent)
app.post('/api/indicators/calculate-all', async (req, res) => {
  try {
    const { klineData } = req.body;

    console.log('📊 Calculate-all request received');
    console.log('Kline data length:', klineData?.length);

    if (!klineData || !Array.isArray(klineData) || klineData.length < 50) {
      console.error('❌ Invalid klineData:', { 
        isArray: Array.isArray(klineData), 
        length: klineData?.length 
      });
      return res.status(400).json({ 
        error: 'Invalid klineData. Must be array with at least 50 candles' 
      });
    }

    console.log('First candle:', klineData[0]);
    console.log('Last candle:', klineData[klineData.length - 1]);

    // Import indicator list
    const { IndicatorList } = await import('./core/indicator/Indicators.js');
    const { createIndicatorData } = await import('./core/cryptoDogTools.js');

    console.log('📦 Creating indicator data...');
    
    // Prepare indicator data
    const { o, h, l, c, v, buffer } = createIndicatorData(klineData);

    console.log('Created arrays:', { 
      o: o?.length, 
      h: h?.length, 
      l: l?.length, 
      c: c?.length, 
      v: v?.length 
    });

    const staticIndicators = [
      "SuperTrendIndicator",
      "VolumeProfile",
      "FloorPivots",
      "Woodies",
      "DynamicGridSignals"
    ];

    const indicators = {};
    const indicatorMap = IndicatorList.getIndicator("all");

    console.log('📈 Calculating indicators...');
    let successCount = 0;
    let errorCount = 0;

    for (const key in indicatorMap) {
      // Skip these for now
      if (["Ema3Indicator", "SupportAndResistance"].includes(key)) { 
        continue; 
      }

      try {
        const indicatorFunc = indicatorMap[key];
        let result = indicatorFunc(o, h, l, c, v, {}, buffer);

        if (Array.isArray(result)) {
          indicators[key] = result.pop();
          successCount++;
        } else {
          Object.keys(result).forEach(subKey => {
            if (Array.isArray(result[subKey])) {
              indicators[`${key}_${subKey}`] = result[subKey].pop();
              successCount++;
            }
          });
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Error calculating ${key}:`, error.message);
        // Continue with other indicators
      }
    }

    console.log('✅ Calculation complete:', { 
      successCount, 
      errorCount, 
      totalIndicators: Object.keys(indicators).length 
    });
    console.log('Indicator keys:', Object.keys(indicators).slice(0, 10), '...');

    res.json(indicators);

  } catch (error) {
    console.error('❌ Error calculating indicators:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create HTTP server
const server = createServer(app);

// WebSocket Server for real-time updates
const wss = new WebSocketServer({ server, path: '/ws' });

// Store active WebSocket connections and their subscriptions
const wsClients = new Map();

// Store active trade bot agents for real-time indicators
const tradeBotAgents = new Map();

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
      } else if (data.type === 'subscribe_indicators') {
        // Subscribe to real-time indicators using cryptoDogTradeBotAgent
        const { symbol = 'BTCUSDT', interval = '15m' } = data;
        const agentKey = `${symbol}_${interval}`;
        
        // Create trade bot agent if not exists
        if (!tradeBotAgents.has(agentKey)) {
          console.log(`🤖 Creating trade bot agent for ${symbol} ${interval}`);
          const agent = new cryptoDogTradeBotAgent();
          
          // Set up price update callback
          agent.onPriceUpdate = (price) => {
            // Broadcast price updates to all subscribed clients
            wsClients.forEach((clientData, cId) => {
              if (clientData.ws.readyState === clientData.ws.OPEN && 
                  clientData.subscriptions.has(`indicators_${agentKey}`)) {
                clientData.ws.send(JSON.stringify({
                  type: 'price_update',
                  symbol,
                  interval,
                  price,
                  timestamp: Date.now()
                }));
              }
            });
          };
          
          // Start real-time feed
          await agent.startRealTimeKlineFeed(interval, symbol);
          tradeBotAgents.set(agentKey, agent);
          
          // Set up periodic indicator broadcasts
          setInterval(() => {
            if (agent.isKlineDataLoaded()) {
              const indicators = agent.getIndicatorValues();
              const currentCandle = agent.getCurrentKlineCandle();
              
              // Broadcast to all subscribed clients
              wsClients.forEach((clientData, cId) => {
                if (clientData.ws.readyState === clientData.ws.OPEN && 
                    clientData.subscriptions.has(`indicators_${agentKey}`)) {
                  clientData.ws.send(JSON.stringify({
                    type: 'indicators_update',
                    symbol,
                    interval,
                    indicators,
                    currentCandle,
                    klineLength: agent.getCurrentKlineLength(),
                    timestamp: Date.now()
                  }));
                }
              });
            }
          }, 5000); // Update every 5 seconds
        }
        
        // Add subscription
        client.subscriptions.add(`indicators_${agentKey}`);
        
        // Send immediate data if available
        const agent = tradeBotAgents.get(agentKey);
        if (agent && agent.isKlineDataLoaded()) {
          ws.send(JSON.stringify({
            type: 'indicators_initial',
            symbol,
            interval,
            indicators: agent.getIndicatorValues(),
            currentCandle: agent.getCurrentKlineCandle(),
            klineLength: agent.getCurrentKlineLength(),
            timestamp: Date.now()
          }));
        }
        
        ws.send(JSON.stringify({
          type: 'indicators_subscribed',
          symbol,
          interval,
          agentKey
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
      } else if (data.type === 'unsubscribe_indicators') {
        const { symbol = 'BTCUSDT', interval = '15m' } = data;
        const agentKey = `${symbol}_${interval}`;
        
        client.subscriptions.delete(`indicators_${agentKey}`);
        
        ws.send(JSON.stringify({
          type: 'indicators_unsubscribed',
          symbol,
          interval,
          agentKey
        }));
      } else if (data.type === 'get_current_candle') {
        const { symbol = 'BTCUSDT', interval = '15m' } = data;
        const agentKey = `${symbol}_${interval}`;
        const agent = tradeBotAgents.get(agentKey);
        
        if (agent && agent.isKlineDataLoaded()) {
          ws.send(JSON.stringify({
            type: 'current_candle',
            symbol,
            interval,
            candle: agent.getCurrentKlineCandle(),
            timestamp: Date.now()
          }));
        } else {
          ws.send(JSON.stringify({
            type: 'error',
            error: 'No agent or data available for the requested symbol/interval'
          }));
        }
      } else if (data.type === 'get_indicators') {
        const { symbol = 'BTCUSDT', interval = '15m' } = data;
        const agentKey = `${symbol}_${interval}`;
        const agent = tradeBotAgents.get(agentKey);
        
        if (agent && agent.isKlineDataLoaded()) {
          ws.send(JSON.stringify({
            type: 'indicators_snapshot',
            symbol,
            interval,
            indicators: agent.getIndicatorValues(),
            klineLength: agent.getCurrentKlineLength(),
            timestamp: Date.now()
          }));
        } else {
          ws.send(JSON.stringify({
            type: 'error',
            error: 'No agent or data available for the requested symbol/interval'
          }));
        }
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
