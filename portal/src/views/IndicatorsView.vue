<script setup>
import { ref, reactive, onMounted } from 'vue';
import apiClient from '../services/api';
import IndicatorCard from '../components/IndicatorCard.vue';
import SymbolSearch from '../components/SymbolSearch.vue';

const selectedSymbol = ref('BTCUSDT');
const selectedCategory = ref('spot');
const selectedInterval = ref('15');
const selectedIterations = ref(2); // Default iterations
const selectedCandles = ref(200); // Default candles per iteration
const isLoading = ref(false);

const intervals = [
  { value: '1', label: '1m' },
  { value: '5', label: '5m' },
  { value: '15', label: '15m' },
  { value: '30', label: '30m' },
  { value: '60', label: '1h' },
  { value: '240', label: '4h' },
  { value: 'D', label: '1D' },
];

const iterationOptions = [
  { value: 1, label: '1 (200 candles)' },
  { value: 2, label: '2 (400 candles)' },
  { value: 3, label: '3 (600 candles)' },
  { value: 5, label: '5 (1000 candles)' },
  { value: 10, label: '10 (2000 candles)' },
];

const indicators = reactive([
  { name: 'RSI', key: 'rsi', active: true },
  { name: 'SuperTrend', key: 'supertrend', active: true },
  { name: 'MACD', key: 'macd', active: true },
  { name: 'Bollinger Bands', key: 'bollinger', active: true },
  { name: 'EMA', key: 'ema', active: true },
  { name: 'SMA', key: 'sma', active: false },
  { name: 'ATR', key: 'atr', active: false },
  { name: 'Stochastic', key: 'stochastic', active: false },
  { name: 'Williams %R', key: 'williamsr', active: false },
  { name: 'CCI', key: 'cci', active: false },
  { name: 'ADX', key: 'adx', active: false },
  { name: 'Ichimoku Cloud', key: 'ichimoku', active: false },
  { name: 'MFI', key: 'mfi', active: false },
  { name: 'Multi Divergence', key: 'multidivergence', active: false },
  { name: 'EMA Trend (20/50/200)', key: 'emamulti', active: false },
  { name: 'SMA Trend (20/50/200)', key: 'smamulti', active: false },
]);

const indicatorData = ref({});
const tradeSignal = ref(null);

const loadIndicators = async (forceRefresh = false) => {
  isLoading.value = true;
  indicatorData.value = {};
  tradeSignal.value = null;

  try {
    const activeIndicators = indicators.filter(i => i.active).map(i => i.key);
    
    console.log('Loading indicators:', activeIndicators, 'forceRefresh:', forceRefresh);
    console.log('Parameters:', { symbol: selectedSymbol.value, category: selectedCategory.value, interval: selectedInterval.value });
    
    // Use batch API to get all indicators at once
    const response = await apiClient.post('/api/indicators/batch', {
      indicators: activeIndicators.map(key => ({
        name: key,
        symbol: selectedSymbol.value,
        category: selectedCategory.value,
        interval: selectedInterval.value,
        iterations: selectedIterations.value,
        candles: selectedCandles.value,
        forceRefresh: forceRefresh  // Only force refresh when explicitly requested
      }))
    });

    console.log('API Response:', response);

    if (response.data && response.data.results) {
      console.log('Results:', response.data.results);
      
      response.data.results.forEach((result, index) => {
        console.log(`Result ${index}:`, result);
        
        if (result.status === 'fulfilled' && result.data) {
          const key = activeIndicators[index];
          const data = result.data;
          
          console.log(`Raw data for ${key}:`, data);
          
          // Parse indicator data based on type
          indicatorData.value[key] = parseIndicatorData(key, data);
          console.log(`Parsed ${key}:`, indicatorData.value[key]);
        } else if (result.error) {
          console.error(`Error loading ${activeIndicators[index]}:`, result.error);
        }
      });
      
      console.log('Final indicatorData:', indicatorData.value);
    }

    // Calculate overall trade signal
    calculateTradeSignal();
  } catch (error) {
    console.error('Failed to load indicators:', error);
    console.error('Error details:', error.response?.data || error.message);
  } finally {
    isLoading.value = false;
  }
};

