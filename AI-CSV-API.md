# AI Context CSV Generation API

## Overview
The Crypto Dog server now includes endpoints for generating and downloading AI context CSV files containing historical market data with calculated technical indicators. These CSV files are formatted for AI model training and analysis.

## Endpoints

### 1. Generate AI Context CSV
**POST** `/api/ai/generate-csv`

Generate a new AI context CSV file with historical OHLCV data and all technical indicators.

#### Request Body
```json
{
  "symbol": "BTCUSDT",      // Trading pair (default: BTCUSDT)
  "timeframe": "15m",       // Candle timeframe (default: 15m)
  "iterations": 200,        // Number of data fetches (default: 200)
  "candles": 500           // Candles per fetch (default: 500)
}
```

#### Response
```json
{
  "success": true,
  "symbol": "BTCUSDT",
  "timeframe": "15m",
  "iterations": 200,
  "candles": 500,
  "filePath": "/home/user/crypto-dog/cryptoDogAiContext_BTCUSDT_15m.csv",
  "fileName": "cryptoDogAiContext_BTCUSDT_15m.csv",
  "fileSize": 3827595,
  "fileSizeReadable": "3.65 MB",
  "downloadUrl": "/api/ai/csv/BTCUSDT/15m",
  "timestamp": "2025-11-21T08:31:58.512Z"
}
```

#### Example
```bash
curl -X POST http://localhost:3000/api/ai/generate-csv \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTCUSDT",
    "timeframe": "15m",
    "iterations": 100,
    "candles": 300
  }'
```

---

### 2. Download/Stream CSV File
**GET** `/api/ai/csv/:symbol/:timeframe`

Stream and download a previously generated AI context CSV file.

#### Parameters
- `symbol` - Trading pair (e.g., BTCUSDT)
- `timeframe` - Candle timeframe (e.g., 15m, 1h, 4h)

#### Response
- **200 OK**: Returns CSV file as a downloadable stream
- **404 Not Found**: CSV file doesn't exist (needs to be generated first)

#### Response Headers
```
Content-Type: text/csv
Content-Disposition: attachment; filename="cryptoDogAiContext_BTCUSDT_15m.csv"
Content-Length: 3827595
```

#### Example
```bash
# Download CSV file
curl -O http://localhost:3000/api/ai/csv/BTCUSDT/15m

# Stream and view first 10 lines
curl -s http://localhost:3000/api/ai/csv/BTCUSDT/15m | head -10
```

---

### 3. List Available CSV Files
**GET** `/api/ai/csv-files`

List all available AI context CSV files in the workspace.

#### Response
```json
{
  "count": 3,
  "files": [
    {
      "fileName": "cryptoDogAiContext_BTCUSDT_15m.csv",
      "symbol": "BTCUSDT",
      "timeframe": "15m",
      "downloadUrl": "/api/ai/csv/BTCUSDT/15m",
      "fileSize": 3827595,
      "fileSizeReadable": "3.65 MB",
      "lastModified": "2025-11-21T08:31:58.506Z"
    },
    {
      "fileName": "cryptoDogAiContext_BTCUSDT_1h.csv",
      "symbol": "BTCUSDT",
      "timeframe": "1h",
      "downloadUrl": "/api/ai/csv/BTCUSDT/1h",
      "fileSize": 3442395,
      "fileSizeReadable": "3.28 MB",
      "lastModified": "2025-11-07T17:39:46.268Z"
    }
  ]
}
```

#### Example
```bash
curl http://localhost:3000/api/ai/csv-files | jq .
```

---

## CSV File Format

### Filename Convention
```
cryptoDogAiContext_{SYMBOL}_{TIMEFRAME}.csv
```
Examples:
- `cryptoDogAiContext_BTCUSDT_15m.csv`
- `cryptoDogAiContext_ETHUSDT_1h.csv`
- `cryptoDogAiContext_SOLUSDT_4h.csv`

### CSV Structure
The CSV contains historical OHLCV data plus 50+ calculated technical indicators:

#### Base Columns
- `Timestamp` - Unix timestamp (milliseconds)
- `Open` - Opening price
- `High` - Highest price
- `Low` - Lowest price
- `Close` - Closing price
- `Volume` - Trading volume
- `Turnover` - Total turnover value

#### Indicator Columns (50+ indicators)
- **Trend Indicators**: SuperTrend, EMA (multiple periods), SMA, TEMA, VWMA
- **Momentum**: RSI, Stochastic, Williams %R, CCI, ROC, Force Index, Awesome Oscillator
- **Volatility**: ATR, Bollinger Bands, Keltner Channels
- **Volume**: OBV, MFI, Volume Profile
- **Oscillators**: MACD, Trix, KST
- **Cloud**: Ichimoku Cloud (conversion, base, spanA, spanB)
- **Other**: ADX, PSAR, ADL, Z-Score, ZEMA

