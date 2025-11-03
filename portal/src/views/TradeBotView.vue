<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import apiClient from '../services/api.js';
import SymbolSearch from '../components/SymbolSearch.vue';
import { useTradeBotAgent } from '../composables/useTradeBotAgent.js';

const botConfig = ref({
  symbol: 'BTCUSDT',
  interval: '1m',
  amount: 0.001,
  riskPercent: 1.0,
  rewardPercent: 2.0,
  category: 'spot'
});

const intervals = [
  { value: '1m', label: '1 minute' },
  { value: '3m', label: '3 minutes' },
  { value: '5m', label: '5 minutes' },
  { value: '15m', label: '15 minutes' },
  { value: '30m', label: '30 minutes' },
  { value: '1h', label: '1 hour' },
  { value: '4h', label: '4 hours' },
];

// Use the trade bot agent composable
const { 
  klineData, 
  indicators, 
  currentPrice, 
  isSubscribed,
  startRealTimeKlineFeed, 
  stopRealTimeKlineFeed 
} = useTradeBotAgent();

const isRunning = ref(false);
const positions = ref([]);
const analysis = ref(null);
const loading = ref(false);
const error = ref(null);
const lastUpdate = ref(null);

const totalPnL = computed(() => {
  if (positions.value.length === 0) return 0;
  return positions.value.reduce((sum, pos) => sum + calculatePnL(pos), 0);
});

const totalPnLPercent = computed(() => {
  if (positions.value.length === 0) return 0;
  return positions.value.reduce((sum, pos) => sum + calculatePnLPercent(pos), 0) / positions.value.length;
});

const openPositions = computed(() => {
  return positions.value.filter(p => p.status === 'open');
});

const closedPositions = computed(() => {
  return positions.value.filter(p => p.status === 'closed');
});

const updateSymbol = (symbolData) => {
  botConfig.value.symbol = symbolData.symbol || symbolData;
  botConfig.value.category = symbolData.category || 'spot';
  
  // Re-subscribe to kline feed for new symbol
  if (isRunning.value) {
    startRealTimeKlineFeed(
      botConfig.value.symbol,
      botConfig.value.interval,
      botConfig.value.category
    );
  }
};

const calculatePnL = (position) => {
  if (!currentPrice.value) return 0;
  const exitPrice = position.exitPrice || currentPrice.value;
  
  if (position.side === 'long') {
    return (exitPrice - position.entryPrice) * position.amount;
  } else {
    return (position.entryPrice - exitPrice) * position.amount;
  }
};

const calculatePnLPercent = (position) => {
  if (!currentPrice.value) return 0;
  const exitPrice = position.exitPrice || currentPrice.value;
  
  if (position.side === 'long') {
    return ((exitPrice - position.entryPrice) / position.entryPrice) * 100;
  } else {
    return ((position.entryPrice - exitPrice) / position.entryPrice) * 100;
  }
};

const fetchAnalysis = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    // Wait a bit to ensure we have indicator data
    if (!indicators.value || Object.keys(indicators.value).length === 0) {
      error.value = 'No indicator data available yet. Please wait for data to load.';
      loading.value = false;
      return;
    }

    console.log('Analyzing indicators:', indicators.value);

    // Perform analysis with the indicators from the agent
    analyzeIndicators();
    lastUpdate.value = new Date();

  } catch (err) {
    error.value = 'Failed to fetch analysis: ' + (err.response?.data?.message || err.message);
    console.error('Error fetching analysis:', err);
  } finally {
    loading.value = false;
  }
};

