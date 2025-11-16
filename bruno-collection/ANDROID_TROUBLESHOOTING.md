# 🔧 Android WebSocket Integration - Troubleshooting Guide

## 🚨 Common Connection Issues & Solutions

### Issue 1: Connection URL
**Problem**: Android app can't connect to `ws://localhost:3000/ws`

**Solution**: 
- If testing on device: Use your computer's IP address instead of `localhost`
- If using emulator: Use `10.0.2.2:3000/ws` for Android emulator
- If using real device: Use your computer's network IP (e.g., `192.168.1.100:3000/ws`)

```kotlin
// ❌ Wrong - won't work on real device
val wsUrl = "ws://localhost:3000/ws"

// ✅ Correct - for real device testing
val wsUrl = "ws://192.168.1.100:3000/ws"  // Replace with your IP

// ✅ Correct - for Android emulator
val wsUrl = "ws://10.0.2.2:3000/ws"
```

### Issue 2: Network Permissions
Add to `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<!-- Allow cleartext traffic for development -->
<application
    android:networkSecurityConfig="@xml/network_security_config"
    android:usesCleartextTraffic="true">
```

Create `res/xml/network_security_config.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
        <domain includeSubdomains="true">192.168.1.100</domain>
    </domain-config>
</network-security-config>
```

## 📱 Corrected Android Implementation

### Complete WebSocket Client
```kotlin
import okhttp3.*
import com.google.gson.Gson
import com.google.gson.JsonObject
import android.util.Log
import java.util.concurrent.TimeUnit

class CryptoDogWebSocket {
    private var webSocket: WebSocket? = null
    private val client = OkHttpClient.Builder()
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()
    
    private val gson = Gson()
    
    // Callbacks
    var onConnected: (() -> Unit)? = null
    var onPriceUpdate: ((Double) -> Unit)? = null
    var onIndicatorsUpdate: ((Map<String, Any>) -> Unit)? = null
    var onCurrentCandle: ((List<Any>) -> Unit)? = null
    var onError: ((String) -> Unit)? = null
    
    fun connect(serverIp: String = "192.168.1.100") {
        val url = "ws://$serverIp:3000/ws"
        Log.d("WebSocket", "Connecting to: $url")
        
        val request = Request.Builder()
            .url(url)
            .build()
            
        webSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                Log.d("WebSocket", "Connected successfully")
                onConnected?.invoke()
            }
            
            override fun onMessage(webSocket: WebSocket, text: String) {
                Log.d("WebSocket", "Received: ${text.take(100)}...")
                try {
                    val jsonObject = gson.fromJson(text, JsonObject::class.java)
                    val type = jsonObject.get("type")?.asString
                    
                    when (type) {
                        "connected" -> {
                            Log.d("WebSocket", "Server connection confirmed")
                        }
                        
                        "price_update" -> {
                            val price = jsonObject.get("price")?.asDouble
                            if (price != null) {
                                onPriceUpdate?.invoke(price)
                            }
                        }
                        
                        "indicators_initial", "indicators_update", "indicators_snapshot" -> {
                            val indicatorsJson = jsonObject.get("indicators")
                            if (indicatorsJson != null) {
                                val indicators = gson.fromJson(indicatorsJson, Map::class.java) as Map<String, Any>
                                onIndicatorsUpdate?.invoke(indicators)
                            }
                            
                            val candleJson = jsonObject.get("currentCandle")
                            if (candleJson != null) {
                                val candle = gson.fromJson(candleJson, List::class.java) as List<Any>
                                onCurrentCandle?.invoke(candle)
                            }
                        }
                        
                        "current_candle" -> {
                            val candleJson = jsonObject.get("candle")
                            if (candleJson != null) {
                                val candle = gson.fromJson(candleJson, List::class.java) as List<Any>
                                onCurrentCandle?.invoke(candle)
                            }
                        }
                        
                        "indicators_subscribed" -> {
                            Log.d("WebSocket", "Successfully subscribed to indicators")
                        }
                        
                        "error" -> {
                            val error = jsonObject.get("error")?.asString ?: "Unknown error"
                            Log.e("WebSocket", "Server error: $error")
                            onError?.invoke(error)
                        }
                    }
                } catch (e: Exception) {
                    Log.e("WebSocket", "Error parsing message: ${e.message}")
                    onError?.invoke("Error parsing message: ${e.message}")
                }
            }
            
            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                Log.e("WebSocket", "Connection failed: ${t.message}")
                onError?.invoke("Connection failed: ${t.message}")
            }
            
            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                Log.d("WebSocket", "Connection closed: $reason")
            }
        })
    }
    
    fun subscribeToIndicators(symbol: String = "BTCUSDT", interval: String = "15m") {
        val message = mapOf(
            "type" to "subscribe_indicators",
            "symbol" to symbol,
            "interval" to interval
        )
        val json = gson.toJson(message)
        Log.d("WebSocket", "Sending: $json")
        webSocket?.send(json)
    }
    
    fun getCurrentCandle(symbol: String = "BTCUSDT", interval: String = "15m") {
        val message = mapOf(
            "type" to "get_current_candle",
            "symbol" to symbol,
            "interval" to interval
        )
        webSocket?.send(gson.toJson(message))
    }
    
    fun getIndicatorsSnapshot(symbol: String = "BTCUSDT", interval: String = "15m") {
        val message = mapOf(
            "type" to "get_indicators",
            "symbol" to symbol,
            "interval" to interval
        )
        webSocket?.send(gson.toJson(message))
    }
    
    fun disconnect() {
        webSocket?.close(1000, "Client disconnect")
        webSocket = null
    }
}
```

