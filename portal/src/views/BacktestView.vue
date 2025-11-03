<script setup>
import { ref, computed } from 'vue';
import apiClient from '../services/api.js';
import SymbolSearch from '../components/SymbolSearch.vue';

const backtestForm = ref({
  symbol: 'BTCUSDT',
  timeframe: '1h',
  signalCategory: 'indicator',
  signalType: 'RsiOsSignal',
  indicator: 'RsiIndicator',
  value: 30,
  iterations: 10,
  candles: 200,
  risk: 2,
  reward: 5,
  capital: 10000,
  filterCategory: 'All'
});

const loading = ref(false);
const results = ref(null);
const error = ref(null);
const searchQuery = ref('');

const updateSymbol = (symbolData) => {
  backtestForm.value.symbol = symbolData.symbol || symbolData;
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
    { value: 'RsiObSignal', label: 'RSI Overbought', indicator: 'RsiIndicator', defaultValue: 70, category: 'Momentum' },
    { value: 'RsiOsSignal', label: 'RSI Oversold', indicator: 'RsiIndicator', defaultValue: 30, category: 'Momentum' },
    
    // SuperTrend Signals
    { value: 'SuperTrendSignal', label: 'SuperTrend Long', indicator: 'SuperTrendIndicator', defaultValue: 'long', category: 'Trend' },
    { value: 'UptrendSignal', label: 'Uptrend', indicator: 'SuperTrendIndicator', defaultValue: null, category: 'Trend' },
    { value: 'DownTrendSignal', label: 'Downtrend', indicator: 'SuperTrendIndicator', defaultValue: null, category: 'Trend' },
    
    // EMA Signals
    { value: 'CrocodileSignal', label: 'Crocodile (EMA Bullish)', indicator: 'Ema3Indicator', defaultValue: null, category: 'Trend' },
    { value: 'CrocodileDiveSignal', label: 'Crocodile Dive (EMA Bearish)', indicator: 'Ema3Indicator', defaultValue: null, category: 'Trend' },
    { value: 'CrossUpSignal', label: 'EMA Cross Up', indicator: 'EMAIndicator', defaultValue: null, category: 'Trend' },
    { value: 'CrossDownSignal', label: 'EMA Cross Down', indicator: 'EMAIndicator', defaultValue: null, category: 'Trend' },
    { value: 'GoldenCrossSignal', label: 'Golden Cross', indicator: 'Ema3Indicator', defaultValue: null, category: 'Trend' },
    { value: 'DeathCrossSignal', label: 'Death Cross', indicator: 'Ema3Indicator', defaultValue: null, category: 'Trend' },
    { value: 'MaSupportSignal', label: 'MA Support', indicator: 'EMAIndicator', defaultValue: null, category: 'Trend' },
    { value: 'MaResistanceSignal', label: 'MA Resistance', indicator: 'EMAIndicator', defaultValue: null, category: 'Trend' },
    
    // MACD Signals
    { value: 'MacdBullishSignal', label: 'MACD Bullish Cross', indicator: 'MacdIndicator', defaultValue: null, category: 'Momentum' },
    { value: 'MacdBearishSignal', label: 'MACD Bearish Cross', indicator: 'MacdIndicator', defaultValue: null, category: 'Momentum' },
    { value: 'MacdHistogramPositiveSignal', label: 'MACD Histogram Positive', indicator: 'MacdIndicator', defaultValue: null, category: 'Momentum' },
    { value: 'MacdHistogramNegativeSignal', label: 'MACD Histogram Negative', indicator: 'MacdIndicator', defaultValue: null, category: 'Momentum' },
    
    // Bollinger Bands
    { value: 'BollingerUpperTouchSignal', label: 'Bollinger Upper Touch', indicator: 'BollingerIndicator', defaultValue: null, category: 'Volatility' },
    { value: 'BollingerLowerTouchSignal', label: 'Bollinger Lower Touch', indicator: 'BollingerIndicator', defaultValue: null, category: 'Volatility' },
    { value: 'BollingerSqueezeSignal', label: 'Bollinger Squeeze', indicator: 'BollingerIndicator', defaultValue: null, category: 'Volatility' },
    { value: 'BollingerExpansionSignal', label: 'Bollinger Expansion', indicator: 'BollingerIndicator', defaultValue: null, category: 'Volatility' },
    
    // Stochastic Signals
    { value: 'StochasticOverboughtSignal', label: 'Stochastic Overbought', indicator: 'StochasticIndicator', defaultValue: 80, category: 'Momentum' },
    { value: 'StochasticOversoldSignal', label: 'Stochastic Oversold', indicator: 'StochasticIndicator', defaultValue: 20, category: 'Momentum' },
    { value: 'StochasticBullishCrossSignal', label: 'Stochastic Bullish Cross', indicator: 'StochasticIndicator', defaultValue: null, category: 'Momentum' },
    { value: 'StochasticBearishCrossSignal', label: 'Stochastic Bearish Cross', indicator: 'StochasticIndicator', defaultValue: null, category: 'Momentum' },
    
    // Williams %R Signals
    { value: 'WilliamsOverboughtSignal', label: 'Williams %R Overbought', indicator: 'WilliamsRIndicator', defaultValue: -20, category: 'Momentum' },
    { value: 'WilliamsOversoldSignal', label: 'Williams %R Oversold', indicator: 'WilliamsRIndicator', defaultValue: -80, category: 'Momentum' },
    
    // Volume Signals
    { value: 'VolumeSpikeSignal', label: 'Volume Spike', indicator: 'ObvIndicator', defaultValue: null, category: 'Volume' },
    { value: 'ObvBullishSignal', label: 'OBV Bullish', indicator: 'ObvIndicator', defaultValue: null, category: 'Volume' },
    { value: 'ObvBearishSignal', label: 'OBV Bearish', indicator: 'ObvIndicator', defaultValue: null, category: 'Volume' },
    
    // Ichimoku Signals
    { value: 'IchimokuBullishSignal', label: 'Ichimoku Bullish', indicator: 'IchimokuCloudIndicator', defaultValue: null, category: 'Trend' },
    { value: 'IchimokuBearishSignal', label: 'Ichimoku Bearish', indicator: 'IchimokuCloudIndicator', defaultValue: null, category: 'Trend' },
    { value: 'IchimokuTkCrossBullishSignal', label: 'Ichimoku TK Bullish Cross', indicator: 'IchimokuCloudIndicator', defaultValue: null, category: 'Trend' },
    { value: 'IchimokuTkCrossBearishSignal', label: 'Ichimoku TK Bearish Cross', indicator: 'IchimokuCloudIndicator', defaultValue: null, category: 'Trend' },
    
    // ADX Signals
    { value: 'AdxStrongTrendSignal', label: 'ADX Strong Trend', indicator: 'AdxIndicator', defaultValue: 25, category: 'Trend' },
    { value: 'AdxWeakTrendSignal', label: 'ADX Weak Trend', indicator: 'AdxIndicator', defaultValue: 20, category: 'Trend' },
    
    // MFI Signals
    { value: 'MfiOverboughtSignal', label: 'MFI Overbought', indicator: 'MfiIndicator', defaultValue: 80, category: 'Momentum' },
    { value: 'MfiOversoldSignal', label: 'MFI Oversold', indicator: 'MfiIndicator', defaultValue: 20, category: 'Momentum' },
    
    // ATR Signals
    { value: 'AtrHighVolatilitySignal', label: 'ATR High Volatility', indicator: 'AtrIndicator', defaultValue: null, category: 'Volatility' },
    
    // Parabolic SAR Signals
    { value: 'ParabolicSarBullishSignal', label: 'Parabolic SAR Bullish', indicator: 'PsarIndicator', defaultValue: null, category: 'Trend' },
    { value: 'ParabolicSarBearishSignal', label: 'Parabolic SAR Bearish', indicator: 'PsarIndicator', defaultValue: null, category: 'Trend' },
    
    // CCI Signals
    { value: 'CciOverboughtSignal', label: 'CCI Overbought', indicator: 'CciIndicator', defaultValue: 100, category: 'Momentum' },
    { value: 'CciOversoldSignal', label: 'CCI Oversold', indicator: 'CciIndicator', defaultValue: -100, category: 'Momentum' },
    
    // Divergence
    { value: 'DivergenceDetector', label: 'Multi-Divergence', indicator: 'MultiDivergenceDetector', defaultValue: null, category: 'Pattern' },
    
    // Pivot Points
    { value: 'Woodies', label: 'Woodies Pivots', indicator: 'Woodies', defaultValue: null, category: 'Support/Resistance' },
    
    // Advanced Signals
    { value: 'FibonacciRetracementSignal', label: 'Fibonacci Retracement', indicator: 'price', defaultValue: null, category: 'Support/Resistance' },
    { value: 'SupportBreakoutSignal', label: 'Support Breakout', indicator: 'SupportAndResistance', defaultValue: null, category: 'Support/Resistance' },
    { value: 'ResistanceBreakoutSignal', label: 'Resistance Breakout', indicator: 'SupportAndResistance', defaultValue: null, category: 'Support/Resistance' },
    { value: 'TemaBullishSignal', label: 'TEMA Bullish', indicator: 'TrixIndicator', defaultValue: null, category: 'Trend' },
    { value: 'TemaBearishSignal', label: 'TEMA Bearish', indicator: 'TrixIndicator', defaultValue: null, category: 'Trend' },
    { value: 'KeltnerUpperBreakoutSignal', label: 'Keltner Upper Breakout', indicator: 'KeltnerIndicator', defaultValue: null, category: 'Volatility' },
    { value: 'KeltnerLowerBreakoutSignal', label: 'Keltner Lower Breakout', indicator: 'KeltnerIndicator', defaultValue: null, category: 'Volatility' },
    { value: 'DonchianUpperBreakoutSignal', label: 'Donchian Upper Breakout', indicator: 'price', defaultValue: null, category: 'Volatility' },
    { value: 'DonchianLowerBreakoutSignal', label: 'Donchian Lower Breakout', indicator: 'price', defaultValue: null, category: 'Volatility' },
    { value: 'ElderImpulseBullSignal', label: 'Elder Impulse Bull', indicator: 'MacdIndicator', defaultValue: null, category: 'Pattern' },
    { value: 'ElderImpulseBearSignal', label: 'Elder Impulse Bear', indicator: 'MacdIndicator', defaultValue: null, category: 'Pattern' },
    { value: 'ElderImpulseBlueSignal', label: 'Elder Impulse Blue', indicator: 'MacdIndicator', defaultValue: null, category: 'Pattern' },
  ],
  priceAction: [
    { value: 'GT', label: 'Greater Than (>)', operator: 'gt' },
    { value: 'LT', label: 'Less Than (<)', operator: 'lt' },
    { value: 'GTE', label: 'Greater Than or Equal (>=)', operator: 'gte' },
    { value: 'LTE', label: 'Less Than or Equal (<=)', operator: 'lte' },
  ]
};