const analyzeIndicators = () => {
  if (!indicators.value) return;

  const signals = {
    trend: [],
    momentum: [],
    volatility: [],
    volume: [],
    overall: { bullish: 0, bearish: 0, neutral: 0 }
  };

  /*
   * ANALYSIS METHODOLOGY:
   * Each indicator is evaluated and assigned a BULLISH, BEARISH, or NEUTRAL signal.
   * The overall recommendation is based on the percentage of bullish vs bearish signals.
   * 
   * Bullish/Bearish Determination Rules:
   * 
   * 1. SuperTrend: trend === 'long' → BULLISH, trend === 'short' → BEARISH
   * 2. RSI: < 30 → BULLISH (oversold), > 70 → BEARISH (overbought)
   * 3. MACD: histogram > 0 and MACD > signal → BULLISH, histogram < 0 and MACD < signal → BEARISH
   * 4. ADX: DI+ > DI- by 5+ → BULLISH, DI- > DI+ by 5+ → BEARISH
   * 5. Stochastic: K < 20 → BULLISH (oversold), K > 80 → BEARISH (overbought)
   * 
   * Final Recommendation:
   * - 70%+ bullish → STRONG BUY (HIGH confidence)
   * - 60%+ bullish → BUY (MODERATE confidence)
   * - 70%+ bearish → STRONG SELL (HIGH confidence)
   * - 60%+ bearish → SELL (MODERATE confidence)
   * - Otherwise → NEUTRAL (LOW confidence)
   */

  // SuperTrend Analysis
  if (indicators.value.SuperTrendIndicator) {
    const st = indicators.value.SuperTrendIndicator;
    signals.trend.push({
      name: 'SuperTrend',
      signal: st.trend === 'long' ? 'BULLISH' : 'BEARISH',
      strength: 'STRONG',
      value: st.value?.toFixed(2)
    });
    signals.overall[st.trend === 'long' ? 'bullish' : 'bearish']++;
  }

  // RSI Analysis
  if (indicators.value.RsiIndicator !== undefined) {
    const rsi = indicators.value.RsiIndicator;
    let signal = 'NEUTRAL';
    let strength = 'WEAK';
    
    if (rsi < 30) {
      signal = 'BULLISH';
      strength = 'STRONG';
    } else if (rsi > 70) {
      signal = 'BEARISH';
      strength = 'STRONG';
    } else if (rsi < 40) {
      signal = 'BULLISH';
      strength = 'MODERATE';
    } else if (rsi > 60) {
      signal = 'BEARISH';
      strength = 'MODERATE';
    }

    signals.momentum.push({
      name: 'RSI',
      signal,
      strength,
      value: rsi.toFixed(2)
    });
    
    if (signal !== 'NEUTRAL') {
      signals.overall[signal.toLowerCase()]++;
    }
  }

  // MACD Analysis
  if (indicators.value.MacdIndicator) {
    const macd = indicators.value.MacdIndicator;
    let signal = 'NEUTRAL';
    
    if (macd.MACD > macd.signal && macd.histogram > 0) {
      signal = 'BULLISH';
    } else if (macd.MACD < macd.signal && macd.histogram < 0) {
      signal = 'BEARISH';
    }

    signals.momentum.push({
      name: 'MACD',
      signal,
      strength: Math.abs(macd.histogram) > 10 ? 'STRONG' : 'MODERATE',
      value: `${macd.MACD.toFixed(2)} / ${macd.signal.toFixed(2)}`
    });
    
    if (signal !== 'NEUTRAL') {
      signals.overall[signal.toLowerCase()]++;
    }
  }

  // Bollinger Bands Analysis
  if (indicators.value.BollingerIndicator) {
    const bb = indicators.value.BollingerIndicator;
    const bandwidth = ((bb.upper - bb.lower) / bb.middle) * 100;
    
    signals.volatility.push({
      name: 'Bollinger Bands',
      signal: bandwidth < 5 ? 'LOW VOLATILITY' : bandwidth > 15 ? 'HIGH VOLATILITY' : 'MODERATE',
      strength: 'INFORMATIONAL',
      value: `BW: ${bandwidth.toFixed(2)}%`
    });
  }

  // ADX Analysis
  if (indicators.value.AdxIndicator) {
    const adx = indicators.value.AdxIndicator;
    let trendStrength = adx.adx > 25 ? 'STRONG' : adx.adx > 20 ? 'MODERATE' : 'WEAK';
    let direction = 'NEUTRAL';
    
    if (adx.pdi > adx.mdi + 5) {
      direction = 'BULLISH';
      signals.overall.bullish++;
    } else if (adx.mdi > adx.pdi + 5) {
      direction = 'BEARISH';
      signals.overall.bearish++;
    }

    signals.trend.push({
      name: 'ADX',
      signal: direction,
      strength: trendStrength,
      value: `${adx.adx.toFixed(2)} (DI+: ${adx.pdi.toFixed(2)}, DI-: ${adx.mdi.toFixed(2)})`
    });
  }

  // Stochastic Analysis
  if (indicators.value.StochasticIndicator) {
    const stoch = indicators.value.StochasticIndicator;
    let signal = 'NEUTRAL';
    
    if (stoch.k < 20) {
      signal = 'BULLISH';
      signals.overall.bullish++;
    } else if (stoch.k > 80) {
      signal = 'BEARISH';
      signals.overall.bearish++;
    }

    signals.momentum.push({
      name: 'Stochastic',
      signal,
      strength: stoch.k < 10 || stoch.k > 90 ? 'STRONG' : 'MODERATE',
      value: `K: ${stoch.k.toFixed(2)}, D: ${stoch.d.toFixed(2)}`
    });
  }

  // Overall recommendation
  const total = signals.overall.bullish + signals.overall.bearish + signals.overall.neutral;
  const bullishPercent = total > 0 ? (signals.overall.bullish / total) * 100 : 0;
  const bearishPercent = total > 0 ? (signals.overall.bearish / total) * 100 : 0;
  
  let recommendation = 'NEUTRAL - Wait for clearer signals';
  let confidence = 'LOW';
  
  if (bullishPercent >= 70) {
    recommendation = 'STRONG BUY - Multiple bullish indicators aligned';
    confidence = 'HIGH';
  } else if (bullishPercent >= 60) {
    recommendation = 'BUY - Majority of indicators bullish';
    confidence = 'MODERATE';
  } else if (bearishPercent >= 70) {
    recommendation = 'STRONG SELL - Multiple bearish indicators aligned';
    confidence = 'HIGH';
  } else if (bearishPercent >= 60) {
    recommendation = 'SELL - Majority of indicators bearish';
    confidence = 'MODERATE';
  }

  signals.recommendation = recommendation;
  signals.confidence = confidence;
  signals.bullishPercent = bullishPercent.toFixed(1);
  signals.bearishPercent = bearishPercent.toFixed(1);

  analysis.value = signals;
};

