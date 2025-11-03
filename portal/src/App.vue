<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import wsService from './services/websocket';

const router = useRouter();
const isConnected = wsService.isConnected;
const sidebarOpen = ref(false);

onMounted(() => {
  // Initialize WebSocket connection
  wsService.connect();
});

const navigation = [
  { name: 'Dashboard', path: '/', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { name: 'Indicators', path: '/indicators', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { name: 'Order Book', path: '/orderbook', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { name: 'Trades', path: '/trades', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
  { name: 'Signals', path: '/signals', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
  { name: 'Config', path: '/signals/config', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4' },
  { name: 'Backtest', path: '/backtest', icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z' },
];

const toggleSidebar = () => {
  console.log('Toggle sidebar - current:', sidebarOpen.value);
  sidebarOpen.value = !sidebarOpen.value;
  console.log('Toggle sidebar - new:', sidebarOpen.value);
};

const closeSidebar = () => {
  console.log('Close sidebar');
  sidebarOpen.value = false;
};
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-white">
    <!-- Mobile Overlay -->
    <div 
      v-if="sidebarOpen" 
      class="fixed inset-0 bg-black bg-opacity-50 z-20"
      @click="closeSidebar"
    ></div>

    <!-- Sidebar - Always fixed/overlay -->
    <aside 
      class="fixed inset-y-0 left-0 z-30 w-64 bg-gray-800 border-r border-gray-700 sidebar-transition"
      :style="{ transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)' }"
    >
      <div class="flex flex-col h-full">
        <!-- Logo Section -->
        <div class="flex items-center justify-between h-16 px-6 border-b border-gray-700">
          <h1 class="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            🐕 Crypto Dog
          </h1>
          <button 
            @click.stop="closeSidebar"
            type="button"
            class="text-gray-400 hover:text-white focus:outline-none"
            aria-label="Close sidebar"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Navigation Links -->
        <nav class="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <router-link
            v-for="item in navigation"
            :key="item.name"
            :to="item.path"
            @click.stop="closeSidebar"
            class="flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200"
            :class="$route.path === item.path 
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
              : 'text-gray-300 hover:bg-gray-700 hover:text-white'"
          >
            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon" />
            </svg>
            <span>{{ item.name }}</span>
          </router-link>
        </nav>

        <!-- Connection Status -->
        <div class="px-6 py-4 border-t border-gray-700">
          <div class="flex items-center space-x-3 px-4 py-3 rounded-lg bg-gray-700/50">
            <div class="relative flex-shrink-0">
              <div 
                class="w-3 h-3 rounded-full transition-colors"
                :class="isConnected ? 'bg-green-500' : 'bg-red-500'"
              ></div>
              <div 
                v-if="isConnected"
                class="absolute inset-0 w-3 h-3 rounded-full bg-green-500 animate-ping opacity-75"
              ></div>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-gray-400">Status</p>
              <p class="text-sm font-semibold truncate" :class="isConnected ? 'text-green-400' : 'text-red-400'">
                {{ isConnected ? 'Connected' : 'Disconnected' }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Content Area - Full width, no flex layout -->
    <div class="min-h-screen flex flex-col">
      <!-- Top Bar -->
      <header class="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div class="flex items-center justify-between h-16 px-4">
          <button 
            @click.stop="toggleSidebar"
            type="button"
            class="text-gray-400 hover:text-white focus:outline-none transition-colors"
            aria-label="Toggle sidebar"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 class="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            🐕 Crypto Dog
          </h1>
          <!-- Connection Status Badge -->
          <div class="flex items-center space-x-2">
            <div class="relative">
              <div 
                class="w-2.5 h-2.5 rounded-full transition-colors"
                :class="isConnected ? 'bg-green-500' : 'bg-red-500'"
              ></div>
              <div 
                v-if="isConnected"
                class="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-500 animate-ping opacity-75"
              ></div>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex-1 overflow-auto bg-gray-900">
        <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
@keyframes ping {
  75%, 100% {
    transform: scale(2);
    opacity: 0;
  }
}

.animate-ping {
  animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
}

/* Smooth sidebar transitions */
.sidebar-transition {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Custom scrollbar for sidebar */
aside nav::-webkit-scrollbar {
  width: 6px;
}

aside nav::-webkit-scrollbar-track {
  background: transparent;
}

aside nav::-webkit-scrollbar-thumb {
  background: rgba(107, 114, 128, 0.5);
  border-radius: 3px;
}

aside nav::-webkit-scrollbar-thumb:hover {
  background: rgba(107, 114, 128, 0.7);
}
</style>