const availableSignalTypes = computed(() => {
  let signals = signalTypes[backtestForm.value.signalCategory] || [];
  
  if (backtestForm.value.signalCategory === 'indicator' && backtestForm.value.filterCategory !== 'All') {
    signals = signals.filter(s => s.category === backtestForm.value.filterCategory);
  }
  
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
  if (backtestForm.value.signalCategory !== 'indicator') return [];
  const categories = new Set(signalTypes.indicator.map(s => s.category));
  return ['All', ...Array.from(categories).sort()];
});

const selectedSignalType = computed(() => {
  return availableSignalTypes.value.find(s => s.value === backtestForm.value.signalType);
});

const onSignalTypeChange = () => {
  const selected = selectedSignalType.value;
  if (selected && backtestForm.value.signalCategory === 'indicator') {
    backtestForm.value.indicator = selected.indicator;
    backtestForm.value.value = selected.defaultValue;
  }
};

const onCategoryChange = () => {
  backtestForm.value.filterCategory = 'All';
  searchQuery.value = '';
  backtestForm.value.signalType = availableSignalTypes.value[0]?.value || '';
  backtestForm.value.indicator = availableSignalTypes.value[0]?.indicator || null;
  backtestForm.value.value = availableSignalTypes.value[0]?.defaultValue ?? 0;
};