const parseIndicatorData = (key, data) => {
  console.log(`Parsing ${key}:`, data);
  
  // The data structure is flat: { symbol, interval, type, currentValue, history, ... }
  const currentValue = data.currentValue;
  const marketData = data.history || data.marketData || [];
  
  let signal = 'neutral';
  
  if (currentValue === undefined || currentValue === null) {
    console.warn(`No value found for ${key}`);
    return {
      currentValue: 'N/A',
      history: marketData,
      signal: 'neutral',
      raw: data
    };
  }
  
  switch(key) {
    case 'rsi':
      const rsiVal = typeof currentValue === 'number' ? currentValue : currentValue.rsi;
      if (rsiVal < 30) signal = 'buy';
      else if (rsiVal > 70) signal = 'sell';
      break;
      
    case 'supertrend':
      if (currentValue.trend === 'long') signal = 'buy';
      else if (currentValue.trend === 'short') signal = 'sell';
      break;
      
    case 'macd':
      if (currentValue.histogram > 0) signal = 'buy';
      else if (currentValue.histogram < 0) signal = 'sell';
      break;
      
    case 'bollinger':
      // Signal based on price position relative to bands
      break;
      
    case 'ema':
    case 'sma':
      // Moving averages don't have inherent signals
      break;
      
    case 'stochastic':
      if (currentValue.k < 20) signal = 'buy';
      else if (currentValue.k > 80) signal = 'sell';
      break;
      
    case 'atr':
      // ATR doesn't have buy/sell signals
      break;
      
    default:
      break;
  }
  
  return {
    currentValue,
    history: marketData,
    signal,
    raw: data
  };
};

const calculateTradeSignal = () => {
  const signals = Object.values(indicatorData.value).map(d => d.signal);
  const buySignals = signals.filter(s => s === 'buy').length;
  const sellSignals = signals.filter(s => s === 'sell').length;

  if (buySignals > sellSignals && buySignals >= 2) {
    tradeSignal.value = {
      action: 'BUY',
      confidence: Math.round((buySignals / signals.length) * 100),
      reason: `${buySignals} out of ${signals.length} indicators suggest buying`,
    };
  } else if (sellSignals > buySignals && sellSignals >= 2) {
    tradeSignal.value = {
      action: 'SELL',
      confidence: Math.round((sellSignals / signals.length) * 100),
      reason: `${sellSignals} out of ${signals.length} indicators suggest selling`,
    };
  } else {
    tradeSignal.value = {
      action: 'HOLD',
      confidence: 50,
      reason: 'Mixed signals or insufficient data',
    };
  }
};

const toggleIndicator = (key) => {
  const indicator = indicators.find(i => i.key === key);
  if (indicator) {
    indicator.active = !indicator.active;
    // Use cached data when toggling indicators (fast)
    loadIndicators(false);
  }
};

const updateSymbol = (symbolData) => {
  selectedSymbol.value = symbolData.symbol;
  selectedCategory.value = symbolData.category;
  // Use cached data when changing symbols (fast)
  loadIndicators(false);
};

const refreshData = () => {
  // Force refresh when explicitly clicking the refresh button
  loadIndicators(true);
};

