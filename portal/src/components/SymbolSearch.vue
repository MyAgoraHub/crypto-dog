<script setup>
import { ref, computed, watch } from 'vue';
import { cryptoAPI } from '../services/api';

const emit = defineEmits(['select']);

const searchQuery = ref('');
const symbols = ref([]);
const isSearching = ref(false);
const showDropdown = ref(false);

// Get common symbols on mount
const commonSymbols = cryptoAPI.getCommonSymbols();

const filteredSymbols = computed(() => {
  if (!searchQuery.value) {
    return commonSymbols.slice(0, 10);
  }
  
  const query = searchQuery.value.toLowerCase();
  return commonSymbols.filter(
    s => s.symbol.toLowerCase().includes(query) || 
         s.name.toLowerCase().includes(query)
  ).slice(0, 10);
});

watch(searchQuery, (newQuery) => {
  if (newQuery.length > 0) {
    showDropdown.value = true;
  } else {
    showDropdown.value = false;
  }
});

const selectSymbol = (symbolData) => {
  emit('select', symbolData);
  searchQuery.value = '';
  showDropdown.value = false;
};

const handleBlur = () => {
  // Delay to allow click event to fire
  setTimeout(() => {
    showDropdown.value = false;
  }, 200);
};

const handleFocus = () => {
  if (searchQuery.value.length > 0 || filteredSymbols.value.length > 0) {
    showDropdown.value = true;
  }
};
</script>

<template>
  <div class="relative">
    <!-- Search Input -->
    <div class="relative">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search symbols (e.g., BTC, ETH, SOL)..."
        class="input w-full pl-10"
        @focus="handleFocus"
        @blur="handleBlur"
      />
      <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </div>

    <!-- Dropdown -->
    <div
      v-if="showDropdown && filteredSymbols.length > 0"
      class="absolute z-10 w-full mt-2 bg-gray-800 rounded-lg shadow-xl border border-gray-700 max-h-64 overflow-y-auto"
    >
      <div
        v-for="symbol in filteredSymbols"
        :key="symbol.symbol"
        @click="selectSymbol(symbol)"
        class="px-4 py-3 hover:bg-gray-700 cursor-pointer transition-colors border-b border-gray-700 last:border-b-0"
      >
        <div class="flex items-center justify-between">
          <div>
            <div class="font-semibold text-white">{{ symbol.symbol }}</div>
            <div class="text-sm text-gray-400">{{ symbol.name }}</div>
          </div>
          <div class="text-xs text-gray-500 uppercase">{{ symbol.category }}</div>
        </div>
      </div>
    </div>

    <!-- No Results -->
    <div
      v-if="showDropdown && searchQuery && filteredSymbols.length === 0"
      class="absolute z-10 w-full mt-2 bg-gray-800 rounded-lg shadow-xl border border-gray-700 px-4 py-3"
    >
      <div class="text-gray-400 text-sm">No symbols found</div>
    </div>
  </div>
</template>

<style scoped>
.relative {
  position: relative;
}

.absolute {
  position: absolute;
}

.inset-y-0 {
  top: 0;
  bottom: 0;
}

.left-0 {
  left: 0;
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

.pl-3 {
  padding-left: 0.75rem;
}

.pl-10 {
  padding-left: 2.5rem;
}

.px-4 {
  padding-left: 1rem;
  padding-right: 1rem;
}

.py-3 {
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
}

.mt-2 {
  margin-top: 0.5rem;
}

.w-full {
  width: 100%;
}

.z-10 {
  z-index: 10;
}

.max-h-64 {
  max-height: 16rem;
}

.overflow-y-auto {
  overflow-y: auto;
}

.pointer-events-none {
  pointer-events: none;
}

.cursor-pointer {
  cursor: pointer;
}

.border {
  border-width: 1px;
}

.border-b {
  border-bottom-width: 1px;
}

.last\:border-b-0:last-child {
  border-bottom-width: 0;
}
</style>
