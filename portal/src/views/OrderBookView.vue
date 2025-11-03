<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import wsService from '../services/websocket';
import SymbolSearch from '../components/SymbolSearch.vue';

const selectedSymbol = ref('BTCUSDT');
const selectedCategory = ref('spot');
const selectedDepth = ref(50);

// Orderbook state - using Maps like the blessed-contrib example
const orderBookState = ref({
  bids: new Map(), // price -> quantity
  asks: new Map(), // price -> quantity
  lastUpdateId: 0,
  lastSequence: 0
});

const isLoading = ref(true);
let unsubscribe = null;
let lastUpdate = 0;
const THROTTLE_MS = 100; // Faster updates for orderbook
const DISPLAY_LEVELS = 8; // Number of levels to display per side

// Process and sort bids (highest to lowest)
const processedBids = computed(() => {
  const bids = Array.from(orderBookState.value.bids.entries())
    .sort(([a], [b]) => parseFloat(b) - parseFloat(a))
    .slice(0, DISPLAY_LEVELS);
  
  let cumulative = 0;
  return bids.map(([price, quantity]) => {
    const priceNum = parseFloat(price);
    const qtyNum = parseFloat(quantity);
    const total = priceNum * qtyNum;
    cumulative += qtyNum;
    
    return {
      price: priceNum,
      quantity: qtyNum,
      total: total,
      cumulative: cumulative
    };
  });
});

// Process and sort asks (lowest to highest)
const processedAsks = computed(() => {
  const asks = Array.from(orderBookState.value.asks.entries())
    .sort(([a], [b]) => parseFloat(a) - parseFloat(b))
    .slice(0, DISPLAY_LEVELS);
  
  let cumulative = 0;
  return asks.map(([price, quantity]) => {
    const priceNum = parseFloat(price);
    const qtyNum = parseFloat(quantity);
    const total = priceNum * qtyNum;
    cumulative += qtyNum;
    
    return {
      price: priceNum,
      quantity: qtyNum,
      total: total,
      cumulative: cumulative
    };
  });
});

// Calculate max cumulative for percentage bars
const maxCumulative = computed(() => {
  const maxBid = processedBids.value.length > 0 
    ? processedBids.value[processedBids.value.length - 1].cumulative 
    : 0;
  const maxAsk = processedAsks.value.length > 0 
    ? processedAsks.value[processedAsks.value.length - 1].cumulative 
    : 0;
  return Math.max(maxBid, maxAsk) || 1;
});

// Calculate spread
const spread = computed(() => {
  if (processedAsks.value.length === 0 || processedBids.value.length === 0) {
    return { price: 0, percent: 0 };
  }
  
  const bestAsk = processedAsks.value[0].price;
  const bestBid = processedBids.value[0].price;
  const spreadPrice = bestAsk - bestBid;
  const spreadPercent = ((spreadPrice / bestBid) * 100);
  
  return {
    price: spreadPrice,
    percent: spreadPercent
  };
});

// Calculate total volume and percentages
const volumeStats = computed(() => {
  const totalBidVolume = processedBids.value.reduce((sum, bid) => sum + bid.quantity, 0);
  const totalAskVolume = processedAsks.value.reduce((sum, ask) => sum + ask.quantity, 0);
  const totalVolume = totalBidVolume + totalAskVolume;
  
  return {
    totalBidVolume,
    totalAskVolume,
    totalVolume,
    bidPercent: totalVolume > 0 ? (totalBidVolume / totalVolume) * 100 : 50,
    askPercent: totalVolume > 0 ? (totalAskVolume / totalVolume) * 100 : 50
  };
});

// Update orderbook with proper state management
const updateOrderBook = (data) => {
  const { b: bids, a: asks, u: updateId, seq: sequence } = data;
  
  // Skip if this is an older update
  if (updateId && updateId <= orderBookState.value.lastUpdateId) {
    return;
  }
  
  if (sequence && sequence <= orderBookState.value.lastSequence) {
    return;
  }
  
  // Update bids
  if (bids && Array.isArray(bids)) {
    bids.forEach(([price, quantity]) => {
      const qty = parseFloat(quantity);
      if (qty === 0) {
        orderBookState.value.bids.delete(price);
      } else {
        orderBookState.value.bids.set(price, quantity);
      }
    });
  }
  
  // Update asks
  if (asks && Array.isArray(asks)) {
    asks.forEach(([price, quantity]) => {
      const qty = parseFloat(quantity);
      if (qty === 0) {
        orderBookState.value.asks.delete(price);
      } else {
        orderBookState.value.asks.set(price, quantity);
      }
    });
  }
  
  // Update tracking
  if (updateId) orderBookState.value.lastUpdateId = updateId;
  if (sequence) orderBookState.value.lastSequence = sequence;
  
  isLoading.value = false;
};

