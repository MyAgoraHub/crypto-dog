<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import wsService from '../services/websocket.js';
import SymbolSearch from '../components/SymbolSearch.vue';

const selectedSymbol = ref('BTCUSDT');
const selectedCategory = ref('spot');
const trades = ref([]);
const isLoading = ref(true);
const MAX_TRADES = 10; // Keep last 10 trades
const THROTTLE_MS = 100; // Throttle updates to every 100ms
const UPDATE_BATCH_SIZE = 10; // Process max 10 trades per update

let unsubscribe = null;
let lastUpdate = 0;
let pendingTrades = [];

const handleTradeUpdate = (data) => {
  const now = Date.now();
  
  if (data && data.data) {
    const newTrades = Array.isArray(data.data) ? data.data : [data.data];
    pendingTrades.push(...newTrades);
    
    // Throttle updates
    if (now - lastUpdate < THROTTLE_MS) return;
    
    lastUpdate = now;
    
    // Take batch from pending trades
    const batchToProcess = pendingTrades.splice(0, UPDATE_BATCH_SIZE);
    
    if (batchToProcess.length > 0) {
      // If we're at max capacity, clear and start fresh with new batch
      if (trades.value.length >= MAX_TRADES) {
        trades.value = batchToProcess.slice(0, MAX_TRADES);
      } else {
        // Add new trades to the beginning
        trades.value = [...batchToProcess, ...trades.value].slice(0, MAX_TRADES);
      }
      isLoading.value = false;
    }
  }
};

const subscribeToTrades = () => {
  const topic = `publicTrade.${selectedSymbol.value}`;
  
  try {
    wsService.subscribe(topic, selectedCategory.value, handleTradeUpdate);
    unsubscribe = () => wsService.unsubscribe(topic, selectedCategory.value, handleTradeUpdate);
  } catch (error) {
    console.error('Failed to subscribe to trades:', error);
    isLoading.value = false;
  }
};

const updateSymbol = (symbolData) => {
  if (unsubscribe) {
    unsubscribe();
  }
  selectedSymbol.value = symbolData.symbol;
  selectedCategory.value = symbolData.category;
  isLoading.value = true;
  trades.value = [];
  subscribeToTrades();
};

const formatTime = (timestamp) => {
  const date = new Date(parseInt(timestamp));
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: false 
  });
};

const formatPrice = (price) => {
  return parseFloat(price).toFixed(2);
};

const formatSize = (size) => {
  return parseFloat(size).toFixed(4);
};

const tradeStats = computed(() => {
  if (trades.value.length === 0) return { buyVolume: 0, sellVolume: 0, buyCount: 0, sellCount: 0 };
  
  let buyVolume = 0;
  let sellVolume = 0;
  let buyCount = 0;
  let sellCount = 0;
  
  trades.value.forEach(trade => {
    const volume = parseFloat(trade.v);
    if (trade.S === 'Buy') {
      buyVolume += volume;
      buyCount++;
    } else {
      sellVolume += volume;
      sellCount++;
    }
  });
  
  return { buyVolume, sellVolume, buyCount, sellCount };
});

const buyPercentage = computed(() => {
  const total = tradeStats.value.buyVolume + tradeStats.value.sellVolume;
  return total > 0 ? ((tradeStats.value.buyVolume / total) * 100).toFixed(1) : 0;
});

onMounted(() => {
  subscribeToTrades();
});

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe();
  }
});
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-white mb-1">Recent Trades</h1>
        <p class="text-gray-400 text-sm">Real-time public trades for {{ selectedSymbol }}</p>
      </div>
    </div>

    <!-- Symbol Selection -->
    <div class="card mb-6">
      <div class="flex items-center space-x-4">
        <div class="flex-1">
          <label class="block text-sm font-medium text-gray-300 mb-2">Symbol</label>
          <div class="text-white font-semibold text-lg">{{ selectedSymbol }}</div>
        </div>
        <div class="flex-1">
          <SymbolSearch @select="updateSymbol" />
        </div>
      </div>
    </div>

    <!-- Trade Statistics -->
    <div v-if="!isLoading && trades.length > 0" class="card mb-6 bg-gray-800 bg-opacity-50">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div>
          <div class="text-gray-400 text-sm mb-1">Buy Volume</div>
          <div class="text-green-400 font-semibold text-lg">{{ tradeStats.buyVolume.toFixed(2) }}</div>
          <div class="text-gray-500 text-xs">{{ tradeStats.buyCount }} trades</div>
        </div>
        <div>
          <div class="text-gray-400 text-sm mb-1">Sell Volume</div>
          <div class="text-red-400 font-semibold text-lg">{{ tradeStats.sellVolume.toFixed(2) }}</div>
          <div class="text-gray-500 text-xs">{{ tradeStats.sellCount }} trades</div>
        </div>
        <div>
          <div class="text-gray-400 text-sm mb-1">Buy Pressure</div>
          <div class="text-white font-semibold text-lg">{{ buyPercentage }}%</div>
          <div class="w-full bg-gray-700 rounded-full h-2 mt-2">
            <div class="bg-green-500 h-2 rounded-full transition-all" :style="{ width: buyPercentage + '%' }"></div>
          </div>
        </div>
        <div>
          <div class="text-gray-400 text-sm mb-1">Total Trades</div>
          <div class="text-white font-semibold text-lg">{{ trades.length }}</div>
          <div class="text-gray-500 text-xs">Last {{ MAX_TRADES }}</div>
        </div>
      </div>
    </div>

    <!-- Trades List -->
    <div class="card">
      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-12">
        <div class="animate-pulse text-gray-400">
          <svg class="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <p>Loading trades...</p>
        </div>
      </div>

      <!-- Trades Data -->
      <div v-else>
        <!-- Header -->
        <div class="grid grid-cols-4 gap-2 md:gap-4 text-xs md:text-sm text-gray-400 font-medium pb-3 border-b border-gray-700 mb-2">
          <div class="text-left">Time</div>
          <div class="text-right">Price</div>
          <div class="text-right">Size</div>
          <div class="text-center">Side</div>
        </div>

        <!-- Trades Rows -->
        <div class="space-y-1 max-h-[600px] overflow-y-auto">
          <div
            v-for="(trade, index) in trades"
            :key="trade.i || index"
            class="grid grid-cols-4 gap-2 md:gap-4 text-xs md:text-sm py-2 hover:bg-gray-800 transition-colors rounded"
            :class="trade.S === 'Buy' ? 'bg-green-900 bg-opacity-5' : 'bg-red-900 bg-opacity-5'"
          >
            <div class="text-gray-400 text-left">{{ formatTime(trade.T) }}</div>
            <div class="text-white text-right font-medium">${{ formatPrice(trade.p) }}</div>
            <div class="text-gray-300 text-right">{{ formatSize(trade.v) }}</div>
            <div class="text-center">
              <span 
                v-if="trade.S === 'Buy'" 
                class="inline-block px-2 py-0.5 bg-green-600 text-white rounded text-xs font-bold"
              >
                BUY
              </span>
              <span 
                v-else 
                class="inline-block px-2 py-0.5 bg-red-600 text-white rounded text-xs font-bold"
              >
                SELL
              </span>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="trades.length === 0" class="text-center py-12 text-gray-400">
          <p>No trades yet. Waiting for data...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom scrollbar for trades list */
.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: rgba(31, 41, 55, 0.5);
  border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(107, 114, 128, 0.5);
  border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(107, 114, 128, 0.7);
}
</style>