const runBacktest = async () => {
  loading.value = true;
  error.value = null;
  results.value = null;
  
  try {
    // Create backtest payload similar to CLI
    const payload = {
      symbol: backtestForm.value.symbol,
      timeframe: backtestForm.value.timeframe,
      signalType: `INDICATOR_${backtestForm.value.signalType}`, // Don't add "Signal" suffix - values already have it
      indicator: backtestForm.value.indicator,
      value: backtestForm.value.value,
      iterations: backtestForm.value.iterations,
      candles: backtestForm.value.candles,
      risk: backtestForm.value.risk,
      reward: backtestForm.value.reward,
      capital: backtestForm.value.capital
    };
    
    console.log('Running backtest with payload:', payload);
    
    const response = await apiClient.post('/api/backtest', payload);
    results.value = response.data;
    
    console.log('Backtest results:', results.value);
  } catch (err) {
    error.value = 'Failed to run backtest: ' + (err.response?.data?.message || err.message);
    console.error('Error running backtest:', err);
  } finally {
    loading.value = false;
  }
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const formatPercent = (value) => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatTradeTime = (dateString) => {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

const resetForm = () => {
  results.value = null;
  error.value = null;
};
</script>

<template>
  <div class="p-4">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-white mb-2">Strategy Backtest</h1>
      <p class="text-gray-400">Test trading signals against historical data</p>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="mb-4 p-4 bg-red-900 border border-red-500 rounded-lg text-red-200">
      {{ error }}
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      
      <!-- Configuration Panel -->
      <div class="xl:col-span-1">
        <div class="card p-6 sticky top-4">
          <h2 class="text-xl font-bold text-white mb-4">⚙️ Configuration</h2>
          
          <form @submit.prevent="runBacktest" class="space-y-4">
            
            <!-- Symbol -->
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Symbol</label>
              <div class="text-white font-semibold mb-2">{{ backtestForm.symbol }}</div>
              <SymbolSearch @select="updateSymbol" />
            </div>

            <!-- Timeframe -->
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Timeframe</label>
              <select
                v-model="backtestForm.timeframe"
                class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
              >
                <option v-for="interval in intervals" :key="interval.value" :value="interval.value">
                  {{ interval.label }}
                </option>
              </select>
            </div>

            <!-- Signal Category -->
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Signal Type</label>
              <div class="flex gap-2">
                <label class="flex items-center cursor-pointer flex-1">
                  <input
                    type="radio"
                    v-model="backtestForm.signalCategory"
                    value="indicator"
                    @change="onCategoryChange"
                    class="mr-2"
                  />
                  <span class="text-white text-sm">Indicator</span>
                </label>
                <label class="flex items-center cursor-pointer flex-1">
                  <input
                    type="radio"
                    v-model="backtestForm.signalCategory"
                    value="priceAction"
                    @change="onCategoryChange"
                    class="mr-2"
                  />
                  <span class="text-white text-sm">Price Action</span>
                </label>
              </div>
            </div>

            <!-- Category Filter -->
            <div v-if="backtestForm.signalCategory === 'indicator'">
              <label class="block text-sm font-medium text-gray-300 mb-2">Filter</label>
              <div class="grid grid-cols-2 gap-1.5">
                <button
                  v-for="category in signalCategories"
                  :key="category"
                  type="button"
                  @click="backtestForm.filterCategory = category"
                  :class="[
                    'px-2 py-1 rounded text-xs font-medium transition-colors',
                    backtestForm.filterCategory === category
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
              <input
                type="text"
                v-model="searchQuery"
                placeholder="Search signals..."
                class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <!-- Signal Selection -->
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">
                Strategy <span class="text-gray-500 text-xs">({{ availableSignalTypes.length }})</span>
              </label>
              <select
                v-model="backtestForm.signalType"
                @change="onSignalTypeChange"
                class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                size="4"
              >
                <option v-for="type in availableSignalTypes" :key="type.value" :value="type.value">
                  {{ type.label }}
                </option>
              </select>
            </div>

            <!-- Value (conditional) -->
            <div v-if="selectedSignalType && ['RsiObSignal', 'RsiOsSignal', 'StochasticOverboughtSignal', 'StochasticOversoldSignal', 'WilliamsOverboughtSignal', 'WilliamsOversoldSignal', 'AdxStrongTrendSignal', 'AdxWeakTrendSignal', 'MfiOverboughtSignal', 'MfiOversoldSignal', 'CciOverboughtSignal', 'CciOversoldSignal'].includes(backtestForm.signalType)">
              <label class="block text-sm font-medium text-gray-300 mb-2">Threshold</label>
              <input
                type="number"
                v-model.number="backtestForm.value"
                step="1"
                class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <!-- Advanced Settings -->
            <div class="pt-4 border-t border-gray-700">
              <h3 class="text-sm font-semibold text-gray-300 mb-3">Backtest Parameters</h3>
              
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs text-gray-400 mb-1">Iterations</label>
                  <input
                    type="number"
                    v-model.number="backtestForm.iterations"
                    min="1"
                    max="50"
                    class="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label class="block text-xs text-gray-400 mb-1">Candles</label>
                  <input
                    type="number"
                    v-model.number="backtestForm.candles"
                    min="50"
                    max="1000"
                    step="50"
                    class="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label class="block text-xs text-gray-400 mb-1">Risk %</label>
                  <input
                    type="number"
                    v-model.number="backtestForm.risk"
                    min="0.1"
                    max="10"
                    step="0.1"
                    class="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label class="block text-xs text-gray-400 mb-1">Reward %</label>
                  <input
                    type="number"
                    v-model.number="backtestForm.reward"
                    min="0.1"
                    max="20"
                    step="0.1"
                    class="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div class="col-span-2">
                  <label class="block text-xs text-gray-400 mb-1">Initial Capital ($)</label>
                  <input
                    type="number"
                    v-model.number="backtestForm.capital"
                    min="100"
                    step="100"
                    class="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <!-- Buttons -->
            <div class="flex gap-2 pt-4">
              <button
                type="submit"
                :disabled="loading"
                class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ loading ? '🔄 Running...' : '▶️ Run Backtest' }}
              </button>
              <button
                v-if="results"
                type="button"
                @click="resetForm"
                class="px-4 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors"
              >
                🔄
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Results Panel -->
      <div class="xl:col-span-2">
        
        <!-- Loading State -->
        <div v-if="loading" class="card p-12 text-center">
          <div class="animate-pulse text-gray-400">
            <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p class="text-lg">Running backtest simulation...</p>
            <p class="text-sm mt-2">Analyzing {{ backtestForm.iterations }} iterations × {{ backtestForm.candles }} candles</p>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="!results" class="card p-12 text-center">
          <div class="text-gray-400">
            <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p class="text-lg mb-2">No Results Yet</p>
            <p class="text-sm">Configure your backtest parameters and click "Run Backtest" to see results</p>
          </div>
        </div>

        <!-- Results Display -->
        <div v-else class="space-y-4">
          
          <!-- Performance Overview -->
          <div class="card p-6">
            <h2 class="text-xl font-bold text-white mb-4">📊 Performance Overview</h2>
            
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div class="text-center">
                <div class="text-gray-400 text-xs mb-1">Initial Capital</div>
                <div class="text-white font-bold text-lg">{{ formatCurrency(results.performance.initialCapital) }}</div>
              </div>
              <div class="text-center">
                <div class="text-gray-400 text-xs mb-1">Final Capital</div>
                <div :class="['font-bold text-lg', parseFloat(results.performance.returnPercent) >= 0 ? 'text-green-400' : 'text-red-400']">
                  {{ formatCurrency(results.performance.finalCapital) }}
                </div>
              </div>
              <div class="text-center">
                <div class="text-gray-400 text-xs mb-1">Net Profit</div>
                <div :class="['font-bold text-lg', results.performance.netProfit >= 0 ? 'text-green-400' : 'text-red-400']">
                  {{ formatCurrency(results.performance.netProfit) }}
                </div>
              </div>
              <div class="text-center">
                <div class="text-gray-400 text-xs mb-1">Return</div>
                <div :class="['font-bold text-lg', parseFloat(results.performance.returnPercent) >= 0 ? 'text-green-400' : 'text-red-400']">
                  {{ formatPercent(parseFloat(results.performance.returnPercent)) }}
                </div>
              </div>
            </div>

            <!-- Max Drawdown -->
            <div class="bg-gray-800 bg-opacity-50 rounded-lg p-4">
              <div class="flex justify-between items-center mb-2">
                <span class="text-gray-400 text-sm">Maximum Drawdown</span>
                <span class="text-red-400 font-bold">{{ formatPercent(parseFloat(results.performance.maxDrawdown)) }}</span>
              </div>
              <div class="w-full bg-gray-700 rounded-full h-2">
                <div 
                  class="bg-red-500 h-2 rounded-full"
                  :style="{ width: Math.abs(parseFloat(results.performance.maxDrawdown)) + '%' }"
                ></div>
              </div>
            </div>
          </div>

          <!-- Trade Statistics -->
          <div class="card p-6">
            <h2 class="text-xl font-bold text-white mb-4">📈 Trade Statistics</h2>
            
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <div class="text-gray-400 text-xs mb-1">Total Trades</div>
                <div class="text-white font-bold text-2xl">{{ results.trades.total }}</div>
              </div>
              <div>
                <div class="text-gray-400 text-xs mb-1">Wins</div>
                <div class="text-green-400 font-bold text-2xl">{{ results.trades.wins }}</div>
              </div>
              <div>
                <div class="text-gray-400 text-xs mb-1">Losses</div>
                <div class="text-red-400 font-bold text-2xl">{{ results.trades.losses }}</div>
              </div>
              <div>
                <div class="text-gray-400 text-xs mb-1">Win Rate</div>
                <div :class="['font-bold text-2xl', parseFloat(results.trades.winRate) >= 50 ? 'text-green-400' : 'text-red-400']">
                  {{ results.trades.winRate }}%
                </div>
              </div>
              <div>
                <div class="text-gray-400 text-xs mb-1">Avg Win</div>
                <div class="text-green-400 font-bold text-lg">{{ formatCurrency(results.trades.avgWin) }}</div>
              </div>
              <div>
                <div class="text-gray-400 text-xs mb-1">Avg Loss</div>
                <div class="text-red-400 font-bold text-lg">{{ formatCurrency(Math.abs(results.trades.avgLoss)) }}</div>
              </div>
              <div class="col-span-2 md:col-span-3">
                <div class="text-gray-400 text-xs mb-1">Profit Factor</div>
                <div :class="['font-bold text-2xl', parseFloat(results.trades.profitFactor) >= 1 ? 'text-green-400' : 'text-red-400']">
                  {{ results.trades.profitFactor }}
                </div>
              </div>
            </div>

            <!-- Win/Loss Distribution -->
            <div class="mt-4 bg-gray-800 bg-opacity-50 rounded-lg p-4">
              <div class="text-gray-400 text-xs mb-2">Win/Loss Distribution</div>
              <div class="flex h-6 rounded-lg overflow-hidden">
                <div 
                  class="bg-green-500 flex items-center justify-center text-white text-xs font-bold"
                  :style="{ width: results.trades.winRate + '%' }"
                >
                  <span v-if="parseFloat(results.trades.winRate) > 15">{{ results.trades.winRate }}%</span>
                </div>
                <div 
                  class="bg-red-500 flex items-center justify-center text-white text-xs font-bold"
                  :style="{ width: (100 - parseFloat(results.trades.winRate)) + '%' }"
                >
                  <span v-if="(100 - parseFloat(results.trades.winRate)) > 15">{{ (100 - parseFloat(results.trades.winRate)).toFixed(1) }}%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Signal & Period Info -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="card p-6">
              <h3 class="text-lg font-bold text-white mb-3">🎯 Signal Configuration</h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-400">Symbol:</span>
                  <span class="text-white font-medium">{{ results.signal.symbol }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Timeframe:</span>
                  <span class="text-white font-medium">{{ results.signal.timeframe }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Type:</span>
                  <span class="text-blue-400 font-medium">{{ results.signal.type }}</span>
                </div>
                <div v-if="results.signal.value" class="flex justify-between">
                  <span class="text-gray-400">Value:</span>
                  <span class="text-white font-medium">{{ results.signal.value }}</span>
                </div>
              </div>
            </div>

            <div class="card p-6">
              <h3 class="text-lg font-bold text-white mb-3">📅 Test Period</h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-400">Start:</span>
                  <span class="text-white font-medium">{{ formatDate(results.period.start) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">End:</span>
                  <span class="text-white font-medium">{{ formatDate(results.period.end) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Candles:</span>
                  <span class="text-white font-medium">{{ results.period.candles }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Data Points:</span>
                  <span class="text-white font-medium">{{ backtestForm.iterations }} × {{ backtestForm.candles }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Trade History -->
          <div v-if="results.tradeHistory && results.tradeHistory.length > 0" class="card p-6">
            <h2 class="text-xl font-bold text-white mb-4">📋 Trade History ({{ results.tradeHistory.length }} trades)</h2>
            
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-gray-700">
                    <th class="text-left text-gray-400 font-medium pb-3 px-2">#</th>
                    <th class="text-left text-gray-400 font-medium pb-3 px-2">Entry Time</th>
                    <th class="text-right text-gray-400 font-medium pb-3 px-2">Entry Price</th>
                    <th class="text-center text-gray-400 font-medium pb-3 px-2">Side</th>
                    <th class="text-left text-gray-400 font-medium pb-3 px-2">Exit Time</th>
                    <th class="text-right text-gray-400 font-medium pb-3 px-2">Exit Price</th>
                    <th class="text-center text-gray-400 font-medium pb-3 px-2">Exit Reason</th>
                    <th class="text-right text-gray-400 font-medium pb-3 px-2">P&L</th>
                    <th class="text-right text-gray-400 font-medium pb-3 px-2">P&L %</th>
                    <th class="text-right text-gray-400 font-medium pb-3 px-2">Capital</th>
                  </tr>
                </thead>
                <tbody>
                  <tr 
                    v-for="(trade, index) in results.tradeHistory" 
                    :key="index"
                    class="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                  >
                    <td class="py-3 px-2 text-gray-400">{{ index + 1 }}</td>
                    <td class="py-3 px-2 text-gray-300 text-xs">{{ formatTradeTime(trade.entry.timestamp) }}</td>
                    <td class="py-3 px-2 text-right text-white font-mono">${{ parseFloat(trade.entry.price).toFixed(2) }}</td>
                    <td class="py-3 px-2 text-center">
                      <span 
                        :class="[
                          'px-2 py-0.5 rounded text-xs font-bold',
                          trade.entry.position === 'LONG' 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        ]"
                      >
                        {{ trade.entry.position }}
                      </span>
                    </td>
                    <td class="py-3 px-2 text-gray-300 text-xs">{{ formatTradeTime(trade.exit.timestamp) }}</td>
                    <td class="py-3 px-2 text-right text-white font-mono">${{ parseFloat(trade.exit.price).toFixed(2) }}</td>
                    <td class="py-3 px-2 text-center">
                      <span 
                        :class="[
                          'px-2 py-0.5 rounded text-xs',
                          trade.exit.reason === 'Take Profit' ? 'bg-green-900/50 text-green-300' :
                          trade.exit.reason === 'Stop Loss' ? 'bg-red-900/50 text-red-300' :
                          'bg-gray-700 text-gray-300'
                        ]"
                      >
                        {{ trade.exit.reason }}
                      </span>
                    </td>
                    <td 
                      :class="[
                        'py-3 px-2 text-right font-bold font-mono',
                        parseFloat(trade.profitLoss) >= 0 ? 'text-green-400' : 'text-red-400'
                      ]"
                    >
                      {{ parseFloat(trade.profitLoss) >= 0 ? '+' : '' }}${{ parseFloat(trade.profitLoss).toFixed(2) }}
                    </td>
                    <td 
                      :class="[
                        'py-3 px-2 text-right font-bold',
                        parseFloat(trade.profitLossPercent) >= 0 ? 'text-green-400' : 'text-red-400'
                      ]"
                    >
                      {{ parseFloat(trade.profitLossPercent) >= 0 ? '+' : '' }}{{ parseFloat(trade.profitLossPercent).toFixed(2) }}%
                    </td>
                    <td class="py-3 px-2 text-right text-white font-mono">${{ parseFloat(trade.capitalAfter).toFixed(2) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
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

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
