<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import wsService from '../services/websocket.js';
import SymbolSearch from '../components/SymbolSearch.vue';

const selectedSymbol = ref('BTCUSDT');
const selectedCategory = ref('spot');
const trades = ref([]);
const isLoading = ref(true);
const MAX_TRADES = 10; // Keep last 10 trades for display
const THROTTLE_MS = 100; // Throttle updates to every 100ms
const UPDATE_BATCH_SIZE = 20; // Process max 20 trades per update
const BUFFER_LIMIT = 500; // Clear pending buffer if it exceeds this

let unsubscribe = null;
let lastUpdate = 0;
let pendingTrades = [];
let lastPrice = null;
let tradeCount = 0;

const handleTradeUpdate = (data) => {
  const now = Date.now();
  
  if (data && data.data) {
    const newTrades = Array.isArray(data.data) ? data.data : [data.data];
    
    // Add to pending buffer
    pendingTrades.push(...newTrades);
    
    // Clear buffer if it's getting too large (memory protection)
    if (pendingTrades.length > BUFFER_LIMIT) {
      console.warn(`Pending buffer exceeded ${BUFFER_LIMIT}, clearing old trades`);
      pendingTrades = pendingTrades.slice(-UPDATE_BATCH_SIZE);
    }
    
    // Throttle updates
    if (now - lastUpdate < THROTTLE_MS) return;
    
    lastUpdate = now;
    
    // Take batch from pending trades
    const batchToProcess = pendingTrades.splice(0, UPDATE_BATCH_SIZE);
    
    if (batchToProcess.length > 0) {
      // Process trades and add price indicators
      const processedTrades = batchToProcess.map(trade => {
        const price = parseFloat(trade.p);
        let priceIndicator = '●';
        let priceMovement = 'initial';
        
        if (lastPrice !== null && !isNaN(lastPrice) && !isNaN(price)) {
          if (price > lastPrice) {
            priceIndicator = '▲';
            priceMovement = 'up';
          } else if (price < lastPrice) {
            priceIndicator = '▼';
            priceMovement = 'down';
          } else {
            priceIndicator = '→';
            priceMovement = 'same';
          }
        }
        
        lastPrice = price;
        tradeCount++;
        
        return {
          ...trade,
          priceIndicator,
          priceMovement,
          displayId: `${trade.T}-${Math.random()}`
        };
      });
      
      // Add new trades to the beginning and limit total
      trades.value = [...processedTrades, ...trades.value].slice(0, MAX_TRADES);
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
  pendingTrades = [];
  lastPrice = null;
  tradeCount = 0;
  subscribeToTrades();
};

const clearTrades = () => {
  trades.value = [];
  pendingTrades = [];
  tradeCount = 0;
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
  if (trades.value.length === 0) return { buyVolume: 0, sellVolume: 0, buyCount: 0, sellCount: 0, totalTrades: 0 };
  
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
  
  return { buyVolume, sellVolume, buyCount, sellCount, totalTrades: tradeCount };
});

const buyPercentage = computed(() => {
  const total = tradeStats.value.buyVolume + tradeStats.value.sellVolume;
  return total > 0 ? ((tradeStats.value.buyVolume / total) * 100).toFixed(1) : 50;
});

const sellPercentage = computed(() => {
  return (100 - parseFloat(buyPercentage.value)).toFixed(1);
});

const latestPrice = computed(() => {
  return trades.value.length > 0 ? parseFloat(trades.value[0].p).toFixed(2) : '0.00';
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
  <div class="p-4">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-white mb-2">📈 Live Trade Feed</h1>
      <p class="text-gray-400">Real-time public trades with price movement indicators</p>
    </div>

    <!-- Controls -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
      <!-- Symbol Selection -->
      <div class="card p-4">
        <label class="block text-sm font-medium text-gray-300 mb-2">Symbol</label>
        <div class="text-white font-bold text-xl mb-2">{{ selectedSymbol }}</div>
        <SymbolSearch @select="updateSymbol" />
      </div>

      <!-- Latest Price -->
      <div class="card p-4 bg-gradient-to-br from-blue-900 to-blue-800">
        <div class="text-gray-300 text-sm mb-1">Latest Price</div>
        <div class="text-white font-bold text-3xl">${{ latestPrice }}</div>
        <div class="text-gray-400 text-xs mt-1">{{ selectedSymbol }}</div>
      </div>

      <!-- Controls -->
      <div class="card p-4">
        <div class="text-gray-300 text-sm mb-3">Controls</div>
        <button
          @click="clearTrades"
          class="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded transition-colors"
        >
          🗑️ Clear Feed
        </button>
        <div class="text-xs text-gray-500 mt-2 text-center">
          Displaying last {{ MAX_TRADES }} trades
        </div>
      </div>
    </div>

    <!-- Statistics -->
    <div v-if="!isLoading && trades.length > 0" class="card p-6 mb-6">
      <h3 class="text-lg font-bold text-white mb-4">📊 Trade Statistics</h3>
      
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div class="text-center">
          <div class="text-gray-400 text-xs mb-1">Total Trades</div>
          <div class="text-white font-bold text-2xl">{{ tradeStats.totalTrades }}</div>
        </div>
        <div class="text-center">
          <div class="text-gray-400 text-xs mb-1">Buy Orders</div>
          <div class="text-green-400 font-bold text-2xl">{{ tradeStats.buyCount }}</div>
        </div>
        <div class="text-center">
          <div class="text-gray-400 text-xs mb-1">Sell Orders</div>
          <div class="text-red-400 font-bold text-2xl">{{ tradeStats.sellCount }}</div>
        </div>
        <div class="text-center">
          <div class="text-gray-400 text-xs mb-1">Buy Volume</div>
          <div class="text-green-400 font-bold text-lg">{{ tradeStats.buyVolume.toFixed(2) }}</div>
        </div>
        <div class="text-center">
          <div class="text-gray-400 text-xs mb-1">Sell Volume</div>
          <div class="text-red-400 font-bold text-lg">{{ tradeStats.sellVolume.toFixed(2) }}</div>
        </div>
      </div>

      <!-- Market Pressure Bar -->
      <div>
        <div class="flex justify-between text-xs text-gray-400 mb-2">
          <span>BUYERS {{ buyPercentage }}%</span>
          <span>Market Pressure</span>
          <span>SELLERS {{ sellPercentage }}%</span>
        </div>
        <div class="flex h-6 rounded-lg overflow-hidden">
          <div 
            class="bg-green-500 flex items-center justify-center text-white text-xs font-bold transition-all duration-300"
            :style="{ width: buyPercentage + '%' }"
          >
            <span v-if="parseFloat(buyPercentage) > 15">{{ buyPercentage }}%</span>
          </div>
          <div 
            class="bg-red-500 flex items-center justify-center text-white text-xs font-bold transition-all duration-300"
            :style="{ width: sellPercentage + '%' }"
          >
            <span v-if="parseFloat(sellPercentage) > 15">{{ sellPercentage }}%</span>
          </div>
        </div>
      </div>

      <!-- Legend -->
      <div class="mt-4 pt-4 border-t border-gray-700">
        <div class="text-xs text-gray-400 flex flex-wrap gap-4 justify-center">
          <span class="flex items-center gap-1">
            <span class="text-green-400 font-bold">▲</span> Price Up
          </span>
          <span class="flex items-center gap-1">
            <span class="text-red-400 font-bold">▼</span> Price Down
          </span>
          <span class="flex items-center gap-1">
            <span class="text-yellow-400 font-bold">→</span> Same Price
          </span>
          <span class="flex items-center gap-1">
            <span class="text-cyan-400 font-bold">●</span> Initial
          </span>
        </div>
      </div>
    </div>

    <!-- Trades Feed -->
    <div class="card">
      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-12">
        <div class="animate-pulse text-gray-400">
          <svg class="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <p class="text-lg">Connecting to trade stream...</p>
          <p class="text-sm mt-2">{{ selectedSymbol }}</p>
        </div>
      </div>

      <!-- Trades Data -->
      <div v-else>
        <!-- Header -->
        <div class="text-xs text-gray-400 font-medium pb-3 border-b border-gray-700 mb-2 px-4">
          Recent Trades
        </div>

        <!-- Trades List -->
        <div class="space-y-1 max-h-[400px] overflow-y-auto custom-scrollbar px-2">
          <div
            v-for="trade in trades"
            :key="trade.displayId"
            class="flex items-center justify-between py-2.5 px-3 hover:bg-gray-800 transition-all duration-150 rounded-lg border border-transparent hover:border-gray-700"
          >
            <!-- Single row with time, price, and dot -->
            <div class="flex items-center gap-3 flex-1">
              <span class="text-gray-400 text-sm font-mono">{{ formatTime(trade.T) }}</span>
              <span class="text-white font-bold text-base">${{ formatPrice(trade.p) }}</span>
            </div>
            
            <!-- Colored Dot Indicator -->
            <div class="flex items-center">
              <span 
                v-if="trade.S === 'Buy'"
                class="inline-block w-4 h-4 rounded-full bg-green-500 ring-2 ring-green-400/50"
                title="Buy"
              ></span>
              <span 
                v-else
                class="inline-block w-4 h-4 rounded-full bg-red-500 ring-2 ring-red-400/50"
                title="Sell"
              ></span>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="trades.length === 0" class="text-center py-12 text-gray-400">
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <p class="text-lg mb-2">No trades yet</p>
          <p class="text-sm">Waiting for trade data...</p>
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
  padding: 1rem;
}

/* Custom scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(31, 41, 55, 0.5);
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(107, 114, 128, 0.5);
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(107, 114, 128, 0.7);
}

/* Smooth fade-in animation for new trades */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.custom-scrollbar > div {
  animation: fadeIn 0.3s ease-out;
}
</style>
