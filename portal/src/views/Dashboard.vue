<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import TickerCard from '../components/TickerCard.vue';
import SymbolSearch from '../components/SymbolSearch.vue';

const tickers = reactive([
  { symbol: 'BTCUSDT', category: 'spot' },
  { symbol: 'ETHUSDT', category: 'spot' },
]);

const showAddTicker = ref(false);

const addTicker = (symbolData) => {
  if (!tickers.find(t => t.symbol === symbolData.symbol)) {
    tickers.push({
      symbol: symbolData.symbol,
      category: symbolData.category || 'spot',
    });
  }
  showAddTicker.value = false;
};

const removeTicker = (symbol) => {
  const index = tickers.findIndex(t => t.symbol === symbol);
  if (index > -1) {
    tickers.splice(index, 1);
  }
};
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-white">Live Market Dashboard</h1>
        <p class="text-gray-400 mt-1 text-sm">Real-time cryptocurrency prices and order books</p>
      </div>
      <button 
        @click="showAddTicker = !showAddTicker"
        class="btn btn-primary flex items-center"
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add Ticker
      </button>
    </div>

    <!-- Symbol Search -->
    <div v-if="showAddTicker" class="mb-6">
      <div class="card">
        <h3 class="text-lg font-semibold text-white mb-4">Search and Add Symbol</h3>
        <SymbolSearch @select="addTicker" />
      </div>
    </div>

    <!-- Ticker Grid -->
    <div v-if="tickers.length === 0" class="text-center py-12">
      <div class="text-gray-400 text-lg">
        <svg class="w-12 h-12 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p>No tickers added yet</p>
        <p class="text-sm mt-2">Click "Add Ticker" to start monitoring crypto prices</p>
      </div>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <TickerCard
        v-for="ticker in tickers"
        :key="ticker.symbol"
        :symbol="ticker.symbol"
        :category="ticker.category"
        @remove="removeTicker"
      />
    </div>
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .grid-cols-1.md\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .grid-cols-1.lg\:grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.flex {
  display: flex;
}

.items-center {
  align-items: center;
}

.justify-between {
  justify-content: space-between;
}

.mb-6 {
  margin-bottom: 1.5rem;
}

.mb-4 {
  margin-bottom: 1rem;
}

.mt-1 {
  margin-top: 0.25rem;
}

.mt-2 {
  margin-top: 0.5rem;
}

.text-3xl {
  font-size: 1.875rem;
  line-height: 2.25rem;
}

.text-lg {
  font-size: 1.125rem;
  line-height: 1.75rem;
}

.text-sm {
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.font-bold {
  font-weight: 700;
}

.font-semibold {
  font-weight: 600;
}

.text-center {
  text-align: center;
}

.py-12 {
  padding-top: 3rem;
  padding-bottom: 3rem;
}

.w-5 {
  width: 1.25rem;
}

.h-5 {
  height: 1.25rem;
}

.w-16 {
  width: 4rem;
}

.h-16 {
  height: 4rem;
}

.mx-auto {
  margin-left: auto;
  margin-right: auto;
}
</style>