### Usage in Activity/Fragment
```kotlin
class MainActivity : AppCompatActivity() {
    private lateinit var webSocket: CryptoDogWebSocket
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        setupWebSocket()
    }
    
    private fun setupWebSocket() {
        webSocket = CryptoDogWebSocket()
        
        webSocket.onConnected = {
            runOnUiThread {
                // Connection successful - subscribe to indicators
                webSocket.subscribeToIndicators("BTCUSDT", "15m")
            }
        }
        
        webSocket.onPriceUpdate = { price ->
            runOnUiThread {
                // Update price in UI
                findViewById<TextView>(R.id.priceText).text = "$${"%.2f".format(price)}"
            }
        }
        
        webSocket.onIndicatorsUpdate = { indicators ->
            runOnUiThread {
                updateIndicatorsUI(indicators)
            }
        }
        
        webSocket.onCurrentCandle = { candle ->
            runOnUiThread {
                updateCandleUI(candle)
            }
        }
        
        webSocket.onError = { error ->
            runOnUiThread {
                Log.e("MainActivity", "WebSocket error: $error")
                // Show error to user
            }
        }
        
        // Replace with your computer's IP address
        webSocket.connect("192.168.1.100")
    }
    
    private fun updateIndicatorsUI(indicators: Map<String, Any>) {
        // Example: Extract specific indicators
        val rsi = extractIndicatorValue(indicators, "RsiIndicator")
        val macd = extractNestedIndicatorValue(indicators, "MacdIndicator", "histogram")
        val superTrend = extractNestedIndicatorValue(indicators, "SuperTrendIndicator", "value")
        
        findViewById<TextView>(R.id.rsiText).text = "RSI: ${"%.2f".format(rsi ?: 0.0)}"
        findViewById<TextView>(R.id.macdText).text = "MACD: ${"%.2f".format(macd ?: 0.0)}"
        findViewById<TextView>(R.id.supertrendText).text = "SuperTrend: ${"%.2f".format(superTrend ?: 0.0)}"
    }
    
    private fun extractIndicatorValue(indicators: Map<String, Any>, key: String): Double? {
        return when (val value = indicators[key]) {
            is Double -> value
            is Number -> value.toDouble()
            else -> null
        }
    }
    
    private fun extractNestedIndicatorValue(indicators: Map<String, Any>, parentKey: String, childKey: String): Double? {
        val parent = indicators[parentKey] as? Map<String, Any> ?: return null
        return when (val value = parent[childKey]) {
            is Double -> value
            is Number -> value.toDouble()
            else -> null
        }
    }
    
    private fun updateCandleUI(candle: List<Any>) {
        // Candle format: [timestamp, open, high, low, close, volume]
        if (candle.size >= 6) {
            val open = (candle[1] as? Number)?.toDouble() ?: 0.0
            val high = (candle[2] as? Number)?.toDouble() ?: 0.0
            val low = (candle[3] as? Number)?.toDouble() ?: 0.0
            val close = (candle[4] as? Number)?.toDouble() ?: 0.0
            val volume = (candle[5] as? Number)?.toDouble() ?: 0.0
            
            findViewById<TextView>(R.id.candleText).text = 
                "OHLCV: ${"%.2f".format(open)} / ${"%.2f".format(high)} / ${"%.2f".format(low)} / ${"%.2f".format(close)} / ${"%.2f".format(volume)}"
        }
    }
    
    override fun onDestroy() {
        super.onDestroy()
        webSocket.disconnect()
    }
}
```