const subscribeToOrderBook = () => {
  const topic = `orderbook.${selectedDepth.value}.${selectedSymbol.value}`;
  
  const handleUpdate = (data) => {
    const now = Date.now();
    // Throttle updates
    if (now - lastUpdate < THROTTLE_MS) {
      return;
    }
    lastUpdate = now;
    
    if (data && data.data) {
      updateOrderBook(data.data);
    }
  };

  try {
    wsService.subscribe(topic, selectedCategory.value, handleUpdate);
    unsubscribe = () => wsService.unsubscribe(topic, selectedCategory.value, handleUpdate);
  } catch (error) {
    console.error('Failed to subscribe to order book:', error);
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
  lastUpdate = 0;
  
  // Reset orderbook state
  orderBookState.value = {
    bids: new Map(),
    asks: new Map(),
    lastUpdateId: 0,
    lastSequence: 0
  };
  
  subscribeToOrderBook();
};

onMounted(() => {
  subscribeToOrderBook();
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
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
      <div>
        <h1 class="text-2xl font-bold text-white mb-1">Order Book</h1>
        <p class="text-gray-400 text-sm">Real-time market depth for {{ selectedSymbol }}</p>
      </div>
      <div class="w-full sm:w-64">
        <SymbolSearch @select="updateSymbol" />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="card text-center py-12">
      <div class="animate-pulse text-gray-400">
        <svg class="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <p>Loading order book...</p>
      </div>
    </div>

    <!-- Order Book Display -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      
      <!-- ASKS Section (Left on Desktop, Top on Mobile) -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-red-400 flex items-center">
            <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
            ASKS
          </h2>
          <span class="text-xs text-gray-400">{{ processedAsks.length }} levels</span>
        </div>

        <!-- Table Header -->
        <div class="grid grid-cols-3 gap-2 text-xs text-gray-400 font-medium pb-2 border-b border-gray-700 mb-2">
          <div class="text-left">Price</div>
          <div class="text-right">Size</div>
          <div class="text-right">Total</div>
        </div>

        <!-- Asks Rows -->
        <div class="space-y-1">
          <div
            v-for="(ask, index) in processedAsks"
            :key="'ask-' + index"
            class="relative"
          >
            <!-- Background bar -->
            <div 
              class="absolute inset-y-0 right-0 bg-red-900 bg-opacity-20 rounded"
              :style="{ width: ((ask.cumulative / maxCumulative) * 100) + '%' }"
            ></div>
            
            <!-- Data -->
            <div class="relative grid grid-cols-3 gap-2 text-xs py-1.5 hover:bg-gray-800 transition-colors rounded px-2">
              <div class="text-red-400 font-medium">{{ ask.price.toFixed(2) }}</div>
              <div class="text-right text-white">{{ ask.quantity.toFixed(4) }}</div>
              <div class="text-right text-gray-400">{{ ask.cumulative.toFixed(4) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- SPREAD & STATISTICS Section (Middle) -->
      <div class="space-y-4">
        <!-- Spread Card -->
        <div class="card bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-yellow-600">
          <div class="text-center">
            <div class="text-yellow-400 text-xs font-semibold mb-2 uppercase tracking-wide">Market Spread</div>
            <div class="text-2xl font-bold text-white mb-1">
              ${{ spread.price.toFixed(2) }}
            </div>
            <div class="text-lg text-yellow-300">
              {{ spread.percent.toFixed(4) }}%
            </div>
            <div class="mt-3 pt-3 border-t border-gray-700 grid grid-cols-2 gap-2 text-xs">
              <div class="text-left">
                <div class="text-gray-500 uppercase text-[10px]">Best Bid</div>
                <div class="text-green-400 font-semibold">{{ processedBids.length > 0 ? processedBids[0].price.toFixed(2) : '-' }}</div>
              </div>
              <div class="text-right">
                <div class="text-gray-500 uppercase text-[10px]">Best Ask</div>
                <div class="text-red-400 font-semibold">{{ processedAsks.length > 0 ? processedAsks[0].price.toFixed(2) : '-' }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Volume Distribution -->
        <div class="card">
          <h3 class="text-sm font-semibold text-gray-300 mb-3 text-center">Market Pressure</h3>
          
          <!-- Visual Bar with Labels -->
          <div class="mb-3">
            <div class="flex justify-between text-[10px] text-gray-400 mb-1 px-1">
              <span class="text-green-400 font-semibold">BUYERS {{ volumeStats.bidPercent.toFixed(1) }}%</span>
              <span class="text-red-400 font-semibold">SELLERS {{ volumeStats.askPercent.toFixed(1) }}%</span>
            </div>
            <div class="relative h-8 bg-gray-800 rounded-lg overflow-hidden">
              <div 
                class="absolute inset-y-0 left-0 bg-gradient-to-r from-green-600 to-green-500 flex items-center justify-center text-white text-xs font-bold transition-all duration-300"
                :style="{ width: volumeStats.bidPercent + '%' }"
              >
                <span v-if="volumeStats.bidPercent > 20">{{ volumeStats.bidPercent.toFixed(0) }}%</span>
              </div>
              <div 
                class="absolute inset-y-0 right-0 bg-gradient-to-l from-red-600 to-red-500 flex items-center justify-center text-white text-xs font-bold transition-all duration-300"
                :style="{ width: volumeStats.askPercent + '%' }"
              >
                <span v-if="volumeStats.askPercent > 20">{{ volumeStats.askPercent.toFixed(0) }}%</span>
              </div>
            </div>
          </div>

          <!-- Volume Stats -->
          <div class="space-y-2 text-xs bg-gray-800 bg-opacity-50 rounded-lg p-3">
            <div class="flex justify-between items-center">
              <span class="text-green-400 flex items-center font-medium">
                <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Bid Volume
              </span>
              <span class="text-white font-semibold">{{ volumeStats.totalBidVolume.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-red-400 flex items-center font-medium">
                <span class="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                Ask Volume
              </span>
              <span class="text-white font-semibold">{{ volumeStats.totalAskVolume.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between items-center pt-2 border-t border-gray-700">
              <span class="text-gray-400 font-medium">Total Volume</span>
              <span class="text-white font-bold">{{ volumeStats.totalVolume.toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <!-- Update Info -->
        <div class="card bg-gray-800 bg-opacity-50">
          <div class="text-center text-xs">
            <div class="text-gray-500 mb-1">Last Update ID</div>
            <div class="text-gray-300 font-mono">{{ orderBookState.lastUpdateId }}</div>
          </div>
        </div>
      </div>

      <!-- BIDS Section (Right on Desktop, Bottom on Mobile) -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-green-400 flex items-center">
            <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clip-rule="evenodd" />
            </svg>
            BIDS
          </h2>
          <span class="text-xs text-gray-400">{{ processedBids.length }} levels</span>
        </div>

        <!-- Table Header -->
        <div class="grid grid-cols-3 gap-2 text-xs text-gray-400 font-medium pb-2 border-b border-gray-700 mb-2">
          <div class="text-left">Price</div>
          <div class="text-right">Size</div>
          <div class="text-right">Total</div>
        </div>

        <!-- Bids Rows -->
        <div class="space-y-1">
          <div
            v-for="(bid, index) in processedBids"
            :key="'bid-' + index"
            class="relative"
          >
            <!-- Background bar -->
            <div 
              class="absolute inset-y-0 right-0 bg-green-900 bg-opacity-20 rounded"
              :style="{ width: ((bid.cumulative / maxCumulative) * 100) + '%' }"
            ></div>
            
            <!-- Data -->
            <div class="relative grid grid-cols-3 gap-2 text-xs py-1.5 hover:bg-gray-800 transition-colors rounded px-2">
              <div class="text-green-400 font-medium">{{ bid.price.toFixed(2) }}</div>
              <div class="text-right text-white">{{ bid.quantity.toFixed(4) }}</div>
              <div class="text-right text-gray-400">{{ bid.cumulative.toFixed(4) }}</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* Smooth transitions */
.transition-colors {
  transition: background-color 0.2s ease;
}

/* Custom animations */
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