### Sample Data
```csv
Timestamp,Open,High,Low,Close,Volume,Turnover,SuperTrendIndicator_trend,SuperTrendIndicator_value,RsiIndicator,AtrIndicator,...
1759393800000,118620.4,118660.6,118560.6,118614.7,54.753423,6494173.8807023,long,118064.3761732,53.67,228.488004,...
1759394700000,118614.7,118672.5,118600.3,118666.9,40.725355,4831585.034764,long,118084.04326399999,55.27,221.0457181,...
```

---

## Use Cases

### 1. AI Model Training
Generate comprehensive datasets for training machine learning models:
```bash
# Generate training data for multiple timeframes
curl -X POST http://localhost:3000/api/ai/generate-csv \
  -H "Content-Type: application/json" \
  -d '{"symbol":"BTCUSDT","timeframe":"15m","iterations":500,"candles":1000}'

curl -X POST http://localhost:3000/api/ai/generate-csv \
  -H "Content-Type: application/json" \
  -d '{"symbol":"BTCUSDT","timeframe":"1h","iterations":500,"candles":1000}'
```

### 2. Backtesting Analysis
Download historical data with indicators for strategy backtesting:
```bash
curl -O http://localhost:3000/api/ai/csv/BTCUSDT/15m
```

### 3. Data Pipeline Integration
Integrate CSV generation into automated workflows:
```javascript
// Node.js example
const response = await fetch('http://localhost:3000/api/ai/generate-csv', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    symbol: 'BTCUSDT',
    timeframe: '15m',
    iterations: 200,
    candles: 500
  })
});

const result = await response.json();
console.log(`CSV generated: ${result.fileName} (${result.fileSizeReadable})`);

// Download the file
const csvResponse = await fetch(`http://localhost:3000${result.downloadUrl}`);
const csvData = await csvResponse.text();
```

### 4. Python Data Analysis
```python
import requests
import pandas as pd
from io import StringIO

# Generate CSV
response = requests.post('http://localhost:3000/api/ai/generate-csv', json={
    'symbol': 'BTCUSDT',
    'timeframe': '15m',
    'iterations': 200,
    'candles': 500
})
result = response.json()

# Download and load into pandas
csv_url = f"http://localhost:3000{result['downloadUrl']}"
df = pd.read_csv(csv_url)

print(df.head())
print(f"Dataset shape: {df.shape}")
```

---

## Performance Notes

### File Sizes
Typical CSV file sizes:
- **Small dataset** (50 iterations, 100 candles): ~1-2 MB
- **Medium dataset** (200 iterations, 500 candles): ~3-5 MB
- **Large dataset** (500 iterations, 1000 candles): ~8-15 MB

### Generation Time
- Small: ~5-10 seconds
- Medium: ~15-30 seconds
- Large: ~30-60 seconds

### Streaming
All CSV downloads use streaming to efficiently handle large files without loading them entirely into memory.

---

## Error Handling

### 404 - CSV Not Found
```json
{
  "error": "CSV file not found",
  "symbol": "BTCUSDT",
  "timeframe": "15m",
  "expectedPath": "/home/user/crypto-dog/cryptoDogAiContext_BTCUSDT_15m.csv",
  "hint": "Generate the CSV first using POST /api/ai/generate-csv"
}
```

**Solution**: Generate the CSV file first using the POST endpoint.

### 500 - Generation Failed
```json
{
  "error": "Failed to load candle data",
  "stack": "Error: API request failed..."
}
```

**Common causes**:
- Network connectivity issues
- Exchange API rate limits
- Invalid symbol or timeframe
- Insufficient historical data available

---

## Integration with Existing Features

### Works With
- ✅ Signal detection system
- ✅ Backtesting API
- ✅ WebSocket real-time indicators
- ✅ CLI commands (`crypto-dog ai-predict`, `crypto-dog ai-status`)

### Storage Location
CSV files are stored in the project root directory:
```
/home/user/crypto-dog/
  cryptoDogAiContext_BTCUSDT_15m.csv
  cryptoDogAiContext_BTCUSDT_1h.csv
  cryptoDogAiContext_ETHUSDT_15m.csv
```

---

## Best Practices

1. **Start Small**: Begin with smaller datasets (100 iterations, 200 candles) to test functionality
2. **Incremental Generation**: Generate CSVs for different timeframes separately
3. **Cache Results**: Reuse generated CSV files instead of regenerating frequently
4. **Monitor Size**: Large datasets can create 10+ MB files
5. **Use Streaming**: Always use the streaming endpoint for downloading to handle large files efficiently

---

## React Native/Expo Integration Guide

### Overview
This API is optimized for React Native/Expo applications that need historical market data with technical indicators for trading analysis, backtesting, or ML model inference on mobile devices.

### Architecture Recommendations

#### 1. Project Setup
Create a new Expo project and install required dependencies:

```bash
npx create-expo-app CryptoDogApp
cd CryptoDogApp

