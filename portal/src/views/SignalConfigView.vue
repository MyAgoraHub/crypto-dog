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
  indicatorArgs: {}
});

const loading = ref(false);
const success = ref(null);
const error = ref(null);

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
    { value: 'RSI_OB', label: 'RSI Overbought', indicator: 'RsiIndicator', defaultValue: 70 },
    { value: 'RSI_OS', label: 'RSI Oversold', indicator: 'RsiIndicator', defaultValue: 30 },
    { value: 'CROCODILE_DIVE', label: 'Crocodile Dive (Bearish)', indicator: 'Ema3Indicator', defaultValue: null },
    { value: 'CROCODILE', label: 'Crocodile (Bullish)', indicator: 'Ema3Indicator', defaultValue: null },
    { value: 'CROSS_UP', label: 'EMA Cross Up', indicator: 'EMAIndicator', defaultValue: null },
    { value: 'CROSS_DOWN', label: 'EMA Cross Down', indicator: 'EMAIndicator', defaultValue: null },
    { value: 'MULTI_DIV', label: 'Multi Divergence', indicator: 'MultiDivergenceDetector', defaultValue: null },
    { value: 'UPTREND', label: 'Uptrend Signal', indicator: 'EMAIndicator', defaultValue: null },
    { value: 'DOWNTREND', label: 'Downtrend Signal', indicator: 'EMAIndicator', defaultValue: null },
    { value: 'WOODIES', label: 'Woodies Pivot', indicator: 'Woodies', defaultValue: null },
    { value: 'SUPERTREND_LONG', label: 'SuperTrend Long', indicator: 'SuperTrendIndicator', defaultValue: 'long' },
    { value: 'SUPERTREND_SHORT', label: 'SuperTrend Short', indicator: 'SuperTrendIndicator', defaultValue: 'short' },
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
  return signalTypes[signalForm.value.signalCategory] || [];
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
    switch (signalForm.value.signalType) {
      case 'RSI_OB':
        evaluate = `(data, model) => { return { signal: data.value > model.value, data:data}; }`;
        break;
      case 'RSI_OS':
        evaluate = `(data, model) => { return { signal: data.value < model.value, data:data}; }`;
        break;
      case 'CROCODILE_DIVE':
        evaluate = `(data, model) => { return { signal: (data.ema2 < data.ema3) && (data.ema1 < data.ema2), data:data} }`;
        break;
      case 'CROCODILE':
        evaluate = `(data, model) => { return { signal: (data.ema2 > data.ema3) && (data.ema1 > data.ema2), data:data} }`;
        break;
      case 'CROSS_UP':
        evaluate = `(data, value) => { return { signal: data.all.every(element => element > data.current), data:data } }`;
        break;
      case 'CROSS_DOWN':
        evaluate = `(data, value) => { return { signal: data.all.every(element => element < data.current), data:data }; }`;
        break;
      case 'MULTI_DIV':
        evaluate = `(data, model) => {
          const confirmedDivergences = data.divergence.filter(div => div.type !== 'Pending Divergence').map(div => div.indicator);
          if (data.c && data.hasDivergence) {
            return { signal: true, divergence: confirmedDivergences, data:data };
          }
          return { signal: false, divergence: "pending", data:data };
        }`;
        break;
      case 'UPTREND':
        evaluate = `(data, model) => { return { signal: data.c > data, data:data} }`;
        break;
      case 'DOWNTREND':
        evaluate = `(data, model) => { return { signal: data.c < data, data:data} }`;
        break;
      case 'WOODIES':
        evaluate = `(data, model) => {
          let currentPrice = data.c;
          let woodie = data.data.woodies;
          if(currentPrice <= woodie.s2) {return {signal:true, type:"strong support", data:data}}
          if(currentPrice <= woodie.s1) {return {signal:true, type:"first support", data:data}}
          if(currentPrice >= woodie.r2) {return {signal:true, type:"strong resistance", data:data}}
          if(currentPrice >= woodie.r1) {return {signal:true, type:"first resistance", data:data}}
          return {signal: false, data:data}
        }`;
        break;
      case 'SUPERTREND_LONG':
      case 'SUPERTREND_SHORT':
        evaluate = `(data, model) => { return { signal: data.trend === model.value, trend: data.trend, data:data }; }`;
        break;
    }
    
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

        <!-- Signal Type -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Signal Type</label>
          <select
            v-model="signalForm.signalType"
            @change="onSignalTypeChange"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
          >
            <option v-for="type in availableSignalTypes" :key="type.value" :value="type.value">
              {{ type.label }}
            </option>
          </select>
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
      <h3 class="text-lg font-bold text-white mb-4">Signal Types Guide</h3>
      <div class="space-y-3 text-sm">
        <div>
          <span class="font-semibold text-blue-400">RSI Signals:</span>
          <span class="text-gray-300"> Trigger when RSI crosses overbought (70) or oversold (30) levels</span>
        </div>
        <div>
          <span class="font-semibold text-green-400">EMA Cross:</span>
          <span class="text-gray-300"> Detect when price crosses above (bullish) or below (bearish) EMA</span>
        </div>
        <div>
          <span class="font-semibold text-purple-400">Multi Divergence:</span>
          <span class="text-gray-300"> Alerts when multiple indicators show divergence from price</span>
        </div>
        <div>
          <span class="font-semibold text-yellow-400">Price Action:</span>
          <span class="text-gray-300"> Simple price level alerts (greater/less than specified value)</span>
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
</style>