onMounted(() => {
  // Initial load uses cached data
  loadIndicators(false);
});
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-white mb-1">Technical Indicators</h1>
      <p class="text-gray-400 text-sm">Analyze market trends for {{ selectedSymbol }} and get trade recommendations</p>
    </div>

    <!-- Controls -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <!-- Symbol Selection -->
      <div class="card">
        <label class="block text-sm font-medium text-gray-300 mb-2">Symbol</label>
        <div class="text-white font-semibold">{{ selectedSymbol }}</div>
        <SymbolSearch @select="updateSymbol" class="mt-2" />
      </div>

      <!-- Interval Selection -->
      <div class="card">
        <label class="block text-sm font-medium text-gray-300 mb-2">Interval</label>
        <select v-model="selectedInterval" @change="loadIndicators(false)" class="input">
          <option v-for="interval in intervals" :key="interval.value" :value="interval.value">
            {{ interval.label }}
          </option>
        </select>
      </div>

      <!-- Historical Data Depth -->
      <div class="card">
        <label class="block text-sm font-medium text-gray-300 mb-2">Historical Depth</label>
        <select v-model="selectedIterations" @change="loadIndicators(true)" class="input">
          <option v-for="option in iterationOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
        <p class="text-xs text-gray-500 mt-1">More history = better accuracy</p>
      </div>

      <!-- Refresh Button -->
      <div class="card flex items-end">
        <button @click="refreshData" class="btn btn-primary w-full" :disabled="isLoading">
          <svg v-if="!isLoading" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span v-if="isLoading" class="animate-pulse">Loading...</span>
          <span v-else>Refresh Data</span>
        </button>
      </div>
    </div>

    <!-- Trade Signal -->
    <div v-if="tradeSignal" class="card mb-6" :class="{
      'border-2 border-green-500': tradeSignal.action === 'BUY',
      'border-2 border-red-500': tradeSignal.action === 'SELL',
      'border-2 border-gray-600': tradeSignal.action === 'HOLD'
    }">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-white mb-1">Trade Recommendation</h3>
          <p class="text-gray-400 text-sm">{{ tradeSignal.reason }}</p>
        </div>
        <div class="text-right">
          <div class="text-3xl font-bold" :class="{
            'text-green-400': tradeSignal.action === 'BUY',
            'text-red-400': tradeSignal.action === 'SELL',
            'text-gray-400': tradeSignal.action === 'HOLD'
          }">
            {{ tradeSignal.action }}
          </div>
          <div class="text-sm text-gray-400 mt-1">
            {{ tradeSignal.confidence }}% confidence
          </div>
        </div>
      </div>
    </div>

    <!-- Indicator Selection -->
    <div class="card mb-6">
      <h3 class="text-lg font-semibold text-white mb-3">Active Indicators</h3>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="indicator in indicators"
          :key="indicator.key"
          @click="toggleIndicator(indicator.key)"
          class="px-3 py-1 rounded-md text-sm font-medium transition-colors"
          :class="indicator.active 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'"
        >
          {{ indicator.name }}
        </button>
      </div>
    </div>

    <!-- Indicators Grid -->
    <div v-if="!isLoading && Object.keys(indicatorData).length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <IndicatorCard
        v-for="(data, key) in indicatorData"
        :key="key"
        :name="indicators.find(i => i.key === key)?.name || key"
        :data="data"
      />
    </div>

    <!-- Loading State -->
    <div v-else-if="isLoading" class="text-center py-12">
      <div class="animate-pulse text-gray-400">
        <svg class="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <p>Loading indicator data...</p>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <div class="text-gray-400">
        <svg class="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p>No indicator data available</p>
        <p class="text-sm mt-2">Select indicators and click "Refresh Data"</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.items-end {
  align-items: flex-end;
}

.flex-wrap {
  flex-wrap: wrap;
}

.gap-2 {
  gap: 0.5rem;
}

.gap-4 {
  gap: 1rem;
}

.gap-6 {
  gap: 1.5rem;
}

.px-3 {
  padding-left: 0.75rem;
  padding-right: 0.75rem;
}

.py-1 {
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
}

.mb-1 {
  margin-bottom: 0.25rem;
}

.mb-2 {
  margin-bottom: 0.5rem;
}

.mb-3 {
  margin-bottom: 0.75rem;
}

.mt-1 {
  margin-top: 0.25rem;
}

.mt-2 {
  margin-top: 0.5rem;
}

.block {
  display: block;
}

.w-12 {
  width: 3rem;
}

.h-12 {
  height: 3rem;
}

.text-right {
  text-align: right;
}

.border-2 {
  border-width: 2px;
}
</style>
