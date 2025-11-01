import { CryptoDogWebSocketHandler } from "../core/clients/cryptoDogWebsocketHandler.js";

const interval = '15'; // 15 minutes
const symbol = 'BTCUSDT';
const wsHandler = new CryptoDogWebSocketHandler({
  testnet: false,  // or false for live
  throttleMs: 5000
});

wsHandler.subscribeToTopics([`orderbook.50.${symbol}`], 'spot');

wsHandler.onUpdate((data) => {
  console.log('Received data:', JSON.stringify(data, null, 2));
});

wsHandler.onException((err) => {
  console.error('WebSocket error:', err);
});

// The connection starts automatically when subscribing