const openLongPosition = async () => {
  if (!currentPrice.value) {
    error.value = 'No price data available';
    return;
  }

  const position = {
    id: `pos_${Date.now()}`,
    symbol: botConfig.value.symbol,
    side: 'long',
    amount: botConfig.value.amount,
    entryPrice: currentPrice.value,
    stopLoss: currentPrice.value * (1 - botConfig.value.riskPercent / 100),
    takeProfit: currentPrice.value * (1 + botConfig.value.rewardPercent / 100),
    timestamp: new Date().toISOString(),
    status: 'open'
  };

  positions.value.push(position);
  console.log('Opened LONG position:', position);
};

const openShortPosition = async () => {
  if (!currentPrice.value) {
    error.value = 'No price data available';
    return;
  }

  const position = {
    id: `pos_${Date.now()}`,
    symbol: botConfig.value.symbol,
    side: 'short',
    amount: botConfig.value.amount,
    entryPrice: currentPrice.value,
    stopLoss: currentPrice.value * (1 + botConfig.value.riskPercent / 100),
    takeProfit: currentPrice.value * (1 - botConfig.value.rewardPercent / 100),
    timestamp: new Date().toISOString(),
    status: 'open'
  };

  positions.value.push(position);
  console.log('Opened SHORT position:', position);
};

const closePosition = (positionId) => {
  const position = positions.value.find(p => p.id === positionId);
  if (position) {
    position.status = 'closed';
    position.exitPrice = currentPrice.value;
    position.exitTime = new Date().toISOString();
    position.finalPnL = calculatePnL(position);
    position.finalPnLPercent = calculatePnLPercent(position);
  }
};

const closeAllPositions = () => {
  openPositions.value.forEach(pos => {
    closePosition(pos.id);
  });
};

const checkStopLossAndTakeProfit = () => {
  openPositions.value.forEach(position => {
    let shouldClose = false;
    let reason = '';

    if (position.side === 'long') {
      if (currentPrice.value <= position.stopLoss) {
        shouldClose = true;
        reason = 'Stop Loss';
      } else if (currentPrice.value >= position.takeProfit) {
        shouldClose = true;
        reason = 'Take Profit';
      }
    } else {
      if (currentPrice.value >= position.stopLoss) {
        shouldClose = true;
        reason = 'Stop Loss';
      } else if (currentPrice.value <= position.takeProfit) {
        shouldClose = true;
        reason = 'Take Profit';
      }
    }

    if (shouldClose) {
      position.closeReason = reason;
      closePosition(position.id);
    }
  });
};

// Watch for price changes and check stop-loss/take-profit
watch(currentPrice, (newPrice, oldPrice) => {
  console.log('💰 Price updated:', oldPrice, '→', newPrice);
  if (isRunning.value && openPositions.value.length > 0) {
    checkStopLossAndTakeProfit();
  }
});

