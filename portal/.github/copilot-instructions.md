<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Crypto Dog Portal - Copilot Instructions

This is a Vue 3 + Vite cryptocurrency trading dashboard that integrates with the Crypto Dog backend.

## Project Context
- **Backend**: Node.js with Bybit API integration (located in parent directory)
- **WebSocket**: Real-time market data using Bybit WebSocket API
- **Indicators**: RSI, SuperTrend, MACD, Bollinger Bands, and 30+ other technical indicators
- **API Endpoint**: http://localhost:3000 (development)

## Code Style Guidelines
- Use Vue 3 Composition API with `<script setup>`
- Use Tailwind CSS utility classes for styling
- Prefer async/await over promises
- Use lightweight-charts for price visualization
- Keep components small and focused
- Use TypeScript-style JSDoc comments for better IntelliSense

## Key Components
- **LiveTicker**: Real-time price updates via WebSocket
- **OrderBook**: Bid/ask depth display
- **IndicatorDashboard**: Technical indicator analysis with trade signals
- **SymbolSearch**: Autocomplete for adding trading pairs

## WebSocket Integration
- Connect to Bybit WebSocket for live data
- Handle reconnection and error states
- Throttle updates to prevent UI flooding

## State Management
- Use Vue 3 reactivity (ref, reactive, computed)
- Store WebSocket connections globally
- Cache indicator data for performance
