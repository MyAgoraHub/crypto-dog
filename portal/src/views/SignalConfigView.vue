<script setup>
import { ref, computed, onMounted } from 'vue';
import apiClient from '../services/api.js';
import SymbolSearch from '../components/SymbolSearch.vue';

const signalForm = ref({
  symbol: 'BTCUSDT',
  timeframe: '4h',
  signalCategory: 'indicator', // 'indicator' or 'priceAction'
  signalType: 'RSI_OB',
  indicator: 'RsiIndicator',
  value: 70,
  maxTriggerTimes: 3,
  indicatorArgs: {},
  filterCategory: 'All' // For filtering signals by category
});

const loading = ref(false);
const success = ref(null);
const error = ref(null);
const searchQuery = ref('');

const updateSymbol = (symbolData) => {
  signalForm.value.symbol = symbolData.symbol || symbolData;
};

const intervals = [
  { value: '1m', label: '1 minute' },
  { value: '5m', label: '5 minutes' },
  { value: '15m', label: '15 minutes' },
  { value: '30m', label: '30 minutes' },
  { value: '1h', label: '1 hour' },
  { value: '4h', label: '4 hours' },
  { value: '1D', label: '1 day' },
];

const signalTypes = {
  indicator: [
    // RSI Signals
    { value: 'RSI_OB', label: 'RSI Overbought', indicator: 'RsiIndicator', defaultValue: 70, category: 'Momentum' },
    { value: 'RSI_OS', label: 'RSI Oversold', indicator: 'RsiIndicator', defaultValue: 30, category: 'Momentum' },
    
    // SuperTrend Signals
    { value: 'SUPERTREND_LONG', label: 'SuperTrend Long', indicator: 'SuperTrendIndicator', defaultValue: 'long', category: 'Trend' },
    { value: 'SUPERTREND_SHORT', label: 'SuperTrend Short', indicator: 'SuperTrendIndicator', defaultValue: 'short', category: 'Trend' },
    { value: 'UPTREND', label: 'Uptrend Signal', indicator: 'SuperTrendIndicator', defaultValue: null, category: 'Trend' },
    { value: 'DOWNTREND', label: 'Downtrend Signal', indicator: 'SuperTrendIndicator', defaultValue: null, category: 'Trend' },
    
    // EMA/Moving Average Signals
    { value: 'CROCODILE', label: 'Crocodile (EMA Bullish)', indicator: 'Ema3Indicator', defaultValue: null, category: 'Trend' },
    { value: 'CROCODILE_DIVE', label: 'Crocodile Dive (EMA Bearish)', indicator: 'Ema3Indicator', defaultValue: null, category: 'Trend' },
    { value: 'CROSS_UP', label: 'EMA Cross Up', indicator: 'EMAIndicator', defaultValue: null, category: 'Trend' },
    { value: 'CROSS_DOWN', label: 'EMA Cross Down', indicator: 'EMAIndicator', defaultValue: null, category: 'Trend' },
    { value: 'GOLDEN_CROSS', label: 'Golden Cross', indicator: 'EMAIndicator', defaultValue: null, category: 'Trend' },
    { value: 'DEATH_CROSS', label: 'Death Cross', indicator: 'EMAIndicator', defaultValue: null, category: 'Trend' },
    { value: 'MA_SUPPORT', label: 'MA Support', indicator: 'EMAIndicator', defaultValue: null, category: 'Support/Resistance' },
    { value: 'MA_RESISTANCE', label: 'MA Resistance', indicator: 'EMAIndicator', defaultValue: null, category: 'Support/Resistance' },
    { value: 'TEMA_BULLISH', label: 'TEMA Bullish', indicator: 'TEMAIndicator', defaultValue: null, category: 'Trend' },
    { value: 'TEMA_BEARISH', label: 'TEMA Bearish', indicator: 'TEMAIndicator', defaultValue: null, category: 'Trend' },
    
    // MACD Signals
    { value: 'MACD_BULLISH', label: 'MACD Bullish Cross', indicator: 'MACDIndicator', defaultValue: null, category: 'Momentum' },
    { value: 'MACD_BEARISH', label: 'MACD Bearish Cross', indicator: 'MACDIndicator', defaultValue: null, category: 'Momentum' },
    { value: 'MACD_HISTOGRAM_POSITIVE', label: 'MACD Histogram Positive', indicator: 'MACDIndicator', defaultValue: null, category: 'Momentum' },
    { value: 'MACD_HISTOGRAM_NEGATIVE', label: 'MACD Histogram Negative', indicator: 'MACDIndicator', defaultValue: null, category: 'Momentum' },
    
    // Bollinger Bands
    { value: 'BOLLINGER_UPPER_TOUCH', label: 'Bollinger Upper Touch', indicator: 'BollingerIndicator', defaultValue: null, category: 'Volatility' },
    { value: 'BOLLINGER_LOWER_TOUCH', label: 'Bollinger Lower Touch', indicator: 'BollingerIndicator', defaultValue: null, category: 'Volatility' },
    { value: 'BOLLINGER_SQUEEZE', label: 'Bollinger Squeeze', indicator: 'BollingerIndicator', defaultValue: null, category: 'Volatility' },
    { value: 'BOLLINGER_EXPANSION', label: 'Bollinger Expansion', indicator: 'BollingerIndicator', defaultValue: null, category: 'Volatility' },
    
    // Stochastic Oscillator
    { value: 'STOCHASTIC_OVERBOUGHT', label: 'Stochastic Overbought', indicator: 'StochasticIndicator', defaultValue: null, category: 'Momentum' },
    { value: 'STOCHASTIC_OVERSOLD', label: 'Stochastic Oversold', indicator: 'StochasticIndicator', defaultValue: null, category: 'Momentum' },
    { value: 'STOCHASTIC_BULLISH_CROSS', label: 'Stochastic Bullish Cross', indicator: 'StochasticIndicator', defaultValue: null, category: 'Momentum' },
    { value: 'STOCHASTIC_BEARISH_CROSS', label: 'Stochastic Bearish Cross', indicator: 'StochasticIndicator', defaultValue: null, category: 'Momentum' },
    
    // Williams %R
    { value: 'WILLIAMS_OVERBOUGHT', label: 'Williams %R Overbought', indicator: 'WilliamsRIndicator', defaultValue: null, category: 'Momentum' },
    { value: 'WILLIAMS_OVERSOLD', label: 'Williams %R Oversold', indicator: 'WilliamsRIndicator', defaultValue: null, category: 'Momentum' },
    
    // Volume Indicators
    { value: 'VOLUME_SPIKE', label: 'Volume Spike', indicator: 'VolumeIndicator', defaultValue: null, category: 'Volume' },
    { value: 'OBV_BULLISH', label: 'OBV Bullish', indicator: 'OBVIndicator', defaultValue: null, category: 'Volume' },
    { value: 'OBV_BEARISH', label: 'OBV Bearish', indicator: 'OBVIndicator', defaultValue: null, category: 'Volume' },
    { value: 'MFI_OVERBOUGHT', label: 'MFI Overbought', indicator: 'MFIIndicator', defaultValue: null, category: 'Volume' },
    { value: 'MFI_OVERSOLD', label: 'MFI Oversold', indicator: 'MFIIndicator', defaultValue: null, category: 'Volume' },
    
    // Ichimoku
    { value: 'ICHIMOKU_BULLISH', label: 'Ichimoku Bullish', indicator: 'IchimokuIndicator', defaultValue: null, category: 'Trend' },
    { value: 'ICHIMOKU_BEARISH', label: 'Ichimoku Bearish', indicator: 'IchimokuIndicator', defaultValue: null, category: 'Trend' },
    { value: 'ICHIMOKU_TK_CROSS_BULLISH', label: 'Ichimoku TK Bullish Cross', indicator: 'IchimokuIndicator', defaultValue: null, category: 'Trend' },
    { value: 'ICHIMOKU_TK_CROSS_BEARISH', label: 'Ichimoku TK Bearish Cross', indicator: 'IchimokuIndicator', defaultValue: null, category: 'Trend' },
    
    // ADX
    { value: 'ADX_STRONG_TREND', label: 'ADX Strong Trend', indicator: 'ADXIndicator', defaultValue: null, category: 'Trend' },
    { value: 'ADX_WEAK_TREND', label: 'ADX Weak Trend', indicator: 'ADXIndicator', defaultValue: null, category: 'Trend' },
    
    // ATR
    { value: 'ATR_HIGH_VOLATILITY', label: 'ATR High Volatility', indicator: 'ATRIndicator', defaultValue: null, category: 'Volatility' },
    
    // Parabolic SAR
    { value: 'PARABOLIC_SAR_BULLISH', label: 'Parabolic SAR Bullish', indicator: 'ParabolicSARIndicator', defaultValue: null, category: 'Trend' },
    { value: 'PARABOLIC_SAR_BEARISH', label: 'Parabolic SAR Bearish', indicator: 'ParabolicSARIndicator', defaultValue: null, category: 'Trend' },
    
    // CCI
    { value: 'CCI_OVERBOUGHT', label: 'CCI Overbought', indicator: 'CCIIndicator', defaultValue: null, category: 'Momentum' },
    { value: 'CCI_OVERSOLD', label: 'CCI Oversold', indicator: 'CCIIndicator', defaultValue: null, category: 'Momentum' },
    
    // Fibonacci
    { value: 'FIBONACCI_RETRACEMENT', label: 'Fibonacci Retracement', indicator: 'FibonacciIndicator', defaultValue: null, category: 'Support/Resistance' },
    
    // Support/Resistance
    { value: 'SUPPORT_BREAKOUT', label: 'Support Breakout', indicator: 'SupportResistanceIndicator', defaultValue: null, category: 'Support/Resistance' },
    { value: 'RESISTANCE_BREAKOUT', label: 'Resistance Breakout', indicator: 'SupportResistanceIndicator', defaultValue: null, category: 'Support/Resistance' },
    { value: 'WOODIES', label: 'Woodies Pivots', indicator: 'Woodies', defaultValue: null, category: 'Support/Resistance' },
    
    // Keltner Channels
    { value: 'KELTNER_UPPER_BREAKOUT', label: 'Keltner Upper Breakout', indicator: 'KeltnerIndicator', defaultValue: null, category: 'Volatility' },
    { value: 'KELTNER_LOWER_BREAKOUT', label: 'Keltner Lower Breakout', indicator: 'KeltnerIndicator', defaultValue: null, category: 'Volatility' },
    
    // Donchian Channels
    { value: 'DONCHIAN_UPPER_BREAKOUT', label: 'Donchian Upper Breakout', indicator: 'DonchianIndicator', defaultValue: null, category: 'Volatility' },
    { value: 'DONCHIAN_LOWER_BREAKOUT', label: 'Donchian Lower Breakout', indicator: 'DonchianIndicator', defaultValue: null, category: 'Volatility' },
    
    // Elder Impulse
    { value: 'ELDER_IMPULSE_BULL', label: 'Elder Impulse Bull', indicator: 'ElderImpulseIndicator', defaultValue: null, category: 'Trend' },
    { value: 'ELDER_IMPULSE_BEAR', label: 'Elder Impulse Bear', indicator: 'ElderImpulseIndicator', defaultValue: null, category: 'Trend' },
    { value: 'ELDER_IMPULSE_BLUE', label: 'Elder Impulse Blue', indicator: 'ElderImpulseIndicator', defaultValue: null, category: 'Trend' },
    
    // Multi-Divergence
    { value: 'MULTI_DIV', label: 'Multi Divergence', indicator: 'MultiDivergenceDetector', defaultValue: null, category: 'Advanced' },
  ],
  priceAction: [
    { value: 'GT', label: 'Greater Than (>)', operator: 'gt' },
    { value: 'LT', label: 'Less Than (<)', operator: 'lt' },
    { value: 'GTE', label: 'Greater Than or Equal (>=)', operator: 'gte' },
    { value: 'LTE', label: 'Less Than or Equal (<=)', operator: 'lte' },
    { value: 'EQ', label: 'Equal (=)', operator: 'eq' },
  ]
};

