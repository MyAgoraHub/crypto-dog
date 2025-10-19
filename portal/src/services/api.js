import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const cryptoAPI = {
  // Get available trading intervals
  async getIntervals() {
    const response = await apiClient.get('/api/intervals');
    return response.data;
  },

  // Get ticker data for a symbol
  async getTicker(category = 'spot', symbol = 'BTCUSDT') {
    const response = await apiClient.get('/api/ticker', {
      params: { category, symbol },
    });
    return response.data;
  },

  // Get candle/kline data
  async getCandles(category, symbol, interval, limit = 50) {
    const response = await apiClient.get('/api/candles', {
      params: { category, symbol, interval, limit },
    });
    return response.data;
  },

  // Get order book depth
  async getOrderBook(category, symbol, limit = 25) {
    const response = await apiClient.get('/api/orderbook', {
      params: { category, symbol, limit },
    });
    return response.data;
  },

  // Get indicator data
  async getIndicator(indicator, category, symbol, interval, iterations = 5, candles = 200) {
    const response = await apiClient.get(`/api/indicator/${indicator}`, {
      params: { category, symbol, interval, iterations, candles },
    });
    return response.data;
  },

  // Get multiple indicators at once
  async getIndicators(indicators, category, symbol, interval, iterations = 5, candles = 200) {
    const promises = indicators.map((indicator) =>
      this.getIndicator(indicator, category, symbol, interval, iterations, candles)
    );
    return Promise.all(promises);
  },

  // Search symbols (if backend supports it)
  async searchSymbols(query) {
    try {
      const response = await apiClient.get('/api/symbols/search', {
        params: { query },
      });
      return response.data;
    } catch (error) {
      // Fallback to common symbols if search not implemented
      return this.getCommonSymbols().filter((s) =>
        s.symbol.toLowerCase().includes(query.toLowerCase())
      );
    }
  },

  // Get list of common trading pairs
  getCommonSymbols() {
    return [
      { symbol: 'BTCUSDT', name: 'Bitcoin', category: 'spot' },
      { symbol: 'ETHUSDT', name: 'Ethereum', category: 'spot' },
      { symbol: 'BNBUSDT', name: 'BNB', category: 'spot' },
      { symbol: 'SOLUSDT', name: 'Solana', category: 'spot' },
      { symbol: 'XRPUSDT', name: 'Ripple', category: 'spot' },
      { symbol: 'ADAUSDT', name: 'Cardano', category: 'spot' },
      { symbol: 'DOGEUSDT', name: 'Dogecoin', category: 'spot' },
      { symbol: 'MATICUSDT', name: 'Polygon', category: 'spot' },
      { symbol: 'DOTUSDT', name: 'Polkadot', category: 'spot' },
      { symbol: 'AVAXUSDT', name: 'Avalanche', category: 'spot' },
      { symbol: 'LINKUSDT', name: 'Chainlink', category: 'spot' },
      { symbol: 'ATOMUSDT', name: 'Cosmos', category: 'spot' },
      { symbol: 'UNIUSDT', name: 'Uniswap', category: 'spot' },
      { symbol: 'LTCUSDT', name: 'Litecoin', category: 'spot' },
      { symbol: 'NEARUSDT', name: 'NEAR Protocol', category: 'spot' },
    ];
  },
};

export default apiClient;
