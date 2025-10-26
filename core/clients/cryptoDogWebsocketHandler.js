import { WebsocketClient } from 'bybit-api';

export class CryptoDogWebSocketHandler {
  constructor(config = {}) {
    this.config = {
      key: config.key || null,
      secret: config.secret || null,
      testnet: config.testnet || false,
      demoTrading: config.demoTrading || false,
      // Disable WebSocket logging to prevent dashboard interference
      disableHeartbeatLogs: true,
      silent: true,
      // Custom logger that suppresses output
      logger: {
        info: () => {},
        warn: () => {},
        error: () => {},
        debug: () => {},
        silly: () => {}
      },
      ...config
    };
    this.ws = new WebsocketClient(this.config);
    this.eventHandlers = {};
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
    this.on('update', handler);
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