const availableSignalTypes = computed(() => {
  let signals = signalTypes[signalForm.value.signalCategory] || [];
  
  // Filter by category if indicator-based
  if (signalForm.value.signalCategory === 'indicator' && signalForm.value.filterCategory !== 'All') {
    signals = signals.filter(s => s.category === signalForm.value.filterCategory);
  }
  
  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    signals = signals.filter(s => 
      s.label.toLowerCase().includes(query) || 
      s.value.toLowerCase().includes(query)
    );
  }
  
  return signals;
});

const signalCategories = computed(() => {
  if (signalForm.value.signalCategory !== 'indicator') return [];
  
  const categories = new Set(signalTypes.indicator.map(s => s.category));
  return ['All', ...Array.from(categories).sort()];
});

const selectedSignalType = computed(() => {
  return availableSignalTypes.value.find(s => s.value === signalForm.value.signalType);
});

const onSignalTypeChange = () => {
  const selected = selectedSignalType.value;
  if (selected) {
    if (signalForm.value.signalCategory === 'indicator') {
      signalForm.value.indicator = selected.indicator;
      signalForm.value.value = selected.defaultValue;
    }
  }
};

const onCategoryChange = () => {
  signalForm.value.filterCategory = 'All';
  searchQuery.value = '';
  signalForm.value.signalType = availableSignalTypes.value[0]?.value || '';
  signalForm.value.indicator = availableSignalTypes.value[0]?.indicator || null;
  signalForm.value.value = availableSignalTypes.value[0]?.defaultValue ?? 0;
};

