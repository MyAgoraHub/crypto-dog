<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import wsService from '../services/websocket';

const props = defineProps({
  symbol: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    default: 'spot',
  },
});

const emit = defineEmits(['remove']);

const tickerData = ref({
  lastPrice: '0.00',
  price24hPcnt: '0',
  highPrice24h: '0',
  lowPrice24h: '0',
  volume24h: '0',
  turnover24h: '0',
});

const isLoading = ref(true);
const priceChange = ref(0); // For animation
let unsubscribe = null;

const priceChangePercent = computed(() => {
  const change = parseFloat(tickerData.value.price24hPcnt) * 100;
  return change.toFixed(2);
});

const isPriceUp = computed(() => parseFloat(priceChangePercent.value) >= 0);

const formattedPrice = computed(() => {
  const price = parseFloat(tickerData.value.lastPrice);
  if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(6);
});

const formattedVolume = computed(() => {
  const vol = parseFloat(tickerData.value.volume24h);
  if (vol >= 1000000) return (vol / 1000000).toFixed(2) + 'M';
  if (vol >= 1000) return (vol / 1000).toFixed(2) + 'K';
  return vol.toFixed(2);
});

const subscribeToTicker = () => {
  const topic = `tickers.${props.symbol}`;
  
  const handleUpdate = (data) => {
    if (data && data.data) {
      const oldPrice = parseFloat(tickerData.value.lastPrice);
      const newPrice = parseFloat(data.data.lastPrice);
      
      priceChange.value = newPrice > oldPrice ? 1 : newPrice < oldPrice ? -1 : 0;
      
      tickerData.value = {
        lastPrice: data.data.lastPrice || '0',
        price24hPcnt: data.data.price24hPcnt || '0',
        highPrice24h: data.data.highPrice24h || '0',
        lowPrice24h: data.data.lowPrice24h || '0',
        volume24h: data.data.volume24h || '0',
        turnover24h: data.data.turnover24h || '0',
      };
      
      isLoading.value = false;
      
      // Reset price change animation after 500ms
      if (priceChange.value !== 0) {
        setTimeout(() => {
          priceChange.value = 0;
        }, 500);
      }
    }
  };

  try {
    wsService.subscribe(topic, props.category, handleUpdate);
    unsubscribe = () => wsService.unsubscribe(topic, props.category, handleUpdate);
  } catch (error) {
    console.error('Failed to subscribe to ticker:', error);
    isLoading.value = false;
  }
};

onMounted(() => {
  subscribeToTicker();
});

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe();
  }
});

watch(() => props.symbol, () => {
  if (unsubscribe) {
    unsubscribe();
  }
  isLoading.value = true;
  subscribeToTicker();
});

const removeTicker = () => {
  if (unsubscribe) {
    unsubscribe();
  }
  emit('remove', props.symbol);
};
</script>

<template>
  <div class="card card-hover">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center space-x-2">
        <h3 class="text-xl font-bold text-white">{{ symbol }}</h3>
        <span class="text-xs text-gray-400 uppercase">{{ category }}</span>
      </div>
      <button 
        @click="removeTicker"
        class="text-gray-400 hover:text-red-400 transition-colors"
        title="Remove ticker"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-8">
      <div class="animate-pulse">
        <div class="h-8 bg-gray-700 rounded w-32 mx-auto mb-2"></div>
        <div class="h-4 bg-gray-700 rounded w-24 mx-auto"></div>
      </div>
    </div>

    <!-- Price Data -->
    <div v-else>
      <!-- Main Price -->
      <div class="mb-4">
        <div 
          class="text-3xl font-bold transition-colors"
          :class="{
            'text-white': priceChange === 0,
            'text-green-400': priceChange === 1,
            'text-red-400': priceChange === -1
          }"
        >
          ${{ formattedPrice }}
        </div>
        <div 
          class="text-sm font-medium mt-1"
          :class="isPriceUp ? 'text-green-400' : 'text-red-400'"
        >
          {{ isPriceUp ? '+' : '' }}{{ priceChangePercent }}%
          <span class="text-gray-400">24h</span>
        </div>
      </div>

      <!-- 24h Stats -->
      <div class="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div class="text-gray-400">24h High</div>
          <div class="text-white font-medium">${{ parseFloat(tickerData.highPrice24h).toFixed(2) }}</div>
        </div>
        <div>
          <div class="text-gray-400">24h Low</div>
          <div class="text-white font-medium">${{ parseFloat(tickerData.lowPrice24h).toFixed(2) }}</div>
        </div>
        <div>
          <div class="text-gray-400">24h Volume</div>
          <div class="text-white font-medium">{{ formattedVolume }}</div>
        </div>
        <div>
          <div class="text-gray-400">Turnover</div>
          <div class="text-white font-medium">${{ (parseFloat(tickerData.turnover24h) / 1000000).toFixed(2) }}M</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.space-x-2 > * + * {
  margin-left: 0.5rem;
}

.text-xl {
  font-size: 1.25rem;
  line-height: 1.75rem;
}

.text-xs {
  font-size: 0.75rem;
  line-height: 1rem;
}

.text-3xl {
  font-size: 1.875rem;
  line-height: 2.25rem;
}

.uppercase {
  text-transform: uppercase;
}

.py-8 {
  padding-top: 2rem;
  padding-bottom: 2rem;
}

.gap-3 {
  gap: 0.75rem;
}

.grid-cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
</style>