// Watch for indicator changes and auto-analyze
watch(indicators, (newIndicators) => {
  console.log('📊 Indicators updated, keys:', Object.keys(newIndicators || {}));
  if (isRunning.value && indicators.value && Object.keys(indicators.value).length > 0) {
    console.log('🔍 Auto-analyzing indicators...');
    analyzeIndicators();
    lastUpdate.value = new Date();
  }
}, { deep: true });

const startBot = async () => {
  try {
    console.log('🤖 Starting trade bot...');
    isRunning.value = true;
    error.value = null;
    
    // Start the real-time kline feed (like CLI)
    console.log('📡 Starting kline feed with config:', botConfig.value);
    await startRealTimeKlineFeed(
      botConfig.value.symbol,
      botConfig.value.interval,
      botConfig.value.category
    );
    
    console.log('⏳ Waiting for initial indicator data...');
    
    // Wait a bit for initial data
    setTimeout(() => {
      console.log('🔍 Checking for indicators...', Object.keys(indicators.value || {}));
      if (indicators.value && Object.keys(indicators.value).length > 0) {
        console.log('✅ Running initial analysis');
        fetchAnalysis();
      } else {
        console.log('⚠️ No indicators yet, will auto-analyze when ready');
      }
    }, 2000);
    
  } catch (err) {
    console.error('❌ Failed to start bot:', err);
    error.value = 'Failed to start bot: ' + err.message;
    isRunning.value = false;
  }
};

const stopBot = () => {
  isRunning.value = false;
  stopRealTimeKlineFeed();
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  }).format(value);
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

onMounted(() => {
  console.log('🎯 TradeBotView mounted');
  console.log('📋 Initial config:', botConfig.value);
  
  // Initial setup - start the kline feed
  console.log('🚀 Starting initial kline feed...');
  startRealTimeKlineFeed(
    botConfig.value.symbol,
    botConfig.value.interval,
    botConfig.value.category
  ).then(() => {
    console.log('✅ Initial kline feed started successfully');
  }).catch(err => {
    console.error('❌ Failed to start initial kline feed:', err);
  });
});

onUnmounted(() => {
  stopBot();
});
</script>