const generateSignalPayload = () => {
  const now = new Date().toISOString();
  const baseId = `${signalForm.value.symbol}-${signalForm.value.timeframe}`;
  
  let signalTypeLabel = '';
  let evaluate = '';
  
  if (signalForm.value.signalCategory === 'indicator') {
    signalTypeLabel = `INDICATOR_${signalForm.value.signalType}Signal`;
    
    // Generate evaluate function based on signal type
    const evaluateFunctions = {
      // RSI
      'RSI_OB': `(data, model) => { return { signal: data.value > model.value, data:data}; }`,
      'RSI_OS': `(data, model) => { return { signal: data.value < model.value, data:data}; }`,
      
      // SuperTrend
      'SUPERTREND_LONG': `(data, model) => { return { signal: data.trend === 'long', trend: data.trend, data:data }; }`,
      'SUPERTREND_SHORT': `(data, model) => { return { signal: data.trend === 'short', trend: data.trend, data:data }; }`,
      'UPTREND': `(data, model) => { return { signal: data.c > data, data:data} }`,
      'DOWNTREND': `(data, model) => { return { signal: data.c < data, data:data} }`,
      
      // EMA/Moving Averages
      'CROCODILE': `(data, model) => { return { signal: (data.ema2 > data.ema3) && (data.ema1 > data.ema2), data:data} }`,
      'CROCODILE_DIVE': `(data, model) => { return { signal: (data.ema2 < data.ema3) && (data.ema1 < data.ema2), data:data} }`,
      'CROSS_UP': `(data, value) => { return { signal: data.all.every(element => element > data.current), data:data } }`,
      'CROSS_DOWN': `(data, value) => { return { signal: data.all.every(element => element < data.current), data:data }; }`,
      'GOLDEN_CROSS': `(data, model) => { return { signal: data.fastMA > data.slowMA && data.prevFastMA <= data.prevSlowMA, data:data }; }`,
      'DEATH_CROSS': `(data, model) => { return { signal: data.fastMA < data.slowMA && data.prevFastMA >= data.prevSlowMA, data:data }; }`,
      'MA_SUPPORT': `(data, model) => { return { signal: data.low <= data.ma && data.close > data.ma, data:data }; }`,
      'MA_RESISTANCE': `(data, model) => { return { signal: data.high >= data.ma && data.close < data.ma, data:data }; }`,
      'TEMA_BULLISH': `(data, model) => { return { signal: data.tema > data.prevTema && data.close > data.tema, data:data }; }`,
      'TEMA_BEARISH': `(data, model) => { return { signal: data.tema < data.prevTema && data.close < data.tema, data:data }; }`,
      
      // MACD
      'MACD_BULLISH': `(data, model) => { return { signal: data.macd > data.signal && data.prevMacd <= data.prevSignal, data:data }; }`,
      'MACD_BEARISH': `(data, model) => { return { signal: data.macd < data.signal && data.prevMacd >= data.prevSignal, data:data }; }`,
      'MACD_HISTOGRAM_POSITIVE': `(data, model) => { return { signal: data.histogram > 0 && data.prevHistogram <= 0, data:data }; }`,
      'MACD_HISTOGRAM_NEGATIVE': `(data, model) => { return { signal: data.histogram < 0 && data.prevHistogram >= 0, data:data }; }`,
      
      // Bollinger Bands
      'BOLLINGER_UPPER_TOUCH': `(data, model) => { return { signal: data.close >= data.upper, data:data }; }`,
      'BOLLINGER_LOWER_TOUCH': `(data, model) => { return { signal: data.close <= data.lower, data:data }; }`,
      'BOLLINGER_SQUEEZE': `(data, model) => { return { signal: (data.upper - data.lower) < data.threshold, data:data }; }`,
      'BOLLINGER_EXPANSION': `(data, model) => { return { signal: (data.upper - data.lower) > data.threshold, data:data }; }`,
      
      // Stochastic
      'STOCHASTIC_OVERBOUGHT': `(data, model) => { return { signal: data.k > 80, data:data }; }`,
      'STOCHASTIC_OVERSOLD': `(data, model) => { return { signal: data.k < 20, data:data }; }`,
      'STOCHASTIC_BULLISH_CROSS': `(data, model) => { return { signal: data.k > data.d && data.prevK <= data.prevD, data:data }; }`,
      'STOCHASTIC_BEARISH_CROSS': `(data, model) => { return { signal: data.k < data.d && data.prevK >= data.prevD, data:data }; }`,
      
      // Williams %R
      'WILLIAMS_OVERBOUGHT': `(data, model) => { return { signal: data.value > -20, data:data }; }`,
      'WILLIAMS_OVERSOLD': `(data, model) => { return { signal: data.value < -80, data:data }; }`,
      
      // Volume
      'VOLUME_SPIKE': `(data, model) => { return { signal: data.volume > data.avgVolume * 2, data:data }; }`,
      'OBV_BULLISH': `(data, model) => { return { signal: data.obv > data.prevObv && data.sma > data.prevSma, data:data }; }`,
      'OBV_BEARISH': `(data, model) => { return { signal: data.obv < data.prevObv && data.sma < data.prevSma, data:data }; }`,
      'MFI_OVERBOUGHT': `(data, model) => { return { signal: data.mfi > 80, data:data }; }`,
      'MFI_OVERSOLD': `(data, model) => { return { signal: data.mfi < 20, data:data }; }`,
      
      // Ichimoku
      'ICHIMOKU_BULLISH': `(data, model) => { return { signal: data.close > data.cloudTop && data.tenkan > data.kijun, data:data }; }`,
      'ICHIMOKU_BEARISH': `(data, model) => { return { signal: data.close < data.cloudBottom && data.tenkan < data.kijun, data:data }; }`,
      'ICHIMOKU_TK_CROSS_BULLISH': `(data, model) => { return { signal: data.tenkan > data.kijun && data.prevTenkan <= data.prevKijun, data:data }; }`,
      'ICHIMOKU_TK_CROSS_BEARISH': `(data, model) => { return { signal: data.tenkan < data.kijun && data.prevTenkan >= data.prevKijun, data:data }; }`,
      
      // ADX
      'ADX_STRONG_TREND': `(data, model) => { return { signal: data.adx > 25, data:data }; }`,
      'ADX_WEAK_TREND': `(data, model) => { return { signal: data.adx < 20, data:data }; }`,
      
      // ATR
      'ATR_HIGH_VOLATILITY': `(data, model) => { return { signal: data.atr > data.atrMA, data:data }; }`,
      
      // Parabolic SAR
      'PARABOLIC_SAR_BULLISH': `(data, model) => { return { signal: data.close > data.sar, data:data }; }`,
      'PARABOLIC_SAR_BEARISH': `(data, model) => { return { signal: data.close < data.sar, data:data }; }`,
      
      // CCI
      'CCI_OVERBOUGHT': `(data, model) => { return { signal: data.cci > 100, data:data }; }`,
      'CCI_OVERSOLD': `(data, model) => { return { signal: data.cci < -100, data:data }; }`,
      
      // Fibonacci
      'FIBONACCI_RETRACEMENT': `(data, model) => { return { signal: data.atLevel, level: data.level, data:data }; }`,
      
      // Support/Resistance
      'SUPPORT_BREAKOUT': `(data, model) => { return { signal: data.close > data.support && data.prevClose <= data.support, data:data }; }`,
      'RESISTANCE_BREAKOUT': `(data, model) => { return { signal: data.close > data.resistance && data.prevClose <= data.resistance, data:data }; }`,
      'WOODIES': `(data, model) => {
        let currentPrice = data.c;
        let woodie = data.data.woodies;
        if(currentPrice <= woodie.s2) {return {signal:true, type:"strong support", data:data}}
        if(currentPrice <= woodie.s1) {return {signal:true, type:"first support", data:data}}
        if(currentPrice >= woodie.r2) {return {signal:true, type:"strong resistance", data:data}}
        if(currentPrice >= woodie.r1) {return {signal:true, type:"first resistance", data:data}}
        return {signal: false, data:data}
      }`,
      
      // Keltner Channels
      'KELTNER_UPPER_BREAKOUT': `(data, model) => { return { signal: data.close > data.upper, data:data }; }`,
      'KELTNER_LOWER_BREAKOUT': `(data, model) => { return { signal: data.close < data.lower, data:data }; }`,
      
      // Donchian Channels
      'DONCHIAN_UPPER_BREAKOUT': `(data, model) => { return { signal: data.close > data.upper, data:data }; }`,
      'DONCHIAN_LOWER_BREAKOUT': `(data, model) => { return { signal: data.close < data.lower, data:data }; }`,
      
      // Elder Impulse
      'ELDER_IMPULSE_BULL': `(data, model) => { return { signal: data.color === 'green', data:data }; }`,
      'ELDER_IMPULSE_BEAR': `(data, model) => { return { signal: data.color === 'red', data:data }; }`,
      'ELDER_IMPULSE_BLUE': `(data, model) => { return { signal: data.color === 'blue', data:data }; }`,
      
      // Multi-Divergence
      'MULTI_DIV': `(data, model) => {
        const confirmedDivergences = data.divergence.filter(div => div.type !== 'Pending Divergence').map(div => div.indicator);
        if (data.c && data.hasDivergence) {
          return { signal: true, divergence: confirmedDivergences, data:data };
        }
        return { signal: false, divergence: "pending", data:data };
      }`,
    };
    
    evaluate = evaluateFunctions[signalForm.value.signalType] || `(data, model) => { return { signal: false, data:data }; }`;
    
    return {
      id: `${baseId}-${signalForm.value.indicator}`,
      symbol: signalForm.value.symbol,
      timeframe: signalForm.value.timeframe,
      indicator: signalForm.value.indicator,
      signalType: signalTypeLabel,
      value: signalForm.value.value,
      createdOn: now,
      updatedOn: now,
      lastExecuted: now,
      isActive: true,
      nextInvocation: now,
      maxTriggerTimes: signalForm.value.maxTriggerTimes,
      triggerCount: 0,
      evaluate: evaluate,
      indicatorArgs: signalForm.value.indicatorArgs
    };
  } else {
    // Price Action
    const operator = selectedSignalType.value?.operator || 'gt';
    signalTypeLabel = `PRICE_ACTION_${operator.toUpperCase()}-${signalForm.value.value}`;
    
    switch (operator) {
      case 'gt':
        evaluate = `(data, model) => { return { signal: data.value > model.value, data:data}; }`;
        break;
      case 'lt':
        evaluate = `(data, model) => { return { signal: data.value < model.value, data:data}; }`;
        break;
      case 'gte':
        evaluate = `(data, model) => { return data.value >= model.value; }`;
        break;
      case 'lte':
        evaluate = `(data, model) => { return { signal: data.value <= model.value, data:data}; }`;
        break;
      case 'eq':
        evaluate = `(data, model) => { return { signal: data.value === model.value, data:data}; }`;
        break;
    }
    
    return {
      id: `${baseId}-${signalTypeLabel}`,
      symbol: signalForm.value.symbol,
      timeframe: signalForm.value.timeframe,
      indicator: null,
      signalType: signalTypeLabel,
      value: signalForm.value.value,
      createdOn: now,
      updatedOn: now,
      lastExecuted: now,
      isActive: true,
      nextInvocation: now,
      maxTriggerTimes: signalForm.value.maxTriggerTimes,
      triggerCount: 0,
      evaluate: evaluate,
      indicatorArgs: {}
    };
  }
};

