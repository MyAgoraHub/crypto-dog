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
import { signalAgent } from './core/cryptoDogSignalAgent.js';
import { createCryptoDogAiContext as createAiContext } from './core/cryptoDogAiContext.js';
import fs, { createReadStream } from 'fs';
import { promises as fsPromises } from 'fs';
import path from 'path';
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
    // Complete list of all available signal types
    const signalTypes = [
      // RSI Signals
      { signalType: 'INDICATOR_RsiObSignal', indicator: 'RsiIndicator', category: 'RSI', description: 'RSI Overbought Signal' },
      { signalType: 'INDICATOR_RsiOsSignal', indicator: 'RsiIndicator', category: 'RSI', description: 'RSI Oversold Signal' },
      
      // MACD Signals
      { signalType: 'INDICATOR_MacdBullishSignal', indicator: 'MacdIndicator', category: 'MACD', description: 'MACD Bullish Crossover' },
      { signalType: 'INDICATOR_MacdBearishSignal', indicator: 'MacdIndicator', category: 'MACD', description: 'MACD Bearish Crossover' },
      { signalType: 'INDICATOR_MacdHistogramPositiveSignal', indicator: 'MacdIndicator', category: 'MACD', description: 'MACD Histogram Positive' },
      { signalType: 'INDICATOR_MacdHistogramNegativeSignal', indicator: 'MacdIndicator', category: 'MACD', description: 'MACD Histogram Negative' },
      
      // Bollinger Bands Signals
      { signalType: 'INDICATOR_BollingerUpperTouchSignal', indicator: 'BollingerBandsIndicator', category: 'Bollinger Bands', description: 'Price Touches Upper Band' },
      { signalType: 'INDICATOR_BollingerLowerTouchSignal', indicator: 'BollingerBandsIndicator', category: 'Bollinger Bands', description: 'Price Touches Lower Band' },
      { signalType: 'INDICATOR_BollingerSqueezeSignal', indicator: 'BollingerBandsIndicator', category: 'Bollinger Bands', description: 'Bollinger Squeeze (Low Volatility)' },
      { signalType: 'INDICATOR_BollingerExpansionSignal', indicator: 'BollingerBandsIndicator', category: 'Bollinger Bands', description: 'Bollinger Expansion (High Volatility)' },
      
      // Stochastic Signals
      { signalType: 'INDICATOR_StochasticOverboughtSignal', indicator: 'StochasticIndicator', category: 'Stochastic', description: 'Stochastic Overbought (>80)' },
      { signalType: 'INDICATOR_StochasticOversoldSignal', indicator: 'StochasticIndicator', category: 'Stochastic', description: 'Stochastic Oversold (<20)' },
      { signalType: 'INDICATOR_StochasticBullishCrossSignal', indicator: 'StochasticIndicator', category: 'Stochastic', description: '%K Crosses Above %D' },
      { signalType: 'INDICATOR_StochasticBearishCrossSignal', indicator: 'StochasticIndicator', category: 'Stochastic', description: '%K Crosses Below %D' },
      
      // Williams %R Signals
      { signalType: 'INDICATOR_WilliamsOverboughtSignal', indicator: 'WilliamsRIndicator', category: 'Williams %R', description: 'Williams %R Overbought (>-20)' },
      { signalType: 'INDICATOR_WilliamsOversoldSignal', indicator: 'WilliamsRIndicator', category: 'Williams %R', description: 'Williams %R Oversold (<-80)' },
      
      // CCI Signals
      { signalType: 'INDICATOR_CciOverboughtSignal', indicator: 'CciIndicator', category: 'CCI', description: 'CCI Overbought (>100)' },
      { signalType: 'INDICATOR_CciOversoldSignal', indicator: 'CciIndicator', category: 'CCI', description: 'CCI Oversold (<-100)' },
      
      // ADX Signals
      { signalType: 'INDICATOR_AdxStrongTrendSignal', indicator: 'AdxIndicator', category: 'ADX', description: 'ADX Strong Trend (>25)' },
      { signalType: 'INDICATOR_AdxWeakTrendSignal', indicator: 'AdxIndicator', category: 'ADX', description: 'ADX Weak Trend (<20)' },
      
      // MFI Signals
      { signalType: 'INDICATOR_MfiOverboughtSignal', indicator: 'MfiIndicator', category: 'MFI', description: 'Money Flow Index Overbought (>80)' },
      { signalType: 'INDICATOR_MfiOversoldSignal', indicator: 'MfiIndicator', category: 'MFI', description: 'Money Flow Index Oversold (<20)' },
      
      // ATR Signals
      { signalType: 'INDICATOR_AtrHighVolatilitySignal', indicator: 'AtrIndicator', category: 'ATR', description: 'ATR High Volatility' },
      
      // Parabolic SAR Signals
      { signalType: 'INDICATOR_ParabolicSarBullishSignal', indicator: 'ParabolicSarIndicator', category: 'Parabolic SAR', description: 'PSAR Below Price (Bullish)' },
      { signalType: 'INDICATOR_ParabolicSarBearishSignal', indicator: 'ParabolicSarIndicator', category: 'Parabolic SAR', description: 'PSAR Above Price (Bearish)' },
      
      // Ichimoku Signals
      { signalType: 'INDICATOR_IchimokuBullishSignal', indicator: 'IchimokuIndicator', category: 'Ichimoku', description: 'Ichimoku Bullish Setup' },
      { signalType: 'INDICATOR_IchimokuBearishSignal', indicator: 'IchimokuIndicator', category: 'Ichimoku', description: 'Ichimoku Bearish Setup' },
      { signalType: 'INDICATOR_IchimokuTkCrossBullishSignal', indicator: 'IchimokuIndicator', category: 'Ichimoku', description: 'Tenkan Crosses Above Kijun' },
      { signalType: 'INDICATOR_IchimokuTkCrossBearishSignal', indicator: 'IchimokuIndicator', category: 'Ichimoku', description: 'Tenkan Crosses Below Kijun' },
      
      // SuperTrend Signals
      { signalType: 'INDICATOR_SuperTrendSignal', indicator: 'SuperTrendIndicator', category: 'SuperTrend', description: 'SuperTrend Signal' },
      
      // Moving Average Signals
      { signalType: 'INDICATOR_GoldenCrossSignal', indicator: 'EmaIndicator', category: 'Moving Average', description: 'Golden Cross (Fast MA > Slow MA)' },
      { signalType: 'INDICATOR_DeathCrossSignal', indicator: 'EmaIndicator', category: 'Moving Average', description: 'Death Cross (Fast MA < Slow MA)' },
      { signalType: 'INDICATOR_MaSupportSignal', indicator: 'EmaIndicator', category: 'Moving Average', description: 'Price Finds Support at MA' },
      { signalType: 'INDICATOR_MaResistanceSignal', indicator: 'EmaIndicator', category: 'Moving Average', description: 'Price Hits Resistance at MA' },
      { signalType: 'INDICATOR_CrossUpSignal', indicator: 'EmaIndicator', category: 'Moving Average', description: 'EMA Cross Up' },
      { signalType: 'INDICATOR_CrossDownSignal', indicator: 'EmaIndicator', category: 'Moving Average', description: 'EMA Cross Down' },
      
      // Volume Signals
      { signalType: 'INDICATOR_VolumeSpikeSignal', indicator: 'VolumeIndicator', category: 'Volume', description: 'Volume Spike (2x Average)' },
      { signalType: 'INDICATOR_ObvBullishSignal', indicator: 'ObvIndicator', category: 'Volume', description: 'OBV Bullish Trend' },
      { signalType: 'INDICATOR_ObvBearishSignal', indicator: 'ObvIndicator', category: 'Volume', description: 'OBV Bearish Trend' },
      
      // TEMA Signals
      { signalType: 'INDICATOR_TemaBullishSignal', indicator: 'TripleEmaIndicator', category: 'TEMA', description: 'Triple EMA Bullish' },
      { signalType: 'INDICATOR_TemaBearishSignal', indicator: 'TripleEmaIndicator', category: 'TEMA', description: 'Triple EMA Bearish' },
      
      // Trend Signals
      { signalType: 'INDICATOR_UptrendSignal', indicator: 'TrendlineIndicator', category: 'Trend', description: 'Uptrend Detected' },
      { signalType: 'INDICATOR_DownTrendSignal', indicator: 'TrendlineIndicator', category: 'Trend', description: 'Downtrend Detected' },
      
      // Support/Resistance Signals
      { signalType: 'INDICATOR_SupportBreakoutSignal', indicator: 'SupportResistanceIndicator', category: 'Support/Resistance', description: 'Price Breaks Above Support' },
      { signalType: 'INDICATOR_ResistanceBreakoutSignal', indicator: 'SupportResistanceIndicator', category: 'Support/Resistance', description: 'Price Breaks Above Resistance' },
      
      // Fibonacci Signals
      { signalType: 'INDICATOR_FibonacciRetracementSignal', indicator: 'FibonacciIndicator', category: 'Fibonacci', description: 'Price at Fibonacci Level' },
      
      // Crocodile Signals
      { signalType: 'INDICATOR_CrocodileSignal', indicator: 'CrocodileIndicator', category: 'Crocodile', description: 'Crocodile Bullish (EMA1>EMA2>EMA3)' },
      { signalType: 'INDICATOR_CrocodileDiveSignal', indicator: 'CrocodileIndicator', category: 'Crocodile', description: 'Crocodile Dive Bearish (EMA1<EMA2<EMA3)' },
      
      // Divergence Signals
      { signalType: 'INDICATOR_DivergenceDetector', indicator: 'MultiDivergenceIndicator', category: 'Divergence', description: 'Multi-Divergence Detection' },
      
      // Woodies Signals
      { signalType: 'INDICATOR_Woodies', indicator: 'WoodiesIndicator', category: 'Woodies', description: 'Woodies Pivot Points' },
      
      // Keltner Channel Signals
      { signalType: 'INDICATOR_KeltnerUpperBreakoutSignal', indicator: 'KeltnerChannelsIndicator', category: 'Keltner Channels', description: 'Price Breaks Above Upper Channel' },
      { signalType: 'INDICATOR_KeltnerLowerBreakoutSignal', indicator: 'KeltnerChannelsIndicator', category: 'Keltner Channels', description: 'Price Breaks Below Lower Channel' },
      
      // Donchian Channel Signals
      { signalType: 'INDICATOR_DonchianUpperBreakoutSignal', indicator: 'DonchianChannelsIndicator', category: 'Donchian Channels', description: 'Price Breaks Channel High' },
      { signalType: 'INDICATOR_DonchianLowerBreakoutSignal', indicator: 'DonchianChannelsIndicator', category: 'Donchian Channels', description: 'Price Breaks Channel Low' },
      
      // Elder Impulse Signals
      { signalType: 'INDICATOR_ElderImpulseBullSignal', indicator: 'ElderImpulseIndicator', category: 'Elder Impulse', description: 'Elder Impulse Bull (Green Bar)' },
      { signalType: 'INDICATOR_ElderImpulseBearSignal', indicator: 'ElderImpulseIndicator', category: 'Elder Impulse', description: 'Elder Impulse Bear (Red Bar)' },
      { signalType: 'INDICATOR_ElderImpulseBlueSignal', indicator: 'ElderImpulseIndicator', category: 'Elder Impulse', description: 'Elder Impulse Neutral (Blue Bar)' },
      
      // Price Action Signals
      { signalType: 'PRICE_ACTION_GT', indicator: 'PriceIndicator', category: 'Price Action', description: 'Price Above Level (>)' },
      { signalType: 'PRICE_ACTION_LT', indicator: 'PriceIndicator', category: 'Price Action', description: 'Price Below Level (<)' },
      { signalType: 'PRICE_ACTION_GTE', indicator: 'PriceIndicator', category: 'Price Action', description: 'Price At/Above Level (>=)' },
      { signalType: 'PRICE_ACTION_LTE', indicator: 'PriceIndicator', category: 'Price Action', description: 'Price At/Below Level (<=)' },
      { signalType: 'PRICE_ACTION_EQ', indicator: 'PriceIndicator', category: 'Price Action', description: 'Price Equal to Level (==)' }
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
      'INDICATOR_RsiObSignal': signalAgent.ob,
      'INDICATOR_RsiOsSignal': signalAgent.os,
      'INDICATOR_CrocodileDiveSignal': signalAgent.crocodileDive,
      'INDICATOR_CrocodileSignal': signalAgent.crocodile,
      'INDICATOR_CrossUpSignal': signalAgent.crossOver,
      'INDICATOR_CrossDownSignal': signalAgent.crossUnder,
      'INDICATOR_DivergenceDetector': signalAgent.multiDiv,
      'INDICATOR_UptrendSignal': signalAgent.uptrendTrend,
      'INDICATOR_DownTrendSignal': signalAgent.downTrend,
      'INDICATOR_Woodies': signalAgent.woodies,
      'INDICATOR_SuperTrendSignal': signalAgent.superTrend,
      'PRICE_ACTION_GT': signalAgent.gt,
      'PRICE_ACTION_LT': signalAgent.lt,
      'PRICE_ACTION_GTE': signalAgent.gte,
      'PRICE_ACTION_LTE': signalAgent.lte,
      'PRICE_ACTION_EQ': signalAgent.eq,
      'INDICATOR_MacdBullishSignal': signalAgent.macdBullish,
      'INDICATOR_MacdBearishSignal': signalAgent.macdBearish,
      'INDICATOR_BollingerUpperTouchSignal': signalAgent.bollingerUpperTouch,
      'INDICATOR_BollingerLowerTouchSignal': signalAgent.bollingerLowerTouch,
      'INDICATOR_StochasticOverboughtSignal': signalAgent.stochasticOverbought,
      'INDICATOR_StochasticOversoldSignal': signalAgent.stochasticOversold,
      'INDICATOR_WilliamsOverboughtSignal': signalAgent.williamsOverbought,
      'INDICATOR_WilliamsOversoldSignal': signalAgent.williamsOversold,
      'INDICATOR_GoldenCrossSignal': signalAgent.goldenCross,
      'INDICATOR_DeathCrossSignal': signalAgent.deathCross,
      'INDICATOR_VolumeSpikeSignal': signalAgent.volumeSpike,
      'INDICATOR_IchimokuBullishSignal': signalAgent.ichimokuBullish,
      'INDICATOR_IchimokuBearishSignal': signalAgent.ichimokuBearish,
      'INDICATOR_AdxStrongTrendSignal': signalAgent.adxStrongTrend,
      'INDICATOR_MfiOverboughtSignal': signalAgent.mfiOverbought,
      'INDICATOR_MfiOversoldSignal': signalAgent.mfiOversold,
      'INDICATOR_AtrHighVolatilitySignal': signalAgent.atrHighVolatility,
      'INDICATOR_ParabolicSarBullishSignal': signalAgent.parabolicSarBullish,
      'INDICATOR_ParabolicSarBearishSignal': signalAgent.parabolicSarBearish,
      'INDICATOR_CciOverboughtSignal': signalAgent.cciOverbought,
      'INDICATOR_CciOversoldSignal': signalAgent.cciOversold,
      'INDICATOR_MacdHistogramPositiveSignal': signalAgent.macdHistogramPositive,
      'INDICATOR_MacdHistogramNegativeSignal': signalAgent.macdHistogramNegative,
      'INDICATOR_BollingerSqueezeSignal': signalAgent.bollingerSqueeze,
      'INDICATOR_BollingerExpansionSignal': signalAgent.bollingerExpansion,
      'INDICATOR_StochasticBullishCrossSignal': signalAgent.stochasticBullishCross,
      'INDICATOR_StochasticBearishCrossSignal': signalAgent.stochasticBearishCross,
      'INDICATOR_MaSupportSignal': signalAgent.maSupport,
      'INDICATOR_MaResistanceSignal': signalAgent.maResistance,
      'INDICATOR_ObvBullishSignal': signalAgent.obvBullish,
      'INDICATOR_ObvBearishSignal': signalAgent.obvBearish,
      'INDICATOR_IchimokuTkCrossBullishSignal': signalAgent.ichimokuTkCrossBullish,
      'INDICATOR_IchimokuTkCrossBearishSignal': signalAgent.ichimokuTkCrossBearish,
      'INDICATOR_FibonacciRetracementSignal': signalAgent.fibonacciRetracement,
      'INDICATOR_SupportBreakoutSignal': signalAgent.supportBreakout,
      'INDICATOR_ResistanceBreakoutSignal': signalAgent.resistanceBreakout,
      'INDICATOR_AdxWeakTrendSignal': signalAgent.adxWeakTrend,
      'INDICATOR_TemaBullishSignal': signalAgent.temaBullish,
      'INDICATOR_TemaBearishSignal': signalAgent.temaBearish,
      'INDICATOR_KeltnerUpperBreakoutSignal': 'signalAgent.keltnerUpperBreakout',
      'INDICATOR_KeltnerUpperBreakoutSignal': signalAgent.keltnerUpperBreakout,
      'INDICATOR_KeltnerLowerBreakoutSignal': signalAgent.keltnerLowerBreakout,
      'INDICATOR_DonchianUpperBreakoutSignal': signalAgent.donchianUpperBreakout,
      'INDICATOR_DonchianLowerBreakoutSignal': signalAgent.donchianLowerBreakout,
      'INDICATOR_ElderImpulseBullSignal': signalAgent.elderImpulseBull,
      'INDICATOR_ElderImpulseBearSignal': signalAgent.elderImpulseBear,
      'INDICATOR_ElderImpulseBlueSignal': signalAgent.elderImpulseBlue
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
      evaluate: evaluateFunctionMap[signalType] || signalAgent.gt,
      evaluateFunctionName: (evaluateFunctionMap[signalType] || signalAgent.gt).name,
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
    const inputSignal = req.body;
    
    // Map evaluate function to actual function reference, then convert to string
    let evaluateFunction = null;
    if (inputSignal.evaluate && typeof inputSignal.evaluate === 'string') {
      // Map string references like 'ob', 'gte', etc. to actual functions
      const evaluateFunctionMap = {
        'ob': signalAgent.ob,
        'os': signalAgent.os,
        'gt': signalAgent.gt,
        'lt': signalAgent.lt,
        'gte': signalAgent.gte,
        'lte': signalAgent.lte,
        'eq': signalAgent.eq,
        'crocodileDive': signalAgent.crocodileDive,
        'crocodile': signalAgent.crocodile,
        'crossOver': signalAgent.crossOver,
        'crossUnder': signalAgent.crossUnder,
        'multiDiv': signalAgent.multiDiv,
        'uptrendTrend': signalAgent.uptrendTrend,
        'downTrend': signalAgent.downTrend,
        'woodies': signalAgent.woodies,
        'superTrend': signalAgent.superTrend,
        'macdBullish': signalAgent.macdBullish,
        'macdBearish': signalAgent.macdBearish,
        'bollingerUpperTouch': signalAgent.bollingerUpperTouch,
        'bollingerLowerTouch': signalAgent.bollingerLowerTouch,
        'stochasticOverbought': signalAgent.stochasticOverbought,
        'stochasticOversold': signalAgent.stochasticOversold,
        'williamsOverbought': signalAgent.williamsOverbought,
        'williamsOversold': signalAgent.williamsOversold,
        'goldenCross': signalAgent.goldenCross,
        'deathCross': signalAgent.deathCross,
        'volumeSpike': signalAgent.volumeSpike,
        'ichimokuBullish': signalAgent.ichimokuBullish,
        'ichimokuBearish': signalAgent.ichimokuBearish,
        'adxStrongTrend': signalAgent.adxStrongTrend,
        'mfiOverbought': signalAgent.mfiOverbought,
        'mfiOversold': signalAgent.mfiOversold,
        'atrHighVolatility': signalAgent.atrHighVolatility,
        'parabolicSarBullish': signalAgent.parabolicSarBullish,
        'parabolicSarBearish': signalAgent.parabolicSarBearish,
        'cciOverbought': signalAgent.cciOverbought,
        'cciOversold': signalAgent.cciOversold,
        'macdHistogramPositive': signalAgent.macdHistogramPositive,
        'macdHistogramNegative': signalAgent.macdHistogramNegative,
        'bollingerSqueeze': signalAgent.bollingerSqueeze,
        'bollingerExpansion': signalAgent.bollingerExpansion,
        'stochasticBullishCross': signalAgent.stochasticBullishCross,
        'stochasticBearishCross': signalAgent.stochasticBearishCross,
        'maSupport': signalAgent.maSupport,
        'maResistance': signalAgent.maResistance,
        'obvBullish': signalAgent.obvBullish,
        'obvBearish': signalAgent.obvBearish,
        'ichimokuTkCrossBullish': signalAgent.ichimokuTkCrossBullish,
        'ichimokuTkCrossBearish': signalAgent.ichimokuTkCrossBearish,
        'fibonacciRetracement': signalAgent.fibonacciRetracement,
        'supportBreakout': signalAgent.supportBreakout,
        'resistanceBreakout': signalAgent.resistanceBreakout,
        'adxWeakTrend': signalAgent.adxWeakTrend,
        'temaBullish': signalAgent.temaBullish,
        'temaBearish': signalAgent.temaBearish,
        'keltnerUpperBreakout': signalAgent.keltnerUpperBreakout,
        'keltnerLowerBreakout': signalAgent.keltnerLowerBreakout,
        'donchianUpperBreakout': signalAgent.donchianUpperBreakout,
        'donchianLowerBreakout': signalAgent.donchianLowerBreakout,
        'elderImpulseBull': signalAgent.elderImpulseBull,
        'elderImpulseBear': signalAgent.elderImpulseBear,
        'elderImpulseBlue': signalAgent.elderImpulseBlue
      };
      
      const evalFunc = evaluateFunctionMap[inputSignal.evaluate];
      if (evalFunc && typeof evalFunc === 'function') {
        // Convert function to string representation
        evaluateFunction = evalFunc.toString();
      } else {
        evaluateFunction = inputSignal.evaluate;
      }
    } else {
      evaluateFunction = inputSignal.evaluate;
    }
    
    // Create signal using CLI-compatible structure (matches getSignalModel)
    const now = new Date();
    const signal = {
      id: inputSignal.id || `${inputSignal.symbol}-${inputSignal.timeframe}-${inputSignal.indicator || inputSignal.signalType}`,
      symbol: inputSignal.symbol || null,
      timeframe: inputSignal.timeframe || null,
      indicator: inputSignal.indicator || null,
      signalType: inputSignal.signalType || null,
      value: inputSignal.value || null,
      createdOn: inputSignal.createdOn || now,
      updatedOn: inputSignal.updatedOn || now,
      lastExecuted: inputSignal.lastExecuted || now,
      isActive: inputSignal.isActive !== undefined ? inputSignal.isActive : (inputSignal.active !== undefined ? inputSignal.active : true),
      nextInvocation: inputSignal.nextInvocation || now,
      maxTriggerTimes: inputSignal.maxTriggerTimes || 3,
      triggerCount: inputSignal.triggerCount || 0,
      evaluate: evaluateFunction,
      indicatorArgs: inputSignal.indicatorArgs || {}
    };
    
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
      'INDICATOR_RsiObSignal': signalAgent.ob,
      'INDICATOR_RsiOsSignal': signalAgent.os,
      'INDICATOR_CrocodileDiveSignal': signalAgent.crocodileDive,
      'INDICATOR_CrocodileSignal': signalAgent.crocodile,
      'INDICATOR_CrossUpSignal': signalAgent.crossOver,
      'INDICATOR_CrossDownSignal': signalAgent.crossUnder,
      'INDICATOR_DivergenceDetector': signalAgent.multiDiv,
      'INDICATOR_UptrendSignal': signalAgent.uptrendTrend,
      'INDICATOR_DownTrendSignal': signalAgent.downTrend,
      'INDICATOR_Woodies': signalAgent.woodies,
      'INDICATOR_SuperTrendSignal': signalAgent.superTrend,
      'PRICE_ACTION_GT': signalAgent.gt,
      'PRICE_ACTION_LT': signalAgent.lt,
      'PRICE_ACTION_GTE': signalAgent.gte,
      'PRICE_ACTION_LTE': signalAgent.lte,
      'PRICE_ACTION_EQ': signalAgent.eq,
      'INDICATOR_MacdBullishSignal': signalAgent.macdBullish,
      'INDICATOR_MacdBearishSignal': signalAgent.macdBearish,
      'INDICATOR_BollingerUpperTouchSignal': signalAgent.bollingerUpperTouch,
      'INDICATOR_BollingerLowerTouchSignal': signalAgent.bollingerLowerTouch,
      'INDICATOR_StochasticOverboughtSignal': signalAgent.stochasticOverbought,
      'INDICATOR_StochasticOversoldSignal': signalAgent.stochasticOversold,
      'INDICATOR_WilliamsOverboughtSignal': signalAgent.williamsOverbought,
      'INDICATOR_WilliamsOversoldSignal': signalAgent.williamsOversold,
      'INDICATOR_GoldenCrossSignal': signalAgent.goldenCross,
      'INDICATOR_DeathCrossSignal': signalAgent.deathCross,
      'INDICATOR_VolumeSpikeSignal': signalAgent.volumeSpike,
      'INDICATOR_IchimokuBullishSignal': signalAgent.ichimokuBullish,
      'INDICATOR_IchimokuBearishSignal': signalAgent.ichimokuBearish,
      'INDICATOR_AdxStrongTrendSignal': signalAgent.adxStrongTrend,
      'INDICATOR_MfiOverboughtSignal': signalAgent.mfiOverbought,
      'INDICATOR_MfiOversoldSignal': signalAgent.mfiOversold,
      'INDICATOR_AtrHighVolatilitySignal': signalAgent.atrHighVolatility,
      'INDICATOR_ParabolicSarBullishSignal': signalAgent.parabolicSarBullish,
      'INDICATOR_ParabolicSarBearishSignal': signalAgent.parabolicSarBearish,
      'INDICATOR_CciOverboughtSignal': signalAgent.cciOverbought,
      'INDICATOR_CciOversoldSignal': signalAgent.cciOversold,
      'INDICATOR_MacdHistogramPositiveSignal': signalAgent.macdHistogramPositive,
      'INDICATOR_MacdHistogramNegativeSignal': signalAgent.macdHistogramNegative,
      'INDICATOR_BollingerSqueezeSignal': signalAgent.bollingerSqueeze,
      'INDICATOR_BollingerExpansionSignal': signalAgent.bollingerExpansion,
      'INDICATOR_StochasticBullishCrossSignal': signalAgent.stochasticBullishCross,
      'INDICATOR_StochasticBearishCrossSignal': signalAgent.stochasticBearishCross,
      'INDICATOR_MaSupportSignal': signalAgent.maSupport,
      'INDICATOR_MaResistanceSignal': signalAgent.maResistance,
      'INDICATOR_ObvBullishSignal': signalAgent.obvBullish,
      'INDICATOR_ObvBearishSignal': signalAgent.obvBearish,
      'INDICATOR_IchimokuTkCrossBullishSignal': signalAgent.ichimokuTkCrossBullish,
      'INDICATOR_IchimokuTkCrossBearishSignal': signalAgent.ichimokuTkCrossBearish,
      'INDICATOR_FibonacciRetracementSignal': signalAgent.fibonacciRetracement,
      'INDICATOR_SupportBreakoutSignal': signalAgent.supportBreakout,
      'INDICATOR_ResistanceBreakoutSignal': signalAgent.resistanceBreakout,
      'INDICATOR_AdxWeakTrendSignal': signalAgent.adxWeakTrend,
      'INDICATOR_TemaBullishSignal': signalAgent.temaBullish,
      'INDICATOR_TemaBearishSignal': signalAgent.temaBearish,
      'INDICATOR_KeltnerUpperBreakoutSignal': signalAgent.keltnerUpperBreakout,
      'INDICATOR_KeltnerLowerBreakoutSignal': signalAgent.keltnerLowerBreakout,
      'INDICATOR_DonchianUpperBreakoutSignal': signalAgent.donchianUpperBreakout,
      'INDICATOR_DonchianLowerBreakoutSignal': signalAgent.donchianLowerBreakout,
      'INDICATOR_ElderImpulseBullSignal': signalAgent.elderImpulseBull,
      'INDICATOR_ElderImpulseBearSignal': signalAgent.elderImpulseBear,
      'INDICATOR_ElderImpulseBlueSignal': signalAgent.elderImpulseBlue
    };

    // Create signal object for backtesting
    const signal = {
      symbol: symbol.toUpperCase(),
      timeframe,
      signalType,
      indicator: finalIndicator,
      value,
      evaluate: evaluateFunctionMap[signalType] || signalAgent.gt,
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

// AI Context CSV Generation Endpoints
app.post('/api/ai/generate-csv', async (req, res) => {
  try {
    const { 
      symbol = 'BTCUSDT', 
      timeframe = '15m',
      iterations = 200,
      candles = 500
    } = req.body;
    
    console.log(`📊 Generating AI context CSV for ${symbol}/${timeframe}...`);
    console.log(`   Iterations: ${iterations}, Candles: ${candles}`);
    
    // Create AI context and generate CSV
    const signal = { symbol, timeframe };
    const aiContext = createAiContext(signal, iterations, candles);
    
    // Load data and generate CSV
    await aiContext.loadData();
    aiContext.writeIndicatorCsvData();
    
    // Construct file path
    const fileName = `cryptoDogAiContext_${symbol}_${timeframe}.csv`;
    const csvPath = path.join(process.cwd(), fileName);
    
    // Check if file exists and get stats
    const stats = await fsPromises.stat(csvPath);
    
    res.json({
      success: true,
      symbol,
      timeframe,
      iterations,
      candles,
      filePath: csvPath,
      fileName: fileName,
      fileSize: stats.size,
      fileSizeReadable: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
      downloadUrl: `/api/ai/csv/${symbol}/${timeframe}`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error generating CSV:', error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Stream CSV file endpoint
app.get('/api/ai/csv/:symbol/:timeframe', async (req, res) => {
  try {
    const { symbol, timeframe } = req.params;
    
    // Construct expected file path (match the cryptoDogAiContext.js output format)
    const fileName = `cryptoDogAiContext_${symbol}_${timeframe}.csv`;
    const csvPath = path.join(process.cwd(), fileName);
    
    // Check if file exists
    try {
      await fsPromises.access(csvPath);
    } catch (error) {
      return res.status(404).json({ 
        error: 'CSV file not found',
        symbol,
        timeframe,
        expectedPath: csvPath,
        hint: 'Generate the CSV first using POST /api/ai/generate-csv'
      });
    }
    
    // Get file stats
    const stats = await fsPromises.stat(csvPath);
    
    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', stats.size);
    
    // Stream the file
    const readStream = createReadStream(csvPath);
    
    readStream.on('error', (error) => {
      console.error('❌ Error streaming CSV:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error streaming file' });
      }
    });
    
    readStream.pipe(res);
    
  } catch (error) {
    console.error('❌ Error in CSV endpoint:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

// List all available AI context CSV files
app.get('/api/ai/csv-files', async (req, res) => {
  try {
    const files = await fsPromises.readdir(process.cwd());
    const csvFiles = files
      .filter(f => f.startsWith('cryptoDogAiContext_') && f.endsWith('.csv'))
      .map(f => {
        const match = f.match(/cryptoDogAiContext_([A-Z]+)_(\d+[mhd])\.csv/);
        if (match) {
          return {
            fileName: f,
            symbol: match[1],
            timeframe: match[2],
            downloadUrl: `/api/ai/csv/${match[1]}/${match[2]}`
          };
        }
        return null;
      })
      .filter(f => f !== null);
    
    // Get file stats for each CSV
    const csvFilesWithStats = await Promise.all(
      csvFiles.map(async (file) => {
        try {
          const filePath = path.join(process.cwd(), file.fileName);
          const stats = await fsPromises.stat(filePath);
          return {
            ...file,
            fileSize: stats.size,
            fileSizeReadable: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
            lastModified: stats.mtime
          };
        } catch (error) {
          return file;
        }
      })
    );
    
    res.json({
      count: csvFilesWithStats.length,
      files: csvFilesWithStats
    });
    
  } catch (error) {
    console.error('❌ Error listing CSV files:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete AI context CSV file
app.delete('/api/ai/csv/:symbol/:timeframe', async (req, res) => {
  try {
    const { symbol, timeframe } = req.params;
    
    // Construct file path
    const fileName = `cryptoDogAiContext_${symbol}_${timeframe}.csv`;
    const csvPath = path.join(process.cwd(), fileName);
    
    // Check if file exists
    try {
      await fsPromises.access(csvPath);
    } catch (error) {
      return res.status(404).json({ 
        error: 'CSV file not found',
        symbol,
        timeframe,
        fileName,
        hint: 'File does not exist or was already deleted'
      });
    }
    
    // Get file stats before deletion
    const stats = await fsPromises.stat(csvPath);
    const fileSize = stats.size;
    const fileSizeReadable = `${(fileSize / 1024 / 1024).toFixed(2)} MB`;
    
    // Delete the file
    await fsPromises.unlink(csvPath);
    
    console.log(`🗑️  Deleted CSV file: ${fileName} (${fileSizeReadable})`);
    
    res.json({
      success: true,
      deleted: true,
      symbol,
      timeframe,
      fileName,
      fileSize,
      fileSizeReadable,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error deleting CSV file:', error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Delete all AI context CSV files
app.delete('/api/ai/csv-files', async (req, res) => {
  try {
    const files = await fsPromises.readdir(process.cwd());
    const csvFiles = files.filter(f => f.startsWith('cryptoDogAiContext_') && f.endsWith('.csv'));
    
    if (csvFiles.length === 0) {
      return res.json({
        success: true,
        deleted: 0,
        message: 'No CSV files found to delete'
      });
    }
    
    // Delete all CSV files
    const deleteResults = await Promise.allSettled(
      csvFiles.map(async (fileName) => {
        const filePath = path.join(process.cwd(), fileName);
        const stats = await fsPromises.stat(filePath);
        await fsPromises.unlink(filePath);
        return {
          fileName,
          fileSize: stats.size,
          fileSizeReadable: `${(stats.size / 1024 / 1024).toFixed(2)} MB`
        };
      })
    );
    
    const deleted = deleteResults.filter(r => r.status === 'fulfilled').map(r => r.value);
    const failed = deleteResults.filter(r => r.status === 'rejected').map(r => r.reason);
    
    console.log(`🗑️  Deleted ${deleted.length} CSV files`);
    if (failed.length > 0) {
      console.error(`❌ Failed to delete ${failed.length} files:`, failed);
    }
    
    res.json({
      success: true,
      deleted: deleted.length,
      failed: failed.length,
      files: deleted,
      errors: failed.length > 0 ? failed : undefined,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error deleting CSV files:', error);
    res.status(500).json({ 
      error: error.message,
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