<template>
  <div class="p-4">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-white mb-2">🤖 Trading Bot</h1>
      <p class="text-gray-400">Automated trading with real-time analysis and position management</p>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="mb-4 p-4 bg-red-900 border border-red-500 rounded-lg text-red-200">
      {{ error }}
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      
      <!-- Configuration Panel -->
      <div class="xl:col-span-1">
        <div class="card p-6 sticky top-4 space-y-4">
          <h2 class="text-xl font-bold text-white mb-4">⚙️ Bot Configuration</h2>
          
          <!-- Symbol -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Symbol</label>
            <div class="text-white font-semibold mb-2">{{ botConfig.symbol }}</div>
            <SymbolSearch @select="updateSymbol" />
          </div>

          <!-- Interval -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Interval</label>
            <select
              v-model="botConfig.interval"
              :disabled="isRunning"
              class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none disabled:opacity-50"
            >
              <option v-for="interval in intervals" :key="interval.value" :value="interval.value">
                {{ interval.label }}
              </option>
            </select>
          </div>

          <!-- Amount -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Position Amount</label>
            <input
              type="number"
              v-model.number="botConfig.amount"
              :disabled="isRunning"
              step="0.001"
              min="0.001"
              class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none disabled:opacity-50"
            />
          </div>

          <!-- Risk/Reward -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Risk %</label>
              <input
                type="number"
                v-model.number="botConfig.riskPercent"
                :disabled="isRunning"
                step="0.1"
                min="0.1"
                max="10"
                class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none disabled:opacity-50"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Reward %</label>
              <input
                type="number"
                v-model.number="botConfig.rewardPercent"
                :disabled="isRunning"
                step="0.1"
                min="0.1"
                max="20"
                class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none disabled:opacity-50"
              />
            </div>
          </div>

          <!-- Bot Controls -->
          <div class="pt-4 border-t border-gray-700 space-y-2">
            <button
              v-if="!isRunning"
              @click="startBot"
              class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              ▶️ Start Bot
            </button>
            <button
              v-else
              @click="stopBot"
              class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              ⏸️ Stop Bot
            </button>

            <button
              @click="fetchAnalysis"
              :disabled="loading"
              class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {{ loading ? '🔄 Analyzing...' : '📊 Run Analysis' }}
            </button>
          </div>

          <!-- Quick Actions -->
          <div class="pt-4 border-t border-gray-700 space-y-2">
            <div class="text-sm font-semibold text-gray-300 mb-2">Quick Actions</div>
            <div class="grid grid-cols-2 gap-2">
              <button
                @click="openLongPosition"
                :disabled="!currentPrice"
                class="bg-green-600/20 hover:bg-green-600/30 text-green-400 font-bold py-2 px-3 rounded border border-green-500/30 transition-colors disabled:opacity-50"
              >
                📈 Long
              </button>
              <button
                @click="openShortPosition"
                :disabled="!currentPrice"
                class="bg-red-600/20 hover:bg-red-600/30 text-red-400 font-bold py-2 px-3 rounded border border-red-500/30 transition-colors disabled:opacity-50"
              >
                📉 Short
              </button>
            </div>
            <button
              @click="closeAllPositions"
              :disabled="openPositions.length === 0"
              class="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded transition-colors disabled:opacity-50"
            >
              ❌ Close All Positions
            </button>
          </div>

          <!-- Status -->
          <div class="pt-4 border-t border-gray-700 text-sm space-y-1">
            <div class="flex justify-between">
              <span class="text-gray-400">Status:</span>
              <span :class="isRunning ? 'text-green-400' : 'text-red-400'">
                {{ isRunning ? '🟢 Running' : '🔴 Stopped' }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">Current Price:</span>
              <span class="text-white font-mono">{{ currentPrice ? formatCurrency(currentPrice) : 'Loading...' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">Open Positions:</span>
              <span class="text-white">{{ openPositions.length }}</span>
            </div>
            <div v-if="lastUpdate" class="flex justify-between">
              <span class="text-gray-400">Last Update:</span>
              <span class="text-gray-500 text-xs">{{ formatDate(lastUpdate) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="xl:col-span-2 space-y-6">
        
        <!-- Analysis Section -->
        <div v-if="analysis" class="card p-6">
          <h2 class="text-xl font-bold text-white mb-4">📊 Market Analysis</h2>
          
          <!-- Overall Recommendation -->
          <div class="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-lg p-6 mb-6">
            <div class="text-sm text-gray-300 mb-2">Recommendation</div>
            <div class="text-2xl font-bold text-white mb-2">{{ analysis.recommendation }}</div>
            <div class="flex items-center gap-4">
              <span class="text-sm text-gray-400">Confidence: <span class="text-white">{{ analysis.confidence }}</span></span>
              <span class="text-sm text-gray-400">Bullish: <span class="text-green-400">{{ analysis.bullishPercent }}%</span></span>
              <span class="text-sm text-gray-400">Bearish: <span class="text-red-400">{{ analysis.bearishPercent }}%</span></span>
            </div>
          </div>

          <!-- Key Indicators Overview -->
          <div v-if="indicators && Object.keys(indicators).length > 0" class="bg-gray-800/50 rounded-lg p-6 mb-6">
            <h3 class="text-lg font-bold text-white mb-4">🔑 Key Indicators</h3>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              
              <!-- RSI -->
              <div v-if="indicators.RsiIndicator !== undefined" class="text-center">
                <div class="text-xs text-gray-400 mb-2">RSI</div>
                <div 
                  class="text-3xl font-bold mb-1"
                  :class="[
                    indicators.RsiIndicator < 30 ? 'text-green-400' :
                    indicators.RsiIndicator > 70 ? 'text-red-400' :
                    'text-yellow-400'
                  ]"
                >
                  {{ indicators.RsiIndicator.toFixed(1) }}
                </div>
                <div class="text-xs">
                  <span 
                    :class="[
                      'px-2 py-0.5 rounded',
                      indicators.RsiIndicator < 30 ? 'bg-green-500/20 text-green-400' :
                      indicators.RsiIndicator > 70 ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    ]"
                  >
                    {{ indicators.RsiIndicator < 30 ? 'Oversold' : indicators.RsiIndicator > 70 ? 'Overbought' : 'Neutral' }}
                  </span>
                </div>
              </div>

              <!-- MACD -->
              <div v-if="indicators.MacdIndicator" class="text-center">
                <div class="text-xs text-gray-400 mb-2">MACD</div>
                <div 
                  class="text-2xl font-bold mb-1"
                  :class="[
                    indicators.MacdIndicator.histogram > 0 ? 'text-green-400' :
                    indicators.MacdIndicator.histogram < 0 ? 'text-red-400' :
                    'text-gray-400'
                  ]"
                >
                  {{ indicators.MacdIndicator.histogram.toFixed(2) }}
                </div>
                <div class="text-xs">
                  <span 
                    :class="[
                      'px-2 py-0.5 rounded',
                      indicators.MacdIndicator.histogram > 0 ? 'bg-green-500/20 text-green-400' :
                      'bg-red-500/20 text-red-400'
                    ]"
                  >
                    {{ indicators.MacdIndicator.MACD > indicators.MacdIndicator.signal ? 'Bullish' : 'Bearish' }}
                  </span>
                </div>
              </div>

              <!-- SuperTrend -->
              <div v-if="indicators.SuperTrendIndicator" class="text-center">
                <div class="text-xs text-gray-400 mb-2">SuperTrend</div>
                <div 
                  class="text-2xl font-bold mb-1"
                  :class="indicators.SuperTrendIndicator.trend === 'long' ? 'text-green-400' : 'text-red-400'"
                >
                  {{ formatCurrency(indicators.SuperTrendIndicator.value) }}
                </div>
                <div class="text-xs">
                  <span 
                    :class="[
                      'px-2 py-0.5 rounded font-bold',
                      indicators.SuperTrendIndicator.trend === 'long' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    ]"
                  >
                    {{ indicators.SuperTrendIndicator.trend === 'long' ? '🟢 LONG' : '🔴 SHORT' }}
                  </span>
                </div>
              </div>

              <!-- ADX -->
              <div v-if="indicators.AdxIndicator" class="text-center">
                <div class="text-xs text-gray-400 mb-2">ADX Strength</div>
                <div 
                  class="text-3xl font-bold mb-1"
                  :class="[
                    indicators.AdxIndicator.adx > 25 ? 'text-purple-400' :
                    indicators.AdxIndicator.adx > 20 ? 'text-blue-400' :
                    'text-gray-400'
                  ]"
                >
                  {{ indicators.AdxIndicator.adx.toFixed(1) }}
                </div>
                <div class="text-xs">
                  <span 
                    :class="[
                      'px-2 py-0.5 rounded',
                      indicators.AdxIndicator.adx > 25 ? 'bg-purple-500/20 text-purple-400' :
                      indicators.AdxIndicator.adx > 20 ? 'bg-blue-500/20 text-blue-400' :
                      'bg-gray-500/20 text-gray-400'
                    ]"
                  >
                    {{ indicators.AdxIndicator.adx > 25 ? 'Strong' : indicators.AdxIndicator.adx > 20 ? 'Moderate' : 'Weak' }}
                  </span>
                </div>
              </div>

              <!-- Stochastic -->
              <div v-if="indicators.StochasticIndicator" class="text-center">
                <div class="text-xs text-gray-400 mb-2">Stochastic</div>
                <div 
                  class="text-3xl font-bold mb-1"
                  :class="[
                    indicators.StochasticIndicator.k < 20 ? 'text-green-400' :
                    indicators.StochasticIndicator.k > 80 ? 'text-red-400' :
                    'text-yellow-400'
                  ]"
                >
                  {{ indicators.StochasticIndicator.k.toFixed(1) }}
                </div>
                <div class="text-xs">
                  <span 
                    :class="[
                      'px-2 py-0.5 rounded',
                      indicators.StochasticIndicator.k < 20 ? 'bg-green-500/20 text-green-400' :
                      indicators.StochasticIndicator.k > 80 ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    ]"
                  >
                    {{ indicators.StochasticIndicator.k < 20 ? 'Oversold' : indicators.StochasticIndicator.k > 80 ? 'Overbought' : 'Neutral' }}
                  </span>
                </div>
              </div>

            </div>

            <!-- Price vs Bollinger Bands -->
            <div v-if="indicators.BollingerIndicator && currentPrice" class="mt-6 pt-6 border-t border-gray-700">
              <div class="text-xs text-gray-400 mb-3">Price Position vs Bollinger Bands</div>
              <div class="relative h-8 bg-gray-700 rounded-lg overflow-hidden">
                <!-- Bands visualization -->
                <div class="absolute inset-0 flex items-center px-2">
                  <div class="flex-1 relative h-2 bg-gradient-to-r from-red-500/30 via-gray-600 to-green-500/30 rounded">
                    <!-- Price marker -->
                    <div 
                      class="absolute top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded shadow-lg"
                      :style="{ 
                        left: `${Math.min(100, Math.max(0, ((currentPrice - indicators.BollingerIndicator.lower) / (indicators.BollingerIndicator.upper - indicators.BollingerIndicator.lower)) * 100))}%` 
                      }"
                    ></div>
                  </div>
                </div>
              </div>
              <div class="flex justify-between text-xs mt-2">
                <span class="text-red-400">Lower: {{ formatCurrency(indicators.BollingerIndicator.lower) }}</span>
                <span class="text-gray-400">Middle: {{ formatCurrency(indicators.BollingerIndicator.middle) }}</span>
                <span class="text-green-400">Upper: {{ formatCurrency(indicators.BollingerIndicator.upper) }}</span>
              </div>
            </div>
          </div>
          <div v-else class="bg-gray-800/50 rounded-lg p-6 mb-6 text-center">
            <h3 class="text-lg font-bold text-white mb-2">🔑 Key Indicators</h3>
            <p class="text-gray-400 text-sm">{{ isSubscribed ? 'Loading indicator data...' : 'Click "Start Bot" to begin' }}</p>
          </div>

          <!-- Signal Breakdown -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Trend Signals -->
            <div v-if="analysis.trend.length > 0">
              <h3 class="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                <span>📈</span> Trend Signals
              </h3>
              <div class="space-y-2">
                <div v-for="signal in analysis.trend" :key="signal.name" class="bg-gray-800/50 rounded-lg p-3">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-white font-medium text-sm">{{ signal.name }}</span>
                    <span 
                      :class="[
                        'px-2 py-0.5 rounded text-xs font-bold',
                        signal.signal === 'BULLISH' ? 'bg-green-500/20 text-green-400' :
                        signal.signal === 'BEARISH' ? 'bg-red-500/20 text-red-400' :
                        'bg-gray-500/20 text-gray-400'
                      ]"
                    >
                      {{ signal.signal }}
                    </span>
                  </div>
                  <div class="text-xs text-gray-400">{{ signal.strength }} • {{ signal.value }}</div>
                </div>
              </div>
            </div>

            <!-- Momentum Signals -->
            <div v-if="analysis.momentum.length > 0">
              <h3 class="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                <span>⚡</span> Momentum Signals
              </h3>
              <div class="space-y-2">
                <div v-for="signal in analysis.momentum" :key="signal.name" class="bg-gray-800/50 rounded-lg p-3">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-white font-medium text-sm">{{ signal.name }}</span>
                    <span 
                      :class="[
                        'px-2 py-0.5 rounded text-xs font-bold',
                        signal.signal === 'BULLISH' ? 'bg-green-500/20 text-green-400' :
                        signal.signal === 'BEARISH' ? 'bg-red-500/20 text-red-400' :
                        'bg-gray-500/20 text-gray-400'
                      ]"
                    >
                      {{ signal.signal }}
                    </span>
                  </div>
                  <div class="text-xs text-gray-400">{{ signal.strength }} • {{ signal.value }}</div>
                </div>
              </div>
            </div>

            <!-- Volatility Signals -->
            <div v-if="analysis.volatility.length > 0">
              <h3 class="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                <span>📉</span> Volatility Signals
              </h3>
              <div class="space-y-2">
                <div v-for="signal in analysis.volatility" :key="signal.name" class="bg-gray-800/50 rounded-lg p-3">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-white font-medium text-sm">{{ signal.name }}</span>
                    <span class="px-2 py-0.5 rounded text-xs font-bold bg-blue-500/20 text-blue-400">
                      {{ signal.signal }}
                    </span>
                  </div>
                  <div class="text-xs text-gray-400">{{ signal.value }}</div>
                </div>
              </div>
            </div>

            <!-- Volume Signals -->
            <div v-if="analysis.volume.length > 0">
              <h3 class="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                <span>📊</span> Volume Signals
              </h3>
              <div class="space-y-2">
                <div v-for="signal in analysis.volume" :key="signal.name" class="bg-gray-800/50 rounded-lg p-3">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-white font-medium text-sm">{{ signal.name }}</span>
                    <span 
                      :class="[
                        'px-2 py-0.5 rounded text-xs font-bold',
                        signal.signal === 'BULLISH' ? 'bg-green-500/20 text-green-400' :
                        signal.signal === 'BEARISH' ? 'bg-red-500/20 text-red-400' :
                        'bg-gray-500/20 text-gray-400'
                      ]"
                    >
                      {{ signal.signal }}
                    </span>
                  </div>
                  <div class="text-xs text-gray-400">{{ signal.strength }} • {{ signal.value }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Positions Section -->
        <div class="card p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold text-white">📈 Positions</h2>
            <div v-if="openPositions.length > 0" class="text-right">
              <div class="text-sm text-gray-400">Total P&L</div>
              <div :class="['text-xl font-bold', totalPnL >= 0 ? 'text-green-400' : 'text-red-400']">
                {{ totalPnL >= 0 ? '+' : '' }}{{ formatCurrency(totalPnL) }}
              </div>
              <div :class="['text-sm', totalPnLPercent >= 0 ? 'text-green-400' : 'text-red-400']">
                {{ totalPnLPercent >= 0 ? '+' : '' }}{{ totalPnLPercent.toFixed(2) }}%
              </div>
            </div>
          </div>

          <!-- Open Positions -->
          <div v-if="openPositions.length > 0" class="mb-6">
            <h3 class="text-sm font-bold text-gray-300 mb-3">Open Positions ({{ openPositions.length }})</h3>
            <div class="space-y-3">
              <div v-for="position in openPositions" :key="position.id" class="bg-gray-800/50 rounded-lg p-4">
                <div class="flex items-start justify-between mb-3">
                  <div>
                    <div class="flex items-center gap-2 mb-1">
                      <span 
                        :class="[
                          'px-3 py-1 rounded text-sm font-bold',
                          position.side === 'long' 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        ]"
                      >
                        {{ position.side.toUpperCase() }}
                      </span>
                      <span class="text-white font-medium">{{ position.amount }} {{ position.symbol.replace('USDT', '') }}</span>
                    </div>
                    <div class="text-xs text-gray-400">{{ formatDate(position.timestamp) }}</div>
                  </div>
                  <button
                    @click="closePosition(position.id)"
                    class="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
                  >
                    Close
                  </button>
                </div>
                
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <div class="text-gray-400 text-xs mb-1">Entry Price</div>
                    <div class="text-white font-mono">{{ formatCurrency(position.entryPrice) }}</div>
                  </div>
                  <div>
                    <div class="text-gray-400 text-xs mb-1">Current Price</div>
                    <div class="text-white font-mono">{{ formatCurrency(currentPrice) }}</div>
                  </div>
                  <div>
                    <div class="text-gray-400 text-xs mb-1">P&L</div>
                    <div :class="['font-bold', calculatePnL(position) >= 0 ? 'text-green-400' : 'text-red-400']">
                      {{ calculatePnL(position) >= 0 ? '+' : '' }}{{ formatCurrency(calculatePnL(position)) }}
                    </div>
                  </div>
                  <div>
                    <div class="text-gray-400 text-xs mb-1">P&L %</div>
                    <div :class="['font-bold', calculatePnLPercent(position) >= 0 ? 'text-green-400' : 'text-red-400']">
                      {{ calculatePnLPercent(position) >= 0 ? '+' : '' }}{{ calculatePnLPercent(position).toFixed(2) }}%
                    </div>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-700 text-xs">
                  <div>
                    <span class="text-gray-400">Stop Loss:</span>
                    <span class="text-red-400 font-mono ml-2">{{ formatCurrency(position.stopLoss) }}</span>
                  </div>
                  <div>
                    <span class="text-gray-400">Take Profit:</span>
                    <span class="text-green-400 font-mono ml-2">{{ formatCurrency(position.takeProfit) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Closed Positions -->
          <div v-if="closedPositions.length > 0">
            <h3 class="text-sm font-bold text-gray-300 mb-3">Recent Closed Positions ({{ closedPositions.length }})</h3>
            <div class="space-y-2">
              <div v-for="position in closedPositions.slice(0, 5)" :key="position.id" class="bg-gray-900/50 rounded-lg p-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span 
                      :class="[
                        'px-2 py-0.5 rounded text-xs font-bold',
                        position.side === 'long' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                      ]"
                    >
                      {{ position.side.toUpperCase() }}
                    </span>
                    <span class="text-white text-sm">{{ position.amount }}</span>
                    <span class="text-gray-500 text-xs">@ {{ formatCurrency(position.entryPrice) }}</span>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="text-gray-500 text-xs">{{ position.closeReason }}</span>
                    <span :class="['font-bold text-sm', position.finalPnL >= 0 ? 'text-green-400' : 'text-red-400']">
                      {{ position.finalPnL >= 0 ? '+' : '' }}{{ formatCurrency(position.finalPnL) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="positions.length === 0" class="text-center py-12 text-gray-400">
            <svg class="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p class="text-lg mb-2">No Positions</p>
            <p class="text-sm">Open a position using Quick Actions or run analysis for recommendations</p>
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
</style>