const createSignal = async () => {
  loading.value = true;
  success.value = null;
  error.value = null;
  
  try {
    const payload = generateSignalPayload();
    console.log('Creating signal:', payload);
    
    const response = await apiClient.post('/api/signals', payload);
    success.value = 'Signal created successfully!';
    
    // Reset form after 2 seconds
    setTimeout(() => {
      success.value = null;
    }, 3000);
  } catch (err) {
    error.value = 'Failed to create signal: ' + err.message;
    console.error('Error creating signal:', err);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="p-4">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-white mb-2">Signal Configuration</h1>
      <p class="text-gray-400">Create and configure trading signals</p>
    </div>

    <!-- Success/Error Messages -->
    <div v-if="success" class="mb-4 p-4 bg-green-900 border border-green-500 rounded-lg text-green-200">
      {{ success }}
    </div>
    <div v-if="error" class="mb-4 p-4 bg-red-900 border border-red-500 rounded-lg text-red-200">
      {{ error }}
    </div>

    <!-- Signal Form -->
    <div class="card p-6 max-w-2xl">
      <form @submit.prevent="createSignal" class="space-y-6">
        
        <!-- Symbol Selection -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Symbol</label>
          <div class="text-white font-semibold mb-2">{{ signalForm.symbol }}</div>
          <SymbolSearch @select="updateSymbol" />
        </div>        <!-- Timeframe Selection -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Timeframe</label>
          <select
            v-model="signalForm.timeframe"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
          >
            <option v-for="interval in intervals" :key="interval.value" :value="interval.value">
              {{ interval.label }}
            </option>
          </select>
        </div>

        <!-- Signal Category -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Signal Category</label>
          <div class="flex gap-4">
            <label class="flex items-center cursor-pointer">
              <input
                type="radio"
                v-model="signalForm.signalCategory"
                value="indicator"
                @change="onCategoryChange"
                class="mr-2"
              />
              <span class="text-white">Indicator Based</span>
            </label>
            <label class="flex items-center cursor-pointer">
              <input
                type="radio"
                v-model="signalForm.signalCategory"
                value="priceAction"
                @change="onCategoryChange"
                class="mr-2"
              />
              <span class="text-white">Price Action</span>
            </label>
          </div>
        </div>

        <!-- Category Filter (only for indicators) -->
        <div v-if="signalForm.signalCategory === 'indicator'">
          <label class="block text-sm font-medium text-gray-300 mb-2">Filter by Category</label>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            <button
              v-for="category in signalCategories"
              :key="category"
              type="button"
              @click="signalForm.filterCategory = category"
              :class="[
                'px-2 py-1.5 rounded text-xs font-medium transition-colors',
                signalForm.filterCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              ]"
            >
              {{ category }}
            </button>
          </div>
        </div>

        <!-- Search -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Search Signals</label>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Type to search signals..."
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
          />
        </div>

        <!-- Signal Type -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Signal Type 
            <span class="text-gray-500 text-xs ml-2">({{ availableSignalTypes.length }} available)</span>
          </label>
          <select
            v-model="signalForm.signalType"
            @change="onSignalTypeChange"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none max-h-64 overflow-y-auto"
            size="5"
          >
            <option v-for="type in availableSignalTypes" :key="type.value" :value="type.value">
              {{ type.label }}
              <span v-if="type.category" class="text-gray-500">- {{ type.category }}</span>
            </option>
          </select>
          <p class="text-xs text-gray-500 mt-1">{{ selectedSignalType?.label || 'Select a signal type' }}</p>
        </div>

        <!-- Value Input (conditional) -->
        <div v-if="selectedSignalType && (signalForm.signalCategory === 'priceAction' || ['RSI_OB', 'RSI_OS'].includes(signalForm.signalType))">
          <label class="block text-sm font-medium text-gray-300 mb-2">Threshold Value</label>
          <input
            type="number"
            v-model.number="signalForm.value"
            step="0.01"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
            placeholder="Enter value"
          />
        </div>

        <!-- Max Trigger Times -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Max Trigger Times</label>
          <input
            type="number"
            v-model.number="signalForm.maxTriggerTimes"
            min="1"
            max="100"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
          />
          <p class="text-xs text-gray-500 mt-1">Signal will be deactivated after this many triggers</p>
        </div>

        <!-- Submit Button -->
        <div class="flex gap-4">
          <button
            type="submit"
            :disabled="loading"
            class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? 'Creating...' : 'Create Signal' }}
          </button>
          <router-link
            to="/signals"
            class="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg text-center transition-colors"
          >
            View All Signals
          </router-link>
        </div>
      </form>
    </div>

    <!-- Info Section -->
    <div class="card p-6 mt-6 max-w-2xl">
      <h3 class="text-lg font-bold text-white mb-4">📚 Signal Categories Guide</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div class="bg-gray-800 bg-opacity-50 p-3 rounded">
          <span class="font-semibold text-blue-400 block mb-1">🎯 Momentum ({{ signalTypes.indicator.filter(s => s.category === 'Momentum').length }})</span>
          <span class="text-gray-300 text-xs">RSI, MACD, Stochastic, Williams %R, CCI</span>
        </div>
        <div class="bg-gray-800 bg-opacity-50 p-3 rounded">
          <span class="font-semibold text-green-400 block mb-1">📈 Trend ({{ signalTypes.indicator.filter(s => s.category === 'Trend').length }})</span>
          <span class="text-gray-300 text-xs">SuperTrend, EMA, Ichimoku, ADX, SAR</span>
        </div>
        <div class="bg-gray-800 bg-opacity-50 p-3 rounded">
          <span class="font-semibold text-purple-400 block mb-1">📊 Volatility ({{ signalTypes.indicator.filter(s => s.category === 'Volatility').length }})</span>
          <span class="text-gray-300 text-xs">Bollinger, ATR, Keltner, Donchian</span>
        </div>
        <div class="bg-gray-800 bg-opacity-50 p-3 rounded">
          <span class="font-semibold text-yellow-400 block mb-1">📢 Volume ({{ signalTypes.indicator.filter(s => s.category === 'Volume').length }})</span>
          <span class="text-gray-300 text-xs">Volume Spike, OBV, MFI</span>
        </div>
        <div class="bg-gray-800 bg-opacity-50 p-3 rounded">
          <span class="font-semibold text-red-400 block mb-1">🎚️ Support/Resistance ({{ signalTypes.indicator.filter(s => s.category === 'Support/Resistance').length }})</span>
          <span class="text-gray-300 text-xs">Fibonacci, Pivots, Breakouts</span>
        </div>
        <div class="bg-gray-800 bg-opacity-50 p-3 rounded">
          <span class="font-semibold text-cyan-400 block mb-1">🔬 Advanced ({{ signalTypes.indicator.filter(s => s.category === 'Advanced').length }})</span>
          <span class="text-gray-300 text-xs">Multi-Divergence Detection</span>
        </div>
      </div>
      
      <div class="mt-4 pt-4 border-t border-gray-700">
        <p class="text-gray-400 text-xs">
          💡 <strong>Total: {{ signalTypes.indicator.length }} indicator signals</strong> available. 
          Use the category filters and search to quickly find the signal you need.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  background: rgba(17, 24, 39, 0.8);
  border: 1px solid rgba(75, 85, 99, 0.3);
  border-radius: 0.5rem;
}

input[type="radio"] {
  accent-color: #3b82f6;
}
</style>
