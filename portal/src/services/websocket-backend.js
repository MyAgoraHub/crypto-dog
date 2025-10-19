import { ref } from 'vue';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000/ws';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.subscriptions = new Map();
    this.isConnected = ref(false);
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.clientId = null;
  }

  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    try {
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected');
        this.isConnected.value = true;
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket closed');
        this.isConnected.value = false;
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.attemptReconnect();
    }
  }

  handleMessage(message) {
    switch (message.type) {
      case 'connected':
        console.log(`Connected with client ID: ${message.clientId}`);
        this.clientId = message.clientId;
        this.resubscribeAll();
        break;

      case 'update':
        this.handleUpdate(message.data);
        break;

      case 'subscribed':
        console.log(`📡 Subscribed to ${message.topics.join(', ')} (${message.category})`);
        break;

      case 'unsubscribed':
        console.log(`📡 Unsubscribed from ${message.topics.join(', ')}`);
        break;

      case 'error':
        console.error('WebSocket server error:', message.error);
        break;

      default:
        console.log('Unknown message type:', message);
    }
  }

  subscribe(topics, category, callback) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected. Call connect() first.');
      return;
    }

    // Ensure topics is an array
    const topicArray = Array.isArray(topics) ? topics : [topics];
    const key = `${category}:${topicArray.join(',')}`;

    // Store callback
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, []);
    }
    this.subscriptions.get(key).push(callback);

    // Send subscribe message to server
    this.ws.send(
      JSON.stringify({
        type: 'subscribe',
        topics: topicArray,
        category,
      })
    );
  }

  unsubscribe(topics, category, callback) {
    const topicArray = Array.isArray(topics) ? topics : [topics];
    const key = `${category}:${topicArray.join(',')}`;

    if (this.subscriptions.has(key)) {
      const callbacks = this.subscriptions.get(key);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }

      // If no more callbacks, unsubscribe from topic
      if (callbacks.length === 0) {
        this.subscriptions.delete(key);
        
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(
            JSON.stringify({
              type: 'unsubscribe',
              topics: topicArray,
              category,
            })
          );
        }
      }
    }
  }

  handleUpdate(data) {
    // Route updates to appropriate subscribers
    if (data && data.topic) {
      // Try to match subscriptions
      for (const [key, callbacks] of this.subscriptions.entries()) {
        const [category, topicsStr] = key.split(':');
        const topics = topicsStr.split(',');
        
        // Check if this update matches any subscribed topics
        if (topics.some(topic => data.topic.includes(topic) || topic.includes(data.topic))) {
          callbacks.forEach((callback) => {
            try {
              callback(data);
            } catch (error) {
              console.error('Error in subscription callback:', error);
            }
          });
        }
      }
    }
  }

  resubscribeAll() {
    console.log('Resubscribing to all topics...');
    for (const [key] of this.subscriptions) {
      const [category, topicsStr] = key.split(':');
      const topics = topicsStr.split(',');
      
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(
          JSON.stringify({
            type: 'subscribe',
            topics,
            category,
          })
        );
      }
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(
      `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
    );

    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.subscriptions.clear();
      this.isConnected.value = false;
      console.log('WebSocket disconnected');
    }
  }
}

// Create singleton instance
export const wsService = new WebSocketService();
export default wsService;
