<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import apiClient from '../services/api.js';

const signals = ref([]);
const loading = ref(true);
const error = ref(null);
const filterType = ref('triggered'); // 'all', 'active', 'triggered'
const lastUpdate = ref(null);
const autoRefresh = ref(false);

const fetchSignals = async () => {
  loading.value = true;
  error.value = null;
  try {
    let endpoint = '/api/signals';
    if (filterType.value === 'active') {
      endpoint = '/api/signals/active';
    } else if (filterType.value === 'triggered') {
      endpoint = '/api/signals/triggered';
    }
    
    console.log('Fetching from endpoint:', endpoint);
    const response = await apiClient.get(endpoint);
    console.log('Response:', response.data);
    signals.value = response.data.signals || [];
    console.log('Signals loaded:', signals.value.length);
    console.log('Signal details:', signals.value);
    lastUpdate.value = new Date();
  } catch (err) {
    error.value = 'Failed to load signals: ' + err.message;
    console.error('Error fetching signals:', err);
  } finally {
    loading.value = false;
  }
};

const toggleSignalActive = async (signal) => {
  try {
    signal.isActive = !signal.isActive;
    await apiClient.put(`/api/signals/${signal.id}`, signal);
    await fetchSignals();
  } catch (err) {
    error.value = 'Failed to update signal: ' + err.message;
    console.error('Error updating signal:', err);
  }
};

const deleteSignal = async (signalId) => {
  if (!confirm('Are you sure you want to delete this signal?')) return;
  
  try {
    await apiClient.delete(`/api/signals/${signalId}`);
    await fetchSignals();
  } catch (err) {
    error.value = 'Failed to delete signal: ' + err.message;
    console.error('Error deleting signal:', err);
  }
};

const getSignalTypeColor = (signalType) => {
  if (signalType.includes('Bullish') || signalType.includes('CrossUp') || signalType.includes('Uptrend')) {
    return 'text-green-400 bg-green-900 border-green-500';
  }
  if (signalType.includes('Bearish') || signalType.includes('CrossDown') || signalType.includes('DownTrend')) {
    return 'text-red-400 bg-red-900 border-red-500';
  }
  return 'text-blue-400 bg-blue-900 border-blue-500';
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString();
};

let refreshInterval = null;

onMounted(() => {
  fetchSignals();
  // Auto-refresh every 5 seconds if enabled
  refreshInterval = setInterval(() => {
    if (autoRefresh.value) {
      fetchSignals();
    }
  }, 5000);
});

// Cleanup interval on unmount
onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});
</script>

<template>
  <div class="p-4">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-white mb-2">Signal Monitoring</h1>
      <p class="text-gray-400">Monitor active trading signals and their trigger history</p>
    </div>

    <!-- Filter Controls -->
    <div class="mb-6 flex gap-2 flex-wrap items-center">
      <button
        @click="filterType = 'triggered'; fetchSignals()"
        :class="['px-4 py-2 rounded-lg font-medium transition-colors', 
                 filterType === 'triggered' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600']"
      >
        Triggered Only
      </button>
      <button
        @click="filterType = 'active'; fetchSignals()"
        :class="['px-4 py-2 rounded-lg font-medium transition-colors',
                 filterType === 'active' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600']"
      >
        Active Signals
      </button>
      <button
        @click="filterType = 'all'; fetchSignals()"
        :class="['px-4 py-2 rounded-lg font-medium transition-colors',
                 filterType === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600']"
      >
        All Signals
      </button>
      
      <!-- Auto-refresh toggle -->
      <label class="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-lg text-gray-300 cursor-pointer hover:bg-gray-600 transition-colors">
        <input type="checkbox" v-model="autoRefresh" class="w-4 h-4" />
        <span class="text-sm font-medium">Auto-refresh (5s)</span>
      </label>
      
      <!-- Last update time -->
      <div v-if="lastUpdate" class="text-xs text-gray-500 px-3">
        Last updated: {{ lastUpdate.toLocaleTimeString() }}
      </div>
      
      <button
        @click="fetchSignals"
        class="px-4 py-2 rounded-lg font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors ml-auto"
      >
        🔄 Refresh
      </button>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="mb-4 p-4 bg-red-900 border border-red-500 rounded-lg text-red-200">
      {{ error }}
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <div class="text-gray-400">Loading signals...</div>
    </div>

    <!-- No Signals State -->
    <div v-else-if="signals.length === 0" class="text-center py-12">
      <div class="text-gray-400 mb-4">No signals found</div>
      <router-link to="/signals/config" class="text-blue-400 hover:text-blue-300">
        Create your first signal →
      </router-link>
    </div>

    <!-- Signals Grid -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div
        v-for="signal in signals"
        :key="signal.id"
        class="card p-4"
      >
        <!-- Header -->
        <div class="flex justify-between items-start mb-4">
          <div>
            <h3 class="text-lg font-bold text-white mb-1">
              {{ signal.symbol }} - {{ signal.timeframe }}
            </h3>
            <div :class="['inline-block px-2 py-1 rounded text-xs font-bold border', getSignalTypeColor(signal.signalType)]">
              {{ signal.signalType }}
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="toggleSignalActive(signal)"
              :class="['px-3 py-1 rounded text-xs font-bold transition-colors',
                       signal.isActive ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-600 text-gray-300 hover:bg-gray-500']"
            >
              {{ signal.isActive ? 'Active' : 'Inactive' }}
            </button>
            <button
              @click="deleteSignal(signal.id)"
              class="px-3 py-1 rounded text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>

        <!-- Signal Details -->
        <div class="space-y-2 text-sm mb-4">
          <div class="flex justify-between">
            <span class="text-gray-400">Indicator:</span>
            <span class="text-white font-medium">{{ signal.indicator || 'Price Action' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Value:</span>
            <span class="text-white font-medium">{{ signal.value || 'N/A' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Trigger Count:</span>
            <span :class="['font-bold', signal.triggerCount > 0 ? 'text-yellow-400' : 'text-gray-400']">
              {{ signal.triggerCount }} / {{ signal.maxTriggerTimes }}
            </span>
          </div>
        </div>

        <!-- Timestamps -->
        <div class="space-y-1 text-xs text-gray-500 border-t border-gray-700 pt-3">
          <div class="flex justify-between">
            <span>Created:</span>
            <span>{{ formatDate(signal.createdOn) }}</span>
          </div>
          <div class="flex justify-between">
            <span>Last Executed:</span>
            <span>{{ formatDate(signal.lastExecuted) }}</span>
          </div>
          <div class="flex justify-between">
            <span>Next Invocation:</span>
            <span class="text-blue-400">{{ formatDate(signal.nextInvocation) }}</span>
          </div>
        </div>

        <!-- Trigger Progress Bar -->
        <div v-if="signal.triggerCount > 0" class="mt-3">
          <div class="text-xs text-gray-400 mb-1">Trigger Progress</div>
          <div class="w-full bg-gray-700 rounded-full h-2">
            <div
              class="bg-yellow-500 h-2 rounded-full transition-all duration-300"
              :style="{ width: (signal.triggerCount / signal.maxTriggerTimes * 100) + '%' }"
            ></div>
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
  transition: all 0.3s ease;
}

.card:hover {
  border-color: rgba(59, 130, 246, 0.5);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}
</style>
