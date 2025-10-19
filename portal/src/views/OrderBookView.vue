<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import wsService from '../services/websocket';
import SymbolSearch from '../components/SymbolSearch.vue';

const selectedSymbol = ref('BTCUSDT');
const selectedCategory = ref('spot');
const orderBook = ref({ bids: [], asks: [] });
const isLoading = ref(true);
let unsubscribe = null;
let lastUpdate = 0;
const THROTTLE_MS = 500; // Update every 500ms max
const MIN_ORDERS = 10; // Minimum orders required before displaying
const DISPLAY_LEVELS = 10; // Number of levels to display

const maxTotal = computed(() => {
  const bidTotals = orderBook.value.bids.slice(0, DISPLAY_LEVELS).map(b => parseFloat(b[0]) * parseFloat(b[1]));
  const askTotals = orderBook.value.asks.slice(0, DISPLAY_LEVELS).map(a => parseFloat(a[0]) * parseFloat(a[1]));
  return Math.max(...bidTotals, ...askTotals) || 1;
});

const processedBids = computed(() => {
  return orderBook.value.bids.slice(0, DISPLAY_LEVELS).map(bid => ({
    price: parseFloat(bid[0]),
    size: parseFloat(bid[1]),
    total: parseFloat(bid[0]) * parseFloat(bid[1]),
    percentage: ((parseFloat(bid[0]) * parseFloat(bid[1])) / maxTotal.value) * 100,
  }));
});

const processedAsks = computed(() => {
  return orderBook.value.asks.slice(0, DISPLAY_LEVELS).map(ask => ({
    price: parseFloat(ask[0]),
    size: parseFloat(ask[1]),
    total: parseFloat(ask[0]) * parseFloat(ask[1]),
    percentage: ((parseFloat(ask[0]) * parseFloat(ask[1])) / maxTotal.value) * 100,
  })).reverse();
});

const spread = computed(() => {
  if (orderBook.value.asks.length === 0 || orderBook.value.bids.length === 0) return 0;
  const lowestAsk = parseFloat(orderBook.value.asks[0][0]);
  const highestBid = parseFloat(orderBook.value.bids[0][0]);
  return lowestAsk - highestBid;
});

const spreadPercent = computed(() => {
  if (orderBook.value.asks.length === 0) return 0;
  const lowestAsk = parseFloat(orderBook.value.asks[0][0]);
  return ((spread.value / lowestAsk) * 100).toFixed(3);
});