# Install dependencies
npm install axios expo-file-system expo-document-picker expo-sharing
npm install react-native-fs react-native-csv react-native-progress
```

#### 2. API Service Layer

```typescript
// services/cryptoDogApi.ts
import axios, { AxiosResponse } from 'axios';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const API_BASE_URL = 'http://your-server-ip:3000'; // Replace with your server URL

export interface GenerateCsvRequest {
  symbol?: string;
  timeframe?: string;
  iterations?: number;
  candles?: number;
}

export interface GenerateCsvResponse {
  success: boolean;
  symbol: string;
  timeframe: string;
  iterations: number;
  candles: number;
  filePath: string;
  fileName: string;
  fileSize: number;
  fileSizeReadable: string;
  downloadUrl: string;
  timestamp: string;
}

export interface CsvFileInfo {
  fileName: string;
  symbol: string;
  timeframe: string;
  downloadUrl: string;
  fileSize: number;
  fileSizeReadable: string;
  lastModified: string;
}

export interface CsvFilesResponse {
  count: number;
  files: CsvFileInfo[];
}

export interface DeleteCsvResponse {
  success: boolean;
  deleted: boolean;
  symbol: string;
  timeframe: string;
  fileName: string;
  fileSize: number;
  fileSizeReadable: string;
  timestamp: string;
}

export interface DeleteAllCsvResponse {
  success: boolean;
  deleted: number;
  failed: number;
  files: Array<{
    fileName: string;
    fileSize: number;
    fileSizeReadable: string;
  }>;
  timestamp: string;
}

class CryptoDogApiService {
  private api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000, // 30 seconds for large file operations
  });

  // Generate CSV file
  async generateCsv(request: GenerateCsvRequest): Promise<GenerateCsvResponse> {
    const response = await this.api.post<GenerateCsvResponse>('/api/ai/generate-csv', request);
    return response.data;
  }

  // Download CSV file with progress tracking
  async downloadCsv(
    symbol: string,
    timeframe: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    const url = `${API_BASE_URL}/api/ai/csv/${symbol}/${timeframe}`;
    const fileName = `cryptoDogAiContext_${symbol}_${timeframe}.csv`;
    const fileUri = FileSystem.documentDirectory + fileName;

    const downloadResumable = FileSystem.createDownloadResumable(
      url,
      fileUri,
      {},
      (downloadProgress) => {
        const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        onProgress?.(progress * 100);
      }
    );

    const result = await downloadResumable.downloadAsync();
    if (!result) {
      throw new Error('Download failed');
    }

    return result.uri;
  }

  // List available CSV files
  async listCsvFiles(): Promise<CsvFilesResponse> {
    const response = await this.api.get<CsvFilesResponse>('/api/ai/csv-files');
    return response.data;
  }

  // Delete single CSV file
  async deleteCsv(symbol: string, timeframe: string): Promise<DeleteCsvResponse> {
    const response = await this.api.delete<DeleteCsvResponse>(`/api/ai/csv/${symbol}/${timeframe}`);
    return response.data;
  }

  // Delete all CSV files
  async deleteAllCsv(): Promise<DeleteAllCsvResponse> {
    const response = await this.api.delete<DeleteAllCsvResponse>('/api/ai/csv-files');
    return response.data;
  }

  // Combined generate and download operation
  async generateAndDownloadCsv(
    request: GenerateCsvRequest,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    // Step 1: Generate CSV (10% progress)
    onProgress?.(10);
    const generateResponse = await this.generateCsv(request);

    if (!generateResponse.success) {
      throw new Error('CSV generation failed');
    }

    // Step 2: Download CSV (30-100% progress)
    onProgress?.(30);
    const fileUri = await this.downloadCsv(
      generateResponse.symbol,
      generateResponse.timeframe,
      (downloadProgress) => {
        // Map download progress from 30% to 100%
        const mappedProgress = 30 + (downloadProgress * 0.7);
        onProgress?.(mappedProgress);
      }
    );

    onProgress?.(100);
    return fileUri;
  }
}

export const cryptoDogApi = new CryptoDogApiService();
```

#### 3. CSV Parser for React Native

```typescript
// utils/csvParser.ts
import * as FileSystem from 'expo-file-system';

export interface MarketDataRow {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  turnover: number;
  indicators: Record<string, number>;
}

export class CsvParser {
  // Parse CSV file content
  static async parseMarketData(fileUri: string): Promise<MarketDataRow[]> {
    const csvContent = await FileSystem.readAsStringAsync(fileUri);
    const lines = csvContent.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      return [];
    }

    const headers = lines[0].split(',');
    const data: MarketDataRow[] = [];

    // Find indicator column indices (everything after column 6)
    const indicatorColumns: Record<string, number> = {};
    headers.slice(7).forEach((header, index) => {
      indicatorColumns[header] = index + 7;
    });

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');

