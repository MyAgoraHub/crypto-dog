import { WebsocketClient } from 'bybit-api';
import { ref } from 'vue';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.subscriptions = new Map();
    this.isConnected = ref(false);
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
  }

  connect(config = {}) {
    if (this.ws) {
      console.log('WebSocket already connected');
      return;
    }

    try {
      this.ws = new WebsocketClient({
        market: 'v5',
        ...config,
      });

      this.ws.on('open', () => {
        console.log('✅ WebSocket connected');
        this.isConnected.value = true;
        this.reconnectAttempts = 0;
      });

      this.ws.on('update', (data) => {
        this.handleUpdate(data);
      });

      this.ws.on('response', (data) => {
        console.log('WebSocket response:', data);
      });

      this.ws.on('close', () => {
        console.log('WebSocket closed');
        this.isConnected.value = false;
        this.attemptReconnect();
      });

      this.ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });

      this.ws.on('reconnect', () => {
        console.log('WebSocket reconnecting...');
      });

      this.ws.on('reconnected', () => {
        console.log('✅ WebSocket reconnected');
        this.isConnected.value = true;
        this.resubscribeAll();
      });
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.attemptReconnect();
    }
  }

  subscribe(topic, category, callback) {
    if (!this.ws) {
      console.error('WebSocket not connected. Call connect() first.');
      return;
    }

    const key = `${category}:${topic}`;
    
    // Store callback
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, []);
    }
    this.subscriptions.get(key).push(callback);

    // Subscribe to topic
    try {
      this.ws.subscribeV5(topic, category);
      console.log(`📡 Subscribed to ${topic} (${category})`);
    } catch (error) {
      console.error(`Failed to subscribe to ${topic}:`, error);
    }
  }

  unsubscribe(topic, category, callback) {
    const key = `${category}:${topic}`;
    
    if (this.subscriptions.has(key)) {
      const callbacks = this.subscriptions.get(key);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }

      // If no more callbacks, unsubscribe from topic
      if (callbacks.length === 0) {
        this.subscriptions.delete(key);
        try {
          this.ws.unsubscribe(topic, category);
          console.log(`📡 Unsubscribed from ${topic} (${category})`);
        } catch (error) {
          console.error(`Failed to unsubscribe from ${topic}:`, error);
        }
      }
    }
  }

  handleUpdate(data) {
    // Route updates to appropriate subscribers
    if (data && data.topic) {
      const category = this.getCategoryFromTopic(data.topic);
      const key = `${category}:${data.topic}`;
      
      if (this.subscriptions.has(key)) {
        const callbacks = this.subscriptions.get(key);
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

  getCategoryFromTopic(topic) {
    // Extract category from topic if embedded, otherwise default to 'spot'
    if (topic.includes('linear')) return 'linear';
    if (topic.includes('inverse')) return 'inverse';
    if (topic.includes('option')) return 'option';
    return 'spot';
  }

  resubscribeAll() {
    console.log('Resubscribing to all topics...');
    for (const [key] of this.subscriptions) {
      const [category, topic] = key.split(':');
      try {
        this.ws.subscribeV5(topic, category);
      } catch (error) {
        console.error(`Failed to resubscribe to ${topic}:`, error);
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
      this.ws = null;
      this.connect();
    }, this.reconnectDelay);
  }

  disconnect() {
    if (this.ws) {
      this.ws.closeAll();
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