## 🛠️ Testing Steps

### 1. Find Your Computer's IP Address
```bash
# On Linux/Mac
ip addr show | grep inet
# or
ifconfig | grep inet

# On Windows
ipconfig | findstr IPv4
```

### 2. Test Connection from Android
```kotlin
// Test in your app
private fun testConnection() {
    val client = OkHttpClient()
    val request = Request.Builder()
        .url("http://192.168.1.100:3000/api/intervals") // Replace IP
        .build()
    
    client.newCall(request).execute().use { response ->
        if (response.isSuccessful) {
            Log.d("Test", "HTTP API reachable: ${response.body?.string()}")
        } else {
            Log.e("Test", "HTTP API not reachable")
        }
    }
}
```

### 3. Verify Server is Running
```bash
# Check if server is listening
netstat -an | grep 3000

# Test HTTP API
curl http://localhost:3000/api/intervals

# Test from another machine
curl http://192.168.1.100:3000/api/intervals
```

## 📊 Expected Data Structure

Based on your captured events, here's what your app will receive:

### Price Update Event
```json
{
  "type": "price_update",
  "symbol": "BTCUSDT",
  "interval": "15m",
  "price": 95684.8
}
```

### Indicators Update Event (Partial)
```json
{
  "type": "indicators_update",
  "symbol": "BTCUSDT", 
  "interval": "15m",
  "indicators": {
    "RsiIndicator": 52.38,
    "SuperTrendIndicator": {
      "trend": "short",
      "value": 96018.62239120001
    },
    "MacdIndicator": {
      "MACD": -614.9987179,
      "signal": -697.8150285,
      "histogram": 82.81631054
    },
    "BollingerIndicator": {
      "middle": 95274.76,
      "upper": 96315.38858,
      "lower": 94234.13142,
      "pb": 0.6964870117
    }
  },
  "currentCandle": [
    "1763158500000",
    "94741.7", 
    "95309.4",
    "94699.9",
    "95280.9",
    "71.689761"
  ]
}
```

## 🔧 Dependencies (build.gradle)

```gradle
dependencies {
    implementation 'com.squareup.okhttp3:okhttp:4.12.0'
    implementation 'com.google.code.gson:gson:2.10.1'
    
    // For coroutines if needed
    implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3'
}
```

## 🚀 Quick Test

Create this simple test to verify connection:

```kotlin
fun quickTest() {
    val webSocket = CryptoDogWebSocket()
    
    webSocket.onConnected = {
        Log.d("Test", "✅ Connected!")
        webSocket.subscribeToIndicators()
    }
    
    webSocket.onPriceUpdate = { price ->
        Log.d("Test", "💰 Price: $price")
    }
    
    webSocket.onIndicatorsUpdate = { indicators ->
        Log.d("Test", "📊 Got ${indicators.size} indicators")
    }
    
    webSocket.onError = { error ->
        Log.e("Test", "❌ Error: $error")
    }
    
    // Replace with your IP!
    webSocket.connect("192.168.1.100")
}
```

The main issue is likely the network configuration - make sure to use your computer's actual IP address instead of `localhost` when testing on a real Android device!
