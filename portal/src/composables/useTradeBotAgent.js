import { ref, onUnmounted } from 'vue';
import wsService from '../services/websocket.js';
import apiClient from '../services/api.js';

export function useTradeBotAgent() {
  const klineData = ref([]);
  const indicators = ref({});
  const currentPrice = ref(0);
  const isSubscribed = ref(false);
  const maxSize = 2000;
  const minLoadSize = 201;
  
  let wsUnsubscribe = null;
  let pricePollingInterval = null;
  let currentSymbol = null;
  let currentCategory = null;

  const isKlineDataLoaded = () => {
    return klineData.value.length > 0;
  };

  const isNewDataPoint = (open, high, low, close, volume, timestamp) => {
    if (!isKlineDataLoaded()) {
      return true;
    }

    const lastEntry = klineData.value[klineData.value.length - 1];
    const [lastTimestamp, lastOpen, lastHigh, lastLow, lastClose, lastVolume] = lastEntry;

    const isSameTimestamp = lastTimestamp === timestamp;
    const isIdenticalData = (
      lastOpen === open &&
      lastHigh === high &&
      lastLow === low &&
      lastClose === close &&
      lastVolume === volume
    );

    return !isSameTimestamp && !isIdenticalData;
  };

  const loadData = (open, close, high, low, volume, timestamp, end) => {
    const currentDate = new Date();
    const addNewCandle = new Date(end) <= currentDate;
    
    if (addNewCandle) {
      klineData.value.push([timestamp, open, high, low, close, volume]);
    } else {
      if (isNewDataPoint(open, high, low, close, volume, timestamp)) {
        klineData.value[klineData.value.length - 1] = [timestamp, open, high, low, close, volume];
      }
    }
    
    trimDataBuffer();
  };

  const trimDataBuffer = () => {
    if (klineData.value.length <= maxSize) return;
    klineData.value = klineData.value.slice(klineData.value.length - maxSize);
  };

  const loadIndicators = async () => {
    if (klineData.value.length < 50) {
      console.log('⚠️ Not enough kline data for indicators:', klineData.value.length);
      return;
    }

    try {
      console.log('📊 Calculating indicators from', klineData.value.length, 'candles...');
      
      // Send kline data to server to calculate all indicators
      const response = await apiClient.post('/api/indicators/calculate-all', {
        klineData: klineData.value
      });

      if (response.data) {
        indicators.value = response.data;
        console.log('✅ Indicators updated:', Object.keys(indicators.value).length, 'indicators');
        console.log('Indicator keys:', Object.keys(indicators.value));
      }
    } catch (error) {
      console.error('❌ Failed to calculate indicators:', error);
    }
  };

  const startRealTimeKlineFeed = async (symbol, interval, category = 'spot') => {
    try {
      // Stop any existing subscription
      stopRealTimeKlineFeed();

      // Store current config for polling
      currentSymbol = symbol;
      currentCategory = category;

      console.log('🚀 Starting real-time kline feed for', symbol, interval, category);

      // Map interval to numeric format (e.g., '1m' -> '1', '1h' -> '60')
      const intervalMap = {
        '1m': '1',
        '3m': '3',
        '5m': '5',
        '15m': '15',
        '30m': '30',
        '1h': '60',
        '2h': '120',
        '4h': '240',
        '6h': '360',
        '12h': '720',
        '1d': 'D',
        '1w': 'W',
        '1M': 'M'
      };

      const apiInterval = intervalMap[interval] || interval;
      console.log('📊 Mapped interval:', interval, '→', apiInterval);

      // Fetch historical kline data
      const response = await apiClient.get('/api/candles', {
        params: {
          category,
          symbol,
          interval: apiInterval,
          limit: minLoadSize
        }
      });

      console.log('📥 Received API response:', response.data);

      if (response.data?.result?.list) {
        // Reverse to get chronological order (oldest first)
        klineData.value = response.data.result.list.reverse().map(k => [
          parseInt(k[0]), // timestamp
          parseFloat(k[1]), // open
          parseFloat(k[2]), // high
          parseFloat(k[3]), // low
          parseFloat(k[4]), // close
          parseFloat(k[5])  // volume
        ]);

        console.log('✅ Loaded', klineData.value.length, 'historical candles');
        console.log('First candle:', klineData.value[0]);
        console.log('Last candle:', klineData.value[klineData.value.length - 1]);

        // Calculate initial indicators
        await loadIndicators();

        // Get current price from latest candle
        if (klineData.value.length > 0) {
          const lastCandle = klineData.value[klineData.value.length - 1];
          currentPrice.value = lastCandle[4]; // close price
          console.log('💰 Current price:', currentPrice.value);
        }
      } else {
        console.error('❌ Invalid response format:', response.data);
      }

      // Subscribe to real-time kline updates
      const topic = `kline.${interval}.${symbol}`;
      
      console.log('📡 Subscribing to WebSocket topic:', topic);
      
      const handleKlineUpdate = async (data) => {
        console.log('📊 Received kline update:', data);
        
        if (data?.data) {
          const klines = Array.isArray(data.data) ? data.data : [data.data];
          
          for (const kline of klines) {
            const open = parseFloat(kline.open);
            const high = parseFloat(kline.high);
            const low = parseFloat(kline.low);
            const close = parseFloat(kline.close);
            const volume = parseFloat(kline.volume);
            const timestamp = parseInt(kline.start);
            const end = parseInt(kline.end);

            console.log('📈 Processing kline:', { open, high, low, close, volume, timestamp });

            // Update current price immediately
            currentPrice.value = close;

            // Load new data point
            loadData(open, close, high, low, volume, timestamp, end);

            // Recalculate indicators with new data
            await loadIndicators();
          }
        }
      };

      // Subscribe to kline updates
      wsService.subscribe(topic, category, handleKlineUpdate);
      isSubscribed.value = true;

      // Store unsubscribe function
      wsUnsubscribe = () => {
        wsService.unsubscribe(topic, category, handleKlineUpdate);
        isSubscribed.value = false;
      };

      console.log('✅ Subscribed to', topic);

      // Start polling for price updates as backup (every 3 seconds)
      const pollPrice = async () => {
        try {
          const tickerResponse = await apiClient.get('/api/tickers', {
            params: {
              category: currentCategory,
              symbol: currentSymbol
            }
          });

          if (tickerResponse.data?.result?.list?.[0]) {
            const newPrice = parseFloat(tickerResponse.data.result.list[0].lastPrice);
            if (newPrice !== currentPrice.value) {
              console.log('💰 Price polled:', currentPrice.value, '→', newPrice);
              currentPrice.value = newPrice;
            }
          }
        } catch (err) {
          console.error('❌ Error polling price:', err.message);
        }
      };

      // Poll immediately and then every 3 seconds
      pollPrice();
      pricePollingInterval = setInterval(pollPrice, 3000);
      console.log('🔄 Started price polling (3s interval)');

    } catch (error) {
      console.error('❌ Failed to start kline feed:', error);
      throw error;
    }
  };

  const stopRealTimeKlineFeed = () => {
    console.log('🛑 Stopping kline feed...');
    
    if (wsUnsubscribe) {
      wsUnsubscribe();
      wsUnsubscribe = null;
    }
    
    if (pricePollingInterval) {
      clearInterval(pricePollingInterval);
      pricePollingInterval = null;
      console.log('🛑 Stopped price polling');
    }
    
    isSubscribed.value = false;
    currentSymbol = null;
    currentCategory = null;
  };

  // Cleanup on unmount
  onUnmounted(() => {
    stopRealTimeKlineFeed();
  });

  return {
    klineData,
    indicators,
    currentPrice,
    isSubscribed,
    startRealTimeKlineFeed,
    stopRealTimeKlineFeed
  };
}
