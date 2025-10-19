import { getTopicsPerWSKey, WebsocketClient } from 'bybit-api';

export class CryptoDogWebSocketHandler {
    static getTopicsPerWSKey(symbol, depth=50) {
        return [
            `orderbook.${depth}.${symbol}`,
            `kline.{interval}.${symbol}`,
            `publicTrade.${symbol}`,
            `tickers.${symbol}`
        ];
    }

    constructor(config = {}) {
    this.config = {
      key: config.key || null,
      secret: config.secret || null,
      testnet: config.testnet || false,
      demoTrading: config.demoTrading || false,
      throttleMs: config.throttleMs || 1000,  // Default throttle to 1 second
      // Add other config options as needed
      ...config
    };
    this.ws = new WebsocketClient(this.config);
    this.eventHandlers = {};
    this.lastUpdateTime = 0;
  }

  subscribeToTopics(topics, category) {
    if (Array.isArray(topics)) {
      this.ws.subscribeV5(topics, category);
    } else {
      this.ws.subscribeV5(topics, category);
    }
  }

  on(event, handler) {
    this.eventHandlers[event] = handler;
    this.ws.on(event, handler);
  }

  connect() {
    // The client connects automatically when subscribing, but this can be used to prepare
    // For now, just return the ws client
    return this.ws;
  }

  // Predefined methods for common events
  onUpdate(handler) {
    const throttledHandler = (data) => {
      const now = Date.now();
      if (now - this.lastUpdateTime >= this.config.throttleMs) {
        this.lastUpdateTime = now;
        handler(data);
      }
    };
    this.on('update', throttledHandler);
  }

  onOpen(handler) {
    this.on('open', handler);
  }

  onResponse(handler) {
    this.on('response', handler);
  }

  onClose(handler) {
    this.on('close', handler);
  }

  onException(handler) {
    this.on('exception', handler);
  }

  onReconnect(handler) {
    this.on('reconnect', handler);
  }

  onReconnected(handler) {
    this.on('reconnected', handler);
  }
}