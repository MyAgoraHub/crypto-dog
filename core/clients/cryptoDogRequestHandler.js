import { RestClientV5 } from 'bybit-api';


// ********************* Public API Request Handlers Start *********************

export async function getInstrumentsInfo(category) {
  const client = new RestClientV5();
  try {
    const symbols = await client.getInstrumentsInfo({
      category: category
    });
    return symbols;
  } catch (error) {
    console.error('Error fetching symbols:', error);
  }
}

export function getIntervals() {
  return {
    '1m': {value:"1", label: '1 minute'},
    '3m': {value:"3", label: '3 minutes'},
    '5m': {value:"5", label: '5 minutes'},
    '15m': {value:"15", label: '15 minutes'},
    '30m': {value:"30", label: '30 minutes'},
    '1h': {value:"60", label: '1 hour (60 minutes)'},
    '2h': {value:"120", label: '2 hours'},
    '4h': {value:"240", label: '4 hours'},
    '6h': {value:"360", label: '6 hours'},
    '12h': {value:"720", label: '12 hours'},
    '1D': {value:"D", label: '1 day'},
    '1W': {value:"W", label: '1 week'},
    '1M': {value:"M", label: '1 month'}
  };
};

export function getInterval(interval) {
  const intervals = getIntervals();
  
  // Handle direct lookup (e.g., '15m', '1h')
  if (intervals[interval]) {
    return intervals[interval];
  }
  
  // Handle numeric format (e.g., '15' -> '15m', '60' -> '1h')
  const numericInterval = parseInt(interval);
  if (!isNaN(numericInterval)) {
    // Map common numeric intervals to their string equivalents
    const numericMap = {
      1: '1m',
      3: '3m', 
      5: '5m',
      15: '15m',
      30: '30m',
      60: '1h',
      120: '2h',
      240: '4h',
      360: '6h',
      720: '12h'
    };
    
    if (numericMap[numericInterval]) {
      return intervals[numericMap[numericInterval]];
    }
  }
  
  // If no match found, return undefined (will cause the original error to be more descriptive)
  return undefined;
};

export async function getTickers(category, symbol) {
  const client = new RestClientV5();
  try {
    const tickers = await client.getTickers({
      category: category,
      symbol: symbol  // Optional: specify a symbol like 'BTCUSDT' for a single ticker, or omit for all tickers in the category
    });
    return tickers;
  } catch (error) {
    console.error('Error fetching tickers:', error);
  }
}

export async function getKlineCandles(category, symbol, interval, start=null, end=null, limit = 200) {
  const client = new RestClientV5();
  try {
    const params = {
      category: category,
      symbol: symbol,
      interval: interval,
      limit: limit
    };
    
    // Bybit uses 'start' and 'end' (not startTime/endTime)
    if (start) params.start = start;
    if (end) params.end = end;
    
    const klineData = await client.getKline(params);
    return klineData;
  } catch (error) {
    console.error('Error fetching kline data:', error);
  }
};

export async function getOrderBook(category, symbol, limit=50) {
  const client = new RestClientV5();
  try {
    const orderBook = await client.getOrderbook({
      category: category,
      symbol: symbol,
      limit: limit
    });
    return orderBook;
  } catch (error) {
    console.error('Error fetching order book data:', error);
  }
};

// ********************* Public API Request Handlers End *********************