      if (values.length < 7) continue;

      try {
        const indicators: Record<string, number> = {};

        // Parse indicator values
        Object.entries(indicatorColumns).forEach(([name, index]) => {
          const value = parseFloat(values[index]);
          if (!isNaN(value)) {
            indicators[name] = value;
          }
        });

        data.push({
          timestamp: parseInt(values[0]),
          open: parseFloat(values[1]),
          high: parseFloat(values[2]),
          low: parseFloat(values[3]),
          close: parseFloat(values[4]),
          volume: parseFloat(values[5]),
          turnover: parseFloat(values[6]),
          indicators,
        });
      } catch (error) {
        // Skip malformed rows
        console.warn(`Skipping malformed row ${i}:`, error);
      }
    }

    return data;
  }

  // Memory-efficient streaming parser for large CSV files
  static async parseMarketDataStreaming(
    fileUri: string,
    onBatch: (batch: MarketDataRow[]) => void,
    batchSize: number = 100
  ): Promise<void> {
    const csvContent = await FileSystem.readAsStringAsync(fileUri);
    const lines = csvContent.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      return;
    }

    const headers = lines[0].split(',');

    // Find indicator column indices
    const indicatorColumns: Record<string, number> = {};
    headers.slice(7).forEach((header, index) => {
      indicatorColumns[header] = index + 7;
    });

    const batch: MarketDataRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');

      if (values.length < 7) continue;

      try {
        const indicators: Record<string, number> = {};

        Object.entries(indicatorColumns).forEach(([name, index]) => {
          const value = parseFloat(values[index]);
          if (!isNaN(value)) {
            indicators[name] = value;
          }
        });

        batch.push({
          timestamp: parseInt(values[0]),
          open: parseFloat(values[1]),
          high: parseFloat(values[2]),
          low: parseFloat(values[3]),
          close: parseFloat(values[4]),
          volume: parseFloat(values[5]),
          turnover: parseFloat(values[6]),
          indicators,
        });

        if (batch.length >= batchSize) {
          onBatch([...batch]);
          batch.length = 0; // Clear array
        }
      } catch (error) {
        console.warn(`Skipping malformed row ${i}:`, error);
      }
    }

    // Process remaining items
    if (batch.length > 0) {
      onBatch(batch);
    }
  }
}
```

#### 4. Custom Hooks for Data Management

```typescript
// hooks/useMarketData.ts
import { useState, useCallback } from 'react';
import { cryptoDogApi, GenerateCsvRequest } from '../services/cryptoDogApi';
import { CsvParser, MarketDataRow } from '../utils/csvParser';
import * as FileSystem from 'expo-file-system';

interface UseMarketDataState {
  data: MarketDataRow[];
  loading: boolean;
  progress: number;
  error: string | null;
}