const subscribeToOrderBook = () => {
  const topic = `orderbook.50.${selectedSymbol.value}`;
  
  const handleUpdate = (data) => {
    const now = Date.now();
    // Throttle updates
    if (now - lastUpdate < THROTTLE_MS) {
      return;
    }
    
    if (data && data.data) {
      const bids = data.data.b || [];
      const asks = data.data.a || [];
      
      // Only update if we have at least 50 bids AND 50 asks
      if (bids.length >= MIN_ORDERS && asks.length >= MIN_ORDERS) {
        lastUpdate = now;
        orderBook.value = {
          bids: bids,
          asks: asks,
        };
        isLoading.value = false;
      } else {
        console.log(`Waiting for complete data: ${bids.length} bids, ${asks.length} asks (need ${MIN_ORDERS} each)`);
      }
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
  orderBook.value = { bids: [], asks: [] }; // Clear old data
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
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-white mb-1">Order Book</h1>
        <p class="text-gray-400 text-sm">Real-time market depth for {{ selectedSymbol }}</p>
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

    <!-- Spread Info -->
    <div v-if="!isLoading" class="card mb-6 bg-gray-800 bg-opacity-50">
      <div class="grid grid-cols-3 gap-4 text-center">
        <div>
          <div class="text-gray-400 text-sm">Spread</div>
          <div class="text-white font-semibold text-lg">${{ spread.toFixed(2) }}</div>
        </div>
        <div>
          <div class="text-gray-400 text-sm">Spread %</div>
          <div class="text-white font-semibold text-lg">{{ spreadPercent }}%</div>
        </div>
        <div>
          <div class="text-gray-400 text-sm">Depth</div>
          <div class="text-white font-semibold text-lg">{{ processedAsks.length + processedBids.length }}</div>
        </div>
      </div>
    </div>

    <!-- Order Book -->
    <div class="card">
      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-12">
        <div class="animate-pulse text-gray-400">
          <svg class="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <p>Loading order book...</p>
        </div>
      </div>

      <!-- Order Book Data - Side by Side -->
      <div v-else>
        <!-- Headers -->
        <div class="grid grid-cols-2 gap-2 md:gap-4 mb-4">
          <!-- Bids Header -->
          <div class="text-center">
            <h3 class="text-sm md:text-lg font-semibold text-green-400 mb-2">Bids</h3>
            <div class="grid grid-cols-2 gap-1 md:gap-2 text-[10px] md:text-xs text-gray-400 font-medium pb-2 border-b border-gray-700">
              <div class="text-left">Price</div>
              <div class="text-right">Size</div>
            </div>
          </div>
          
          <!-- Asks Header -->
          <div class="text-center">
            <h3 class="text-sm md:text-lg font-semibold text-red-400 mb-2">Asks</h3>
            <div class="grid grid-cols-2 gap-1 md:gap-2 text-[10px] md:text-xs text-gray-400 font-medium pb-2 border-b border-gray-700">
              <div class="text-left">Price</div>
              <div class="text-right">Size</div>
            </div>
          </div>
        </div>

        <!-- Order Book Rows -->
        <div class="grid grid-cols-2 gap-2 md:gap-4">
          <!-- Bids Column (Left) -->
          <div class="space-y-0.5 md:space-y-1">
            <div
              v-for="(bid, index) in processedBids"
              :key="'bid-' + index"
              class="relative grid grid-cols-2 gap-1 md:gap-2 text-[10px] md:text-sm py-0.5 md:py-1.5 hover:bg-gray-800 transition-colors rounded"
            >
              <div 
                class="absolute inset-0 bg-green-900 bg-opacity-10 rounded"
                :style="{ width: bid.percentage + '%' }"
              ></div>
              <div class="relative text-green-400 font-medium text-left truncate">{{ bid.price.toFixed(2) }}</div>
              <div class="relative text-right text-white truncate">{{ bid.size.toFixed(4) }}</div>
            </div>
          </div>

          <!-- Asks Column (Right) -->
          <div class="space-y-0.5 md:space-y-1">
            <div
              v-for="(ask, index) in processedAsks"
              :key="'ask-' + index"
              class="relative grid grid-cols-2 gap-1 md:gap-2 text-[10px] md:text-sm py-0.5 md:py-1.5 hover:bg-gray-800 transition-colors rounded"
            >
              <div 
                class="absolute inset-0 bg-red-900 bg-opacity-10 rounded"
                :style="{ width: ask.percentage + '%' }"
              ></div>
              <div class="relative text-red-400 font-medium text-left truncate">{{ ask.price.toFixed(2) }}</div>
              <div class="relative text-right text-white truncate">{{ ask.size.toFixed(4) }}</div>
            </div>
          </div>
        </div>

        <!-- Spread Indicator at Bottom -->
        <div class="mt-4 pt-4 border-t border-gray-700">
          <div class="text-center">
            <div class="text-gray-400 text-xs mb-1">SPREAD</div>
            <div class="text-white font-semibold">${{ spread.toFixed(2) }} <span class="text-gray-400 text-sm">({{ spreadPercent }}%)</span></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grid-cols-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.grid-cols-4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.text-left {
  text-align: left;
}

.overflow-x-auto {
  overflow-x: auto;
}

.pb-3 {
  padding-bottom: 0.75rem;
}

.py-2 {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

.py-3 {
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
}

.my-4 {
  margin-top: 1rem;
  margin-bottom: 1rem;
}

.border-y {
  border-top-width: 1px;
  border-bottom-width: 1px;
}

.inset-y-0 {
  top: 0;
  bottom: 0;
}

.right-0 {
  right: 0;
}

.space-x-4 > * + * {
  margin-left: 1rem;
}
</style>