export const useMarketData = () => {
  const [state, setState] = useState<UseMarketDataState>({
    data: [],
    loading: false,
    progress: 0,
    error: null,
  });

  const loadMarketData = useCallback(async (
    request: GenerateCsvRequest,
    onProgress?: (progress: number) => void
  ) => {
    setState(prev => ({ ...prev, loading: true, error: null, progress: 0 }));

    try {
      // Generate and download CSV
      const fileUri = await cryptoDogApi.generateAndDownloadCsv(
        request,
        (progress) => {
          setState(prev => ({ ...prev, progress }));
          onProgress?.(progress);
        }
      );

      // Parse CSV file
      setState(prev => ({ ...prev, progress: 100 }));
      const marketData = await CsvParser.parseMarketData(fileUri);

      setState(prev => ({
        ...prev,
        data: marketData,
        loading: false,
        progress: 100,
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, []);

  const loadMarketDataStreaming = useCallback(async (
    request: GenerateCsvRequest,
    onBatch: (batch: MarketDataRow[]) => void,
    onProgress?: (progress: number) => void
  ) => {
    setState(prev => ({ ...prev, loading: true, error: null, progress: 0, data: [] }));

    try {
      const fileUri = await cryptoDogApi.generateAndDownloadCsv(
        request,
        (progress) => {
          setState(prev => ({ ...prev, progress }));
          onProgress?.(progress);
        }
      );

      // Parse in streaming mode
      await CsvParser.parseMarketDataStreaming(
        fileUri,
        (batch) => {
          setState(prev => ({
            ...prev,
            data: [...prev.data, ...batch],
          }));
          onBatch(batch);
        }
      );

      setState(prev => ({ ...prev, loading: false, progress: 100 }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, []);

  const clearData = useCallback(() => {
    setState({
      data: [],
      loading: false,
      progress: 0,
      error: null,
    });
  }, []);

  return {
    ...state,
    loadMarketData,
    loadMarketDataStreaming,
    clearData,
  };
};
```

#### 5. File Caching Hook

```typescript
// hooks/useCsvCache.ts
import { useState, useEffect, useCallback } from 'react';
import * as FileSystem from 'expo-file-system';
import { CsvFileInfo } from '../services/cryptoDogApi';

interface CachedFile {
  uri: string;
  info: CsvFileInfo;
  lastModified: number;
}

export const useCsvCache = () => {
  const [cachedFiles, setCachedFiles] = useState<CachedFile[]>([]);

  // Load cached files on mount
  useEffect(() => {
    loadCachedFiles();
  }, []);

  const loadCachedFiles = useCallback(async () => {
    try {
      const files = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory!);
      const csvFiles = files.filter(file => file.startsWith('cryptoDogAiContext_') && file.endsWith('.csv'));

      const cached: CachedFile[] = [];

      for (const fileName of csvFiles) {
        const fileUri = FileSystem.documentDirectory + fileName;
        const fileInfo = await FileSystem.getInfoAsync(fileUri);

        if (fileInfo.exists) {
          // Extract symbol and timeframe from filename
          const match = fileName.match(/cryptoDogAiContext_([A-Z]+)_(\d+[mhd])\.csv/);
          if (match) {
            const [, symbol, timeframe] = match;

            cached.push({
              uri: fileUri,
              info: {
                fileName,
                symbol,
                timeframe,
                downloadUrl: `/api/ai/csv/${symbol}/${timeframe}`,
                fileSize: fileInfo.size || 0,
                fileSizeReadable: `${((fileInfo.size || 0) / 1024 / 1024).toFixed(2)} MB`,
                lastModified: fileInfo.modificationTime || Date.now(),
              },
              lastModified: fileInfo.modificationTime || Date.now(),
            });
          }
        }
      }

      setCachedFiles(cached);
    } catch (error) {
      console.error('Error loading cached files:', error);
    }
  }, []);

  const getCachedFile = useCallback((symbol: string, timeframe: string): CachedFile | null => {
    return cachedFiles.find(file =>
      file.info.symbol === symbol && file.info.timeframe === timeframe
    ) || null;
  }, [cachedFiles]);

  const isCacheFresh = useCallback((cachedFile: CachedFile, maxAgeHours: number = 24): boolean => {
    const ageHours = (Date.now() - cachedFile.lastModified) / (1000 * 60 * 60);
    return ageHours < maxAgeHours;
  }, []);

  const deleteCachedFile = useCallback(async (symbol: string, timeframe: string): Promise<boolean> => {
    try {
      const cachedFile = getCachedFile(symbol, timeframe);
      if (cachedFile) {
        await FileSystem.deleteAsync(cachedFile.uri);
        setCachedFiles(prev => prev.filter(file =>
          !(file.info.symbol === symbol && file.info.timeframe === timeframe)
        ));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting cached file:', error);
      return false;
    }
  }, [getCachedFile]);

  const cleanupOldFiles = useCallback(async (maxAgeHours: number = 168): Promise<number> => {
    let deletedCount = 0;

    for (const cachedFile of cachedFiles) {
      if (!isCacheFresh(cachedFile, maxAgeHours)) {
        const deleted = await deleteCachedFile(cachedFile.info.symbol, cachedFile.info.timeframe);
        if (deleted) {
          deletedCount++;
        }
      }
    }

    return deletedCount;
  }, [cachedFiles, isCacheFresh, deleteCachedFile]);

  return {
    cachedFiles,
    getCachedFile,
    isCacheFresh,
    deleteCachedFile,
    cleanupOldFiles,
    refreshCache: loadCachedFiles,
  };
};
```

#### 6. React Native UI Components

```typescript
// components/MarketDataScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
} from 'react-native';
import { useMarketData } from '../hooks/useMarketData';
import { useCsvCache } from '../hooks/useCsvCache';
import { MarketDataRow } from '../utils/csvParser';
import * as Sharing from 'expo-sharing';

const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d'];

export const MarketDataScreen: React.FC = () => {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [timeframe, setTimeframe] = useState('15m');
  const [iterations, setIterations] = useState('200');
  const [candles, setCandles] = useState('500');

  const { data, loading, progress, error, loadMarketData, loadMarketDataStreaming, clearData } = useMarketData();
  const { getCachedFile, isCacheFresh } = useCsvCache();

  const handleLoadData = async () => {
    const cachedFile = getCachedFile(symbol, timeframe);

    if (cachedFile && isCacheFresh(cachedFile, 24)) {
      // Use cached data
      Alert.alert(
        'Cached Data Available',
        'Use cached data or download fresh?',
        [
          { text: 'Use Cache', onPress: () => loadFromCache(cachedFile) },
          { text: 'Download Fresh', onPress: () => downloadFresh() },
        ]
      );
    } else {
      downloadFresh();
    }
  };

  const loadFromCache = async (cachedFile: any) => {
    // Load from cached file
    // Implementation would parse the cached file directly
    Alert.alert('Info', 'Loading from cache not implemented in this example');
  };

  const downloadFresh = async () => {
    try {
      await loadMarketData({
        symbol,
        timeframe,
        iterations: parseInt(iterations),
        candles: parseInt(candles),
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to load market data');
    }
  };

  const handleStreamingLoad = async () => {
    let totalRows = 0;

    await loadMarketDataStreaming(
      {
        symbol,
        timeframe,
        iterations: parseInt(iterations),
        candles: parseInt(candles),
      },
      (batch) => {
        totalRows += batch.length;
        console.log(`Processed batch of ${batch.length} rows. Total: ${totalRows}`);
      }
    );
  };

  const shareCsv = async () => {
    if (data.length === 0) return;

    try {
      // Create a temporary CSV file for sharing
      const csvContent = createCsvFromData(data);
      const fileUri = FileSystem.documentDirectory + `market_data_${symbol}_${timeframe}.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csvContent);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share CSV');
    }
  };

  const renderDataRow = ({ item }: { item: MarketDataRow }) => (
    <View style={styles.dataRow}>
      <Text style={styles.timestamp}>
        {new Date(item.timestamp).toLocaleString()}
      </Text>
      <View style={styles.priceRow}>
        <Text>O: {item.open.toFixed(2)}</Text>
        <Text>H: {item.high.toFixed(2)}</Text>
        <Text>L: {item.low.toFixed(2)}</Text>
        <Text>C: {item.close.toFixed(2)}</Text>
      </View>
      <Text style={styles.indicators}>
        RSI: {item.indicators.RsiIndicator?.toFixed(2) || 'N/A'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Input Controls */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Symbol (e.g., BTCUSDT)"
          value={symbol}
          onChangeText={setSymbol}
        />

        <View style={styles.timeframeContainer}>
          {TIMEFRAMES.map((tf) => (
            <TouchableOpacity
              key={tf}
              style={[
                styles.timeframeButton,
                timeframe === tf && styles.timeframeButtonActive,
              ]}
              onPress={() => setTimeframe(tf)}
            >
              <Text style={[
                styles.timeframeButtonText,
                timeframe === tf && styles.timeframeButtonTextActive,
              ]}>
                {tf}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.numberInputs}>
          <TextInput
            style={[styles.input, styles.numberInput]}
            placeholder="Iterations"
            value={iterations}
            onChangeText={setIterations}
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.input, styles.numberInput]}
            placeholder="Candles"
            value={candles}
            onChangeText={setCandles}
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLoadData}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Loading...' : 'Load Market Data'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleStreamingLoad}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Load Streaming</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={shareCsv}
          disabled={data.length === 0}
        >
          <Text style={styles.buttonText}>Share CSV</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={clearData}
        >
          <Text style={styles.buttonText}>Clear Data</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Indicator */}
      {loading && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {progress < 30 ? 'Generating CSV...' : 'Downloading...'}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${progress}%` }]}
            />
          </View>
          <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
        </View>
      )}

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      )}

      {/* Data Display */}
      {data.length > 0 && (
        <View style={styles.dataContainer}>
          <Text style={styles.dataHeader}>
            Loaded {data.length} data points
          </Text>
          <FlatList
            data={data.slice(0, 50)} // Show first 50 rows
            keyExtractor={(item) => item.timestamp.toString()}
            renderItem={renderDataRow}
            showsVerticalScrollIndicator={false}
          />
          {data.length > 50 && (
            <Text style={styles.moreDataText}>
              ... and {data.length - 50} more rows
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  inputContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    marginBottom: 8,
    fontSize: 16,
  },
  timeframeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  timeframeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginRight: 8,
    marginBottom: 4,
  },
  timeframeButtonActive: {
    backgroundColor: '#007AFF',
  },
  timeframeButtonText: {
    color: '#007AFF',
    fontSize: 14,
  },
  timeframeButtonTextActive: {
    color: 'white',
  },
  numberInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  numberInput: {
    flex: 1,
    marginRight: 8,
  },
  buttonContainer: {
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  secondaryButton: {
    backgroundColor: '#5AC8FA',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 16,
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  progressPercent: {
    fontSize: 14,
    marginTop: 4,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#FFECEC',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
  },
  dataContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
  },
  dataHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  dataRow: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  indicators: {
    fontSize: 12,
    color: '#007AFF',
  },
  moreDataText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 12,
  },
});
```

#### 7. Performance Optimization Tips

##### Background Processing
Always perform file operations on background threads:

```typescript
import { useEffect, useState } from 'react';

const useBackgroundOperation = (operation: () => Promise<void>) => {
  const [loading, setLoading] = useState(false);

  const execute = async () => {
    setLoading(true);
    try {
      await operation();
    } finally {
      setLoading(false);
    }
  };

  return { execute, loading };
};
```

##### Chunked Processing
For large files (10+ MB), process in chunks to avoid memory issues:

```typescript
const processLargeCsv = async (fileUri: string) => {
  const BATCH_SIZE = 500;
  let allData: MarketDataRow[] = [];

  await CsvParser.parseMarketDataStreaming(
    fileUri,
    (batch) => {
      allData = [...allData, ...batch];
      // Update UI incrementally
      setData(allData);
    },
    BATCH_SIZE
  );
};
```

##### File Caching Strategy
Cache downloaded CSV files and check timestamps:

```typescript
const CACHE_DURATION_HOURS = 24;

const getCachedOrDownload = async (
  symbol: string,
  timeframe: string
): Promise<string> => {
  const cachedFile = getCachedFile(symbol, timeframe);

  if (cachedFile && isCacheFresh(cachedFile, CACHE_DURATION_HOURS)) {
    return cachedFile.uri;
  }

  // Download fresh data
  return await cryptoDogApi.downloadCsv(symbol, timeframe);
};
```

##### Background Downloads
Use Expo's background task capabilities:

```typescript
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';

const BACKGROUND_DOWNLOAD_TASK = 'background-csv-download';

TaskManager.defineTask(BACKGROUND_DOWNLOAD_TASK, async ({ data }) => {
  const { symbol, timeframe } = data as { symbol: string; timeframe: string };

  try {
    await cryptoDogApi.generateAndDownloadCsv({
      symbol,
      timeframe,
      iterations: 200,
      candles: 500,
    });

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

const scheduleBackgroundDownload = async (symbol: string, timeframe: string) => {
  await BackgroundFetch.registerTaskAsync(BACKGROUND_DOWNLOAD_TASK, {
    minimumInterval: 60 * 60, // 1 hour
    stopOnTerminate: false,
    startOnBoot: true,
  });

  await TaskManager.setTaskManagerTaskAsync(BACKGROUND_DOWNLOAD_TASK, {
    symbol,
    timeframe,
  });
};
```

##### Storage Cleanup
Clean up old CSV files periodically:

```typescript
const cleanupOldCsvFiles = async (maxAgeHours: number = 168): Promise<number> => {
  const { cachedFiles, deleteCachedFile } = useCsvCache();
  let deletedCount = 0;

  for (const cachedFile of cachedFiles) {
    const ageHours = (Date.now() - cachedFile.lastModified) / (1000 * 60 * 60);
    if (ageHours > maxAgeHours) {
      const deleted = await deleteCachedFile(cachedFile.info.symbol, cachedFile.info.timeframe);
      if (deleted) {
        deletedCount++;
      }
    }
  }

  return deletedCount;
};
```

### Best Practices for React Native/Expo

1. **Start small**: Begin with smaller datasets (50-100 iterations) for quick loading
2. **Use streaming parsing**: For files > 5MB to avoid memory issues
3. **Cache files locally**: Use Expo FileSystem for persistent storage
4. **Show progress indicators**: Keep users informed during long operations
5. **Handle network errors**: Implement retry mechanisms with exponential backoff
6. **Delete old files**: Clean up storage to prevent app size bloat
7. **Use background tasks**: For large downloads when app is not active
8. **Parse on background threads**: Use proper async/await patterns
9. **Update UI incrementally**: When processing large datasets
10. **Compress data**: Consider compressing parsed data for storage

### Example: Complete Flow

```typescript
// 1. Check if cached data exists
const cachedFile = getCachedFile(symbol, timeframe);

if (cachedFile && isCacheFresh(cachedFile, 24)) {
  // Use cached data
  const marketData = await CsvParser.parseMarketData(cachedFile.uri);
  setData(marketData);
} else {
  // 2. Generate new CSV on server
  setLoading(true);
  setProgress(10);

  try {
    const generateResponse = await cryptoDogApi.generateCsv({
      symbol,
      timeframe,
      iterations: 200,
      candles: 500,
    });

    // 3. Download CSV file with progress
    setProgress(30);
    const fileUri = await cryptoDogApi.downloadCsv(
      symbol,
      timeframe,
      (downloadProgress) => {
        setProgress(30 + downloadProgress * 0.7);
      }
    );

    // 4. Parse CSV in background
    setProgress(100);
    const marketData = await CsvParser.parseMarketData(fileUri);
    setData(marketData);

  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
}
```

---

## API Endpoints Summary

### DELETE Endpoints (New)

#### 4. Delete Single CSV File
**DELETE** `/api/ai/csv/:symbol/:timeframe`

Delete a specific AI context CSV file from the server.

##### Parameters
- `symbol` - Trading pair (e.g., BTCUSDT)
- `timeframe` - Candle timeframe (e.g., 15m, 1h, 4h)

##### Response - Success
```json
{
  "success": true,
  "deleted": true,
  "symbol": "BTCUSDT",
  "timeframe": "15m",
  "fileName": "cryptoDogAiContext_BTCUSDT_15m.csv",
  "fileSize": 3827595,
  "fileSizeReadable": "3.65 MB",
  "timestamp": "2025-11-21T08:36:46.509Z"
}
```

##### Response - Not Found (404)
```json
{
  "error": "CSV file not found",
  "symbol": "BTCUSDT",
  "timeframe": "15m",
  "fileName": "cryptoDogAiContext_BTCUSDT_15m.csv",
  "hint": "File does not exist or was already deleted"
}
```

##### Example
```bash
curl -X DELETE http://localhost:3000/api/ai/csv/BTCUSDT/15m
```

---

#### 5. Delete All CSV Files
**DELETE** `/api/ai/csv-files`

Delete all AI context CSV files from the server (bulk delete).

##### Response - Success
```json
{
  "success": true,
  "deleted": 2,
  "failed": 0,
  "files": [
    {
      "fileName": "cryptoDogAiContext_BTCUSDT_15m.csv",
      "fileSize": 3827595,
      "fileSizeReadable": "3.65 MB"
    },
    {
      "fileName": "cryptoDogAiContext_ETHUSDT_1h.csv",
      "fileSize": 3442395,
      "fileSizeReadable": "3.28 MB"
    }
  ],
  "timestamp": "2025-11-21T08:37:44.610Z"
}
```

##### Response - No Files
```json
{
  "success": true,
  "deleted": 0,
  "message": "No CSV files found to delete"
}
```

##### Example
```bash
curl -X DELETE http://localhost:3000/api/ai/csv-files
```

---

## Technical Implementation

### Dependencies
- `core/cryptoDogAiContext.js` - CSV generation logic
- `core/cryptoDogTools.js` - Indicator calculations
- `core/indicator/Indicators.js` - Indicator implementations
- `core/clients/cryptoDogAgent.js` - Data loading from exchange

### Key Functions
```javascript
// Generate AI context CSV
const signal = { symbol, timeframe };
const aiContext = createAiContext(signal, iterations, candles);
await aiContext.loadData();
aiContext.writeIndicatorCsvData();
```

### File Streaming
```javascript
const readStream = createReadStream(csvPath);
readStream.pipe(res);
```

## API Endpoints Summary

### DELETE Endpoints (New)

#### 4. Delete Single CSV File
**DELETE** `/api/ai/csv/:symbol/:timeframe`

Delete a specific AI context CSV file from the server.

##### Parameters
- `symbol` - Trading pair (e.g., BTCUSDT)
- `timeframe` - Candle timeframe (e.g., 15m, 1h, 4h)

##### Response - Success
```json
{
  "success": true,
  "deleted": true,
  "symbol": "BTCUSDT",
  "timeframe": "15m",
  "fileName": "cryptoDogAiContext_BTCUSDT_15m.csv",
  "fileSize": 3827595,
  "fileSizeReadable": "3.65 MB",
  "timestamp": "2025-11-21T08:36:46.509Z"
}
```

##### Response - Not Found (404)
```json
{
  "error": "CSV file not found",
  "symbol": "BTCUSDT",
  "timeframe": "15m",
  "fileName": "cryptoDogAiContext_BTCUSDT_15m.csv",
  "hint": "File does not exist or was already deleted"
}
```

##### Example
```bash
curl -X DELETE http://localhost:3000/api/ai/csv/BTCUSDT/15m
```

---

#### 5. Delete All CSV Files
**DELETE** `/api/ai/csv-files`

Delete all AI context CSV files from the server (bulk delete).

##### Response - Success
```json
{
  "success": true,
  "deleted": 2,
  "failed": 0,
  "files": [
    {
      "fileName": "cryptoDogAiContext_BTCUSDT_15m.csv",
      "fileSize": 3827595,
      "fileSizeReadable": "3.65 MB"
    },
    {
      "fileName": "cryptoDogAiContext_ETHUSDT_1h.csv",
      "fileSize": 3442395,
      "fileSizeReadable": "3.28 MB"
    }
  ],
  "timestamp": "2025-11-21T08:37:44.610Z"
}
```

##### Response - No Files
```json
{
  "success": true,
  "deleted": 0,
  "message": "No CSV files found to delete"
}
```

##### Example
```bash
curl -X DELETE http://localhost:3000/api/ai/csv-files
```

---

## Technical Implementation

### Dependencies
- `core/cryptoDogAiContext.js` - CSV generation logic
- `core/cryptoDogTools.js` - Indicator calculations
- `core/indicator/Indicators.js` - Indicator implementations
- `core/clients/cryptoDogAgent.js` - Data loading from exchange

### Key Functions
```javascript
// Generate AI context CSV
const signal = { symbol, timeframe };
const aiContext = createAiContext(signal, iterations, candles);
await aiContext.loadData();
aiContext.writeIndicatorCsvData();
```

### File Streaming
```javascript
const readStream = createReadStream(csvPath);
readStream.pipe(res);
```
