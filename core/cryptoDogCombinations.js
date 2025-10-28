import { CryptoDogWebSocketHandler } from "./clients/cryptoDogWebsocketHandler.js";
import {IndicatorList} from "./indicator/Indicators.js"
import {createIndicatorData} from "././cryptoDogTools.js";
import chalk from 'chalk';
import Table from 'cli-table3';

const wsHandler = new CryptoDogWebSocketHandler({
  testnet: false,
  throttleMs: 5000
});

export class CryptoDogCombinationsAgent {
    constructor() {
        this.wsHandler = wsHandler;
        this.minLoadSize = 201;
        this.startTime = null;
        this.endTime = null;
        this.maxSize = 2000;
        this.klineData = [];
    }

    isKlineDataLoaded() {
        return this.klineData.length > 0;
    }

    isNewDataPoint(open, high, low, close, volume, timestamp) {
        if (!this.isKlineDataLoaded()) {
            return true;
        }

        const lastEntry = this.klineData[this.klineData.length - 1];
        const [lastTimestamp, lastOpen, lastHigh, lastLow, lastClose, lastVolume] = lastEntry;

        const isSameTimestamp = lastTimestamp === timestamp;

        const isIdenticalData = (
            lastOpen === open &&
            lastHigh === high &&
            lastLow === low &&
            lastClose === close &&
            lastVolume === volume
        );

        return !isSameTimestamp && !isIdenticalData;
    }

    loadData(open, close, high, low, volume, timestamp, start, end) {
        let currentDate = new Date();
        let addNewCandle = new Date(end) <= currentDate;
        if (addNewCandle) {
            this.klineData.push([timestamp, open, high, low, close, volume]);
        } else  {
            if(this.isNewDataPoint(open, high, low, close, volume, timestamp)) {
                this.klineData[this.klineData.length - 1] = [timestamp, open, high, low, close, volume];
            }
        }
        this.trimDataBuffer();
    }

    trimDataBuffer() {
        if (this.klineData.length <= this.maxSize) return;
        this.klineData = this.klineData.slice(this.klineData.length - this.maxSize);
    }

    // Popular Trading Signal Combinations
    processSignalCombinations() {
        let {o,h,l,c,v, buffer } = createIndicatorData(this.klineData);
        
        // Get all indicators
        let rsi = IndicatorList.getIndicator("RsiIndicator")(o,h,l,c,v, {period:14}, buffer);
        let macd = IndicatorList.getIndicator("MacdIndicator")(o,h,l,c,v, {fastPeriod:12, slowPeriod:26, signalPeriod:9}, buffer);
        let superTrend = IndicatorList.getIndicator("SuperTrendIndicator")(o,h,l,c,v, {period:10, multiplier:3}, buffer);
        let atr = IndicatorList.getIndicator("AtrIndicator")(o,h,l,c,v, {period:14}, buffer);
        let bollinger = IndicatorList.getIndicator("BollingerIndicator")(o,h,l,c,v, {period:20, stdDev:2}, buffer);
        let williamsR = IndicatorList.getIndicator("WilliamsRIndicator")(o,h,l,c,v, {period:14}, buffer);
        let mfi = IndicatorList.getIndicator("MfiIndicator")(o,h,l,c,v, {period:14}, buffer);
        let obv = IndicatorList.getIndicator("ObvIndicator")(o,h,l,c,v, {}, buffer);
        let stochastic = IndicatorList.getIndicator("StochasticIndicator")(o,h,l,c,v, {kPeriod:14, dPeriod:3}, buffer);
        let adx = IndicatorList.getIndicator("AdxIndicator")(o,h,l,c,v, {period:14}, buffer);
        let ichimoku = IndicatorList.getIndicator("IchimokuCloudIndicator")(o,h,l,c,v, {}, buffer);
        let emaFast = IndicatorList.getIndicator("EMAIndicator")(o,h,l,c,v, {period:20}, buffer);
        let emaSlow = IndicatorList.getIndicator("EMAIndicator")(o,h,l,c,v, {period:200}, buffer);
        let volumeWeightedAvgPrice = IndicatorList.getIndicator("VolumeWeightedAvgPrice")(o,h,l,c,v, {}, buffer);
        let supportResistance = IndicatorList.getIndicator("SupportAndResistance")(o,h,l,c,v, {}, buffer);
        let floorPivots = IndicatorList.getIndicator("FloorPivots")(o,h,l,c,v, {}, buffer);
        
        // Get latest values
        const latestRSI = rsi.length > 0 ? rsi[rsi.length - 1] : null;
        const latestMACD = macd.length > 0 ? macd[macd.length - 1] : null;
        const latestSuperTrend = superTrend.length > 0 ? superTrend[superTrend.length - 1] : null;
        const latestATR = atr.length > 0 ? atr[atr.length - 1] : null;
        const latestBollinger = bollinger.length > 0 ? bollinger[bollinger.length - 1] : null;
        const latestWilliamsR = williamsR.length > 0 ? williamsR[williamsR.length - 1] : null;
        const latestMFI = mfi.length > 0 ? mfi[mfi.length - 1] : null;
        const latestOBV = obv.length > 0 ? obv[obv.length - 1] : null;
        const latestStochastic = stochastic.length > 0 ? stochastic[stochastic.length - 1] : null;
        const latestADX = adx.length > 0 ? adx[adx.length - 1] : null;
        const latestIchimoku = ichimoku.length > 0 ? ichimoku[ichimoku.length - 1] : null;
        const latestEMAFast = emaFast.length > 0 ? emaFast[emaFast.length - 1] : null;
        const latestEMASlow = emaSlow.length > 0 ? emaSlow[emaSlow.length - 1] : null;
        const latestVWAP = volumeWeightedAvgPrice.length > 0 ? volumeWeightedAvgPrice[volumeWeightedAvgPrice.length - 1] : null;
        const latestSupportResistance = supportResistance.length > 0 ? supportResistance[supportResistance.length - 1] : null;
        const latestFloorPivots = floorPivots.length > 0 ? floorPivots[floorPivots.length - 1] : null;
        
        const combinations = [];
        
        // 1. MACD + RSI + EMA Crossover (Trend-Following)
        let macdSignal = 'NEUTRAL';
        let rsiSignal = 'NEUTRAL';
        let emaSignal = 'NEUTRAL';
        
        if (latestMACD && latestMACD.histogram !== undefined) {
            macdSignal = latestMACD.histogram > 0 ? 'BULLISH' : 'BEARISH';
        }
        
        if (latestRSI !== null) {
            if (latestRSI > 70) rsiSignal = 'OVERBOUGHT';
            else if (latestRSI < 30) rsiSignal = 'OVERSOLD';
            else rsiSignal = 'NEUTRAL';
        }
        
        if (latestEMAFast !== null && latestEMASlow !== null) {
            emaSignal = latestEMAFast > latestEMASlow ? 'BULLISH' : 'BEARISH';
        }
        
        const trendSignals = [macdSignal, rsiSignal === 'OVERSOLD' ? 'BULLISH' : rsiSignal === 'OVERBOUGHT' ? 'BEARISH' : 'NEUTRAL', emaSignal];
        const bullishCount = trendSignals.filter(s => s === 'BULLISH').length;
        const bearishCount = trendSignals.filter(s => s === 'BEARISH').length;
        const overallTrend = bullishCount > bearishCount ? 'BULLISH TREND' : bearishCount > bullishCount ? 'BEARISH TREND' : 'NEUTRAL';
        
        combinations.push({
            name: 'MACD + RSI + EMA',
            strategy: 'Trend-Following',
            signal: overallTrend,
            details: `MACD: ${macdSignal} (${latestMACD ? latestMACD.histogram?.toFixed(2) : 'N/A'}) | RSI: ${rsiSignal} (${latestRSI?.toFixed(2) || 'N/A'}) | EMA: ${emaSignal}`,
            score: `${bullishCount}B/${bearishCount}S`
        });
        
        // 2. Stochastic + RSI + Williams %R (Oscillator Convergence)
        let stochSignal = 'NEUTRAL';
        let williamsSignal = 'NEUTRAL';
        
        if (latestStochastic && latestStochastic.k !== undefined) {
            if (latestStochastic.k > 80) stochSignal = 'OVERBOUGHT';
            else if (latestStochastic.k < 20) stochSignal = 'OVERSOLD';
        }
        
        if (latestWilliamsR !== null) {
            if (latestWilliamsR > -20) williamsSignal = 'OVERBOUGHT';
            else if (latestWilliamsR < -80) williamsSignal = 'OVERSOLD';
        }
        
        const oscillators = [stochSignal, rsiSignal, williamsSignal];
        const overboughtCount = oscillators.filter(s => s === 'OVERBOUGHT').length;
        const oversoldCount = oscillators.filter(s => s === 'OVERSOLD').length;
        const convergence = overboughtCount >= 2 ? 'OVERBOUGHT CONVERGENCE' : oversoldCount >= 2 ? 'OVERSOLD CONVERGENCE' : 'NO CONVERGENCE';
        
        combinations.push({
            name: 'Stochastic + RSI + Williams %R',
            strategy: 'Oscillator Convergence',
            signal: convergence,
            details: `Stoch: ${stochSignal} (${latestStochastic ? latestStochastic.k?.toFixed(2) : 'N/A'}) | RSI: ${rsiSignal} | Williams: ${williamsSignal}`,
            score: `${oversoldCount}O/${overboughtCount}OB`
        });
        
        // 3. Bollinger Bands + RSI + Volume (Mean Reversion)
        let bbSignal = 'NEUTRAL';
        let volumeSignal = 'NEUTRAL';
        
        if (latestBollinger && latestBollinger.pb !== undefined) {
            if (latestBollinger.pb > 1) bbSignal = 'UPPER BAND';
            else if (latestBollinger.pb < 0) bbSignal = 'LOWER BAND';
            else bbSignal = 'MIDDLE';
        }
        
        if (latestOBV !== null) {
            volumeSignal = 'VOLUME DATA AVAILABLE';
        }
        
        const meanReversionSignal = (bbSignal === 'UPPER BAND' && rsiSignal === 'OVERBOUGHT') ? 'SELL SIGNAL' :
                                   (bbSignal === 'LOWER BAND' && rsiSignal === 'OVERSOLD') ? 'BUY SIGNAL' : 'NO SIGNAL';
        
        combinations.push({
            name: 'Bollinger + RSI + Volume',
            strategy: 'Mean Reversion',
            signal: meanReversionSignal,
            details: `BB Pos: ${bbSignal} (${latestBollinger ? latestBollinger.pb?.toFixed(3) : 'N/A'}) | RSI: ${rsiSignal} | OBV: ${latestOBV?.toLocaleString() || 'N/A'}`,
            score: ''
        });
        
        // 4. ADX + SuperTrend + ATR (Trend Strength)
        let adxSignal = 'NEUTRAL';
        let superTrendSignal = 'NEUTRAL';
        let atrSignal = 'NEUTRAL';
        
        if (latestADX && latestADX.adx !== undefined) {
            if (latestADX.adx > 25) adxSignal = 'STRONG TREND';
            else if (latestADX.adx < 20) adxSignal = 'WEAK TREND';
            else adxSignal = 'MODERATE TREND';
        }
        
        if (latestSuperTrend && latestSuperTrend.trend) {
            superTrendSignal = latestSuperTrend.trend.toUpperCase();
        }
        
        if (latestATR !== null) {
            atrSignal = `VOLATILITY: ${latestATR.toFixed(2)}`;
        }
        
        const trendStrength = adxSignal === 'STRONG TREND' ? 'HIGH' : adxSignal === 'MODERATE TREND' ? 'MEDIUM' : 'LOW';
        
        combinations.push({
            name: 'ADX + SuperTrend + ATR',
            strategy: 'Trend Strength',
            signal: trendStrength,
            details: `ADX: ${adxSignal} (${latestADX ? latestADX.adx?.toFixed(2) : 'N/A'}) | SuperTrend: ${superTrendSignal} | ATR: ${latestATR?.toFixed(2) || 'N/A'}`,
            score: ''
        });
        
        // 5. Ichimoku Cloud + RSI + MACD (Japanese Style)
        let ichimokuSignal = 'NEUTRAL';
        
        if (latestIchimoku && latestIchimoku.conversion !== undefined && latestIchimoku.base !== undefined) {
            const conversion = latestIchimoku.conversion;
            const base = latestIchimoku.base;
            const spanA = latestIchimoku.spanA;
            const spanB = latestIchimoku.spanB;
            
            if (conversion > base && conversion > spanA && base > spanA) {
                ichimokuSignal = 'STRONG BULLISH';
            } else if (conversion < base && conversion < spanA && base < spanA) {
                ichimokuSignal = 'STRONG BEARISH';
            } else {
                ichimokuSignal = 'NEUTRAL';
            }
        }
        
        const japaneseSignals = [ichimokuSignal, rsiSignal === 'OVERSOLD' ? 'BULLISH' : rsiSignal === 'OVERBOUGHT' ? 'BEARISH' : 'NEUTRAL', macdSignal];
        const jpBullish = japaneseSignals.filter(s => s.includes('BULLISH') || s === 'BULLISH').length;
        const jpBearish = japaneseSignals.filter(s => s.includes('BEARISH') || s === 'BEARISH').length;
        const overallJapanese = jpBullish > jpBearish ? 'BULLISH SETUP' : jpBearish > jpBullish ? 'BEARISH SETUP' : 'NEUTRAL';
        
        combinations.push({
            name: 'Ichimoku + RSI + MACD',
            strategy: 'Japanese Style',
            signal: overallJapanese,
            details: `Ichimoku: ${ichimokuSignal} | RSI: ${rsiSignal} | MACD: ${macdSignal}`,
            score: `${jpBullish}B/${jpBearish}S`
        });
        
        // 6. VWAP + Bollinger Bands + MACD (Institutional Flow)
        let vwapSignal = 'NEUTRAL';
        let priceVsVWAP = 'NEUTRAL';
        
        if (latestVWAP !== null && c.length > 0) {
            const currentPrice = c[c.length - 1];
            if (currentPrice > latestVWAP) priceVsVWAP = 'ABOVE VWAP';
            else if (currentPrice < latestVWAP) priceVsVWAP = 'BELOW VWAP';
        }
        
        const institutionalSignal = (priceVsVWAP === 'ABOVE VWAP' && bbSignal === 'MIDDLE' && macdSignal === 'BULLISH') ? 'INSTITUTIONAL BUY' :
                                   (priceVsVWAP === 'BELOW VWAP' && bbSignal === 'MIDDLE' && macdSignal === 'BEARISH') ? 'INSTITUTIONAL SELL' : 'NEUTRAL';
        
        combinations.push({
            name: 'VWAP + Bollinger + MACD',
            strategy: 'Institutional Flow',
            signal: institutionalSignal,
            details: `Price vs VWAP: ${priceVsVWAP} | BB: ${bbSignal} | MACD: ${macdSignal}`,
            score: ''
        });
        
        // 7. Support/Resistance + ADX + Stochastic (Breakout Trading)
        let srSignal = 'NEUTRAL';
        let breakoutSignal = 'NEUTRAL';
        
        if (latestSupportResistance && latestSupportResistance.level !== undefined) {
            srSignal = 'SUPPORT/RESISTANCE LEVELS DETECTED';
        }
        
        if (adxSignal === 'STRONG TREND' && stochSignal === 'OVERSOLD') {
            breakoutSignal = 'BULLISH BREAKOUT';
        } else if (adxSignal === 'STRONG TREND' && stochSignal === 'OVERBOUGHT') {
            breakoutSignal = 'BEARISH BREAKOUT';
        }
        
        combinations.push({
            name: 'Support/Resistance + ADX + Stochastic',
            strategy: 'Breakout Trading',
            signal: breakoutSignal,
            details: `S/R: ${srSignal} | ADX: ${adxSignal} | Stochastic: ${stochSignal}`,
            score: ''
        });
        
        // 8. Volume Profile + RSI + EMA (Volume Analysis)
        let volumeProfileSignal = 'NEUTRAL';
        let volumeRSISignal = 'NEUTRAL';
        
        // Simple volume analysis based on OBV trend
        if (latestOBV !== null) {
            volumeProfileSignal = 'VOLUME PROFILE ACTIVE';
        }
        
        if (rsiSignal === 'OVERSOLD' && emaSignal === 'BULLISH') {
            volumeRSISignal = 'VOLUME ACCUMULATION';
        } else if (rsiSignal === 'OVERBOUGHT' && emaSignal === 'BEARISH') {
            volumeRSISignal = 'VOLUME DISTRIBUTION';
        }
        
        combinations.push({
            name: 'Volume Profile + RSI + EMA',
            strategy: 'Volume Analysis',
            signal: volumeRSISignal,
            details: `Volume: ${volumeProfileSignal} | RSI: ${rsiSignal} | EMA: ${emaSignal}`,
            score: ''
        });
        
        // 9. Pivot Points + SuperTrend + ATR (Classic Pivot Trading)
        let pivotSignal = 'NEUTRAL';
        let pivotTradeSignal = 'NEUTRAL';
        
        if (latestFloorPivots && latestFloorPivots.floor && latestFloorPivots.floor.pivot !== undefined) {
            pivotSignal = 'PIVOT LEVELS ACTIVE';
        }
        
        if (superTrendSignal === 'LONG' && atrSignal !== 'NEUTRAL') {
            pivotTradeSignal = 'PIVOT LONG TRADE';
        } else if (superTrendSignal === 'SHORT' && atrSignal !== 'NEUTRAL') {
            pivotTradeSignal = 'PIVOT SHORT TRADE';
        }
        
        combinations.push({
            name: 'Pivot Points + SuperTrend + ATR',
            strategy: 'Classic Pivot Trading',
            signal: pivotTradeSignal,
            details: `Pivots: ${pivotSignal} | SuperTrend: ${superTrendSignal} | ATR: ${atrSignal}`,
            score: ''
        });
        
        // 10. Fibonacci + RSI + Volume (Fibonacci Retracements)
        let fibSignal = 'NEUTRAL';
        let fibTradeSignal = 'NEUTRAL';
        
        // Using Bollinger Bands as proxy for Fibonacci levels (simplified)
        if (bbSignal === 'LOWER BAND' && rsiSignal === 'OVERSOLD') {
            fibSignal = 'FIBONACCI SUPPORT';
            fibTradeSignal = 'FIBONACCI BUY';
        } else if (bbSignal === 'UPPER BAND' && rsiSignal === 'OVERBOUGHT') {
            fibSignal = 'FIBONACCI RESISTANCE';
            fibTradeSignal = 'FIBONACCI SELL';
        }
        
        combinations.push({
            name: 'Fibonacci + RSI + Volume',
            strategy: 'Fibonacci Retracements',
            signal: fibTradeSignal,
            details: `Fib Level: ${fibSignal} | RSI: ${rsiSignal} | Volume: ${volumeSignal}`,
            score: ''
        });
        
        // 11. Moving Average Crossover + RSI + Volume (MA Crossover)
        let maCrossoverSignal = 'NEUTRAL';
        let maTradeSignal = 'NEUTRAL';
        
        if (emaSignal === 'BULLISH' && rsiSignal === 'OVERSOLD' && volumeSignal === 'HIGH') {
            maCrossoverSignal = 'BULLISH CROSSOVER';
            maTradeSignal = 'MA BUY SIGNAL';
        } else if (emaSignal === 'BEARISH' && rsiSignal === 'OVERBOUGHT' && volumeSignal === 'HIGH') {
            maCrossoverSignal = 'BEARISH CROSSOVER';
            maTradeSignal = 'MA SELL SIGNAL';
        }
        
        combinations.push({
            name: 'Moving Average Crossover + RSI + Volume',
            strategy: 'MA Crossover',
            signal: maTradeSignal,
            details: `MA Trend: ${emaSignal} | RSI: ${rsiSignal} | Volume: ${volumeSignal}`,
            score: ''
        });
        
        // 12. Parabolic SAR + RSI + MACD (Stop and Reverse)
        let psarSignal = 'NEUTRAL';
        let psarTradeSignal = 'NEUTRAL';
        
        // Simplified PSAR logic - using SuperTrend as proxy
        if (superTrendSignal === 'LONG' && macdSignal === 'BULLISH' && rsiSignal !== 'OVERBOUGHT') {
            psarSignal = 'PSAR LONG';
            psarTradeSignal = 'PSAR BUY';
        } else if (superTrendSignal === 'SHORT' && macdSignal === 'BEARISH' && rsiSignal !== 'OVERSOLD') {
            psarSignal = 'PSAR SHORT';
            psarTradeSignal = 'PSAR SELL';
        }
        
        combinations.push({
            name: 'Parabolic SAR + RSI + MACD',
            strategy: 'Stop and Reverse',
            signal: psarTradeSignal,
            details: `PSAR: ${psarSignal} | MACD: ${macdSignal} | RSI: ${rsiSignal}`,
            score: ''
        });
        
        // 13. CCI + RSI + Bollinger Bands (Commodity Channel Index)
        let cciSignal = 'NEUTRAL';
        let cciTradeSignal = 'NEUTRAL';
        
        // Using Stochastic as proxy for CCI (simplified)
        if (stochSignal === 'OVERSOLD' && bbSignal === 'LOWER BAND' && rsiSignal === 'OVERSOLD') {
            cciSignal = 'CCI OVERSOLD';
            cciTradeSignal = 'CCI BUY';
        } else if (stochSignal === 'OVERBOUGHT' && bbSignal === 'UPPER BAND' && rsiSignal === 'OVERBOUGHT') {
            cciSignal = 'CCI OVERBOUGHT';
            cciTradeSignal = 'CCI SELL';
        }
        
        combinations.push({
            name: 'CCI + RSI + Bollinger Bands',
            strategy: 'Commodity Channel Index',
            signal: cciTradeSignal,
            details: `CCI: ${cciSignal} | RSI: ${rsiSignal} | BB: ${bbSignal}`,
            score: ''
        });
        
        // 14. Price Action: Engulfing Patterns + Support/Resistance + Volume
        let engulfingSignal = 'NEUTRAL';
        let engulfingTradeSignal = 'NEUTRAL';
        
        // Simplified engulfing logic - using volume and RSI divergence
        if (volumeSignal === 'HIGH' && rsiSignal === 'OVERSOLD') {
            engulfingSignal = 'BULLISH ENGULFING';
            engulfingTradeSignal = 'ENGULFING BUY';
        } else if (volumeSignal === 'HIGH' && rsiSignal === 'OVERBOUGHT') {
            engulfingSignal = 'BEARISH ENGULFING';
            engulfingTradeSignal = 'ENGULFING SELL';
        }
        
        combinations.push({
            name: 'Engulfing Patterns + Support/Resistance + Volume',
            strategy: 'Price Action',
            signal: engulfingTradeSignal,
            details: `Pattern: ${engulfingSignal} | Volume: ${volumeSignal} | RSI: ${rsiSignal}`,
            score: ''
        });
        
        // 15. Price Action: Pin Bars + Trend Lines + RSI
        let pinBarSignal = 'NEUTRAL';
        let pinBarTradeSignal = 'NEUTRAL';
        
        // Simplified pin bar logic - using Bollinger Bands rejection
        if (bbSignal === 'LOWER BAND' && rsiSignal === 'OVERSOLD' && emaSignal === 'BULLISH') {
            pinBarSignal = 'BULLISH PIN BAR';
            pinBarTradeSignal = 'PIN BAR BUY';
        } else if (bbSignal === 'UPPER BAND' && rsiSignal === 'OVERBOUGHT' && emaSignal === 'BEARISH') {
            pinBarSignal = 'BEARISH PIN BAR';
            pinBarTradeSignal = 'PIN BAR SELL';
        }
        
        combinations.push({
            name: 'Pin Bars + Trend Lines + RSI',
            strategy: 'Price Action',
            signal: pinBarTradeSignal,
            details: `Pin Bar: ${pinBarSignal} | Trend: ${emaSignal} | RSI: ${rsiSignal}`,
            score: ''
        });
        
        // 16. Elder Impulse + MACD + Stochastic (Impulse System)
        let impulseSignal = 'NEUTRAL';
        let impulseTradeSignal = 'NEUTRAL';
        
        if (macdSignal === 'BULLISH' && stochSignal === 'OVERSOLD' && emaSignal === 'BULLISH') {
            impulseSignal = 'GREEN IMPULSE';
            impulseTradeSignal = 'IMPULSE BUY';
        } else if (macdSignal === 'BEARISH' && stochSignal === 'OVERBOUGHT' && emaSignal === 'BEARISH') {
            impulseSignal = 'RED IMPULSE';
            impulseTradeSignal = 'IMPULSE SELL';
        }
        
        combinations.push({
            name: 'Elder Impulse + MACD + Stochastic',
            strategy: 'Impulse System',
            signal: impulseTradeSignal,
            details: `Impulse: ${impulseSignal} | MACD: ${macdSignal} | Stoch: ${stochSignal}`,
            score: ''
        });
        
        // 17. Keltner Channels + RSI + Volume (Channel Trading)
        let keltnerSignal = 'NEUTRAL';
        let keltnerTradeSignal = 'NEUTRAL';
        
        // Using Bollinger Bands as proxy for Keltner Channels
        if (bbSignal === 'LOWER BAND' && rsiSignal === 'OVERSOLD' && volumeSignal === 'HIGH') {
            keltnerSignal = 'KELTNER SUPPORT';
            keltnerTradeSignal = 'KELTNER BUY';
        } else if (bbSignal === 'UPPER BAND' && rsiSignal === 'OVERBOUGHT' && volumeSignal === 'HIGH') {
            keltnerSignal = 'KELTNER RESISTANCE';
            keltnerTradeSignal = 'KELTNER SELL';
        }
        
        combinations.push({
            name: 'Keltner Channels + RSI + Volume',
            strategy: 'Channel Trading',
            signal: keltnerTradeSignal,
            details: `Channel: ${keltnerSignal} | RSI: ${rsiSignal} | Volume: ${volumeSignal}`,
            score: ''
        });
        
        // 18. Donchian Channels + ADX + ATR (Range Trading)
        let donchianSignal = 'NEUTRAL';
        let donchianTradeSignal = 'NEUTRAL';
        
        // Using Bollinger Bands as proxy for Donchian
        if (bbSignal === 'MIDDLE BAND' && adxSignal === 'TRENDING' && atrSignal !== 'NEUTRAL') {
            donchianSignal = 'DONCHIAN RANGE';
            donchianTradeSignal = 'DONCHIAN BREAKOUT';
        }
        
        combinations.push({
            name: 'Donchian Channels + ADX + ATR',
            strategy: 'Range Trading',
            signal: donchianTradeSignal,
            details: `Range: ${donchianSignal} | ADX: ${adxSignal} | ATR: ${atrSignal}`,
            score: ''
        });
        
        // 19. Price Action: Inside Bars + Breakout + Volume
        let insideBarSignal = 'NEUTRAL';
        let insideBarTradeSignal = 'NEUTRAL';
        
        // Simplified inside bar logic - using ATR for volatility
        if (atrSignal === 'HIGH_VOLATILITY' && volumeSignal === 'HIGH') {
            insideBarSignal = 'INSIDE BAR BREAKOUT';
            insideBarTradeSignal = 'INSIDE BAR TRADE';
        }
        
        combinations.push({
            name: 'Inside Bars + Breakout + Volume',
            strategy: 'Price Action',
            signal: insideBarTradeSignal,
            details: `Breakout: ${insideBarSignal} | ATR: ${atrSignal} | Volume: ${volumeSignal}`,
            score: ''
        });
        
        // 20. Heikin Ashi + RSI + EMA (Smoothed Price Action)
        let heikinSignal = 'NEUTRAL';
        let heikinTradeSignal = 'NEUTRAL';
        
        // Simplified Heikin Ashi logic - using EMA smoothing
        if (emaSignal === 'BULLISH' && rsiSignal === 'OVERSOLD') {
            heikinSignal = 'HEIKIN BULLISH';
            heikinTradeSignal = 'HEIKIN BUY';
        } else if (emaSignal === 'BEARISH' && rsiSignal === 'OVERBOUGHT') {
            heikinSignal = 'HEIKIN BEARISH';
            heikinTradeSignal = 'HEIKIN SELL';
        }
        
        combinations.push({
            name: 'Heikin Ashi + RSI + EMA',
            strategy: 'Smoothed Price Action',
            signal: heikinTradeSignal,
            details: `Heikin: ${heikinSignal} | RSI: ${rsiSignal} | EMA: ${emaSignal}`,
            score: ''
        });
        
        // 21. Predictive Analytics - Poor Man's AI (Statistical Pattern Recognition)
        let predictiveSignal = 'NEUTRAL';
        let predictiveTradeSignal = 'NEUTRAL';
        let confidenceLevel = 'LOW';
        
        // Analyze recent price momentum (last 5 candles)
        const recentPrices = this.klineData.slice(-5).map(k => parseFloat(k.close));
        const priceChanges = [];
        for (let i = 1; i < recentPrices.length; i++) {
            priceChanges.push((recentPrices[i] - recentPrices[i-1]) / recentPrices[i-1]);
        }
        
        const avgPriceChange = priceChanges.reduce((a, b) => a + b, 0) / priceChanges.length;
        const priceVolatility = Math.sqrt(priceChanges.reduce((a, b) => a + b * b, 0) / priceChanges.length);
        
        // Analyze volume trend (last 5 candles)
        const recentVolumes = this.klineData.slice(-5).map(k => parseFloat(k.volume));
        const avgVolume = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length;
        const currentVolume = recentVolumes[recentVolumes.length - 1];
        const volumeTrend = currentVolume > avgVolume * 1.2 ? 'HIGH' : currentVolume < avgVolume * 0.8 ? 'LOW' : 'NORMAL';
        
        // Simple predictive logic based on patterns
        let bullishFactors = 0;
        let bearishFactors = 0;
        
        // Price momentum factors
        if (avgPriceChange > 0.005) bullishFactors += 2; // Strong upward momentum
        else if (avgPriceChange < -0.005) bearishFactors += 2; // Strong downward momentum
        
        // Volume confirmation
        if (volumeTrend === 'HIGH' && avgPriceChange > 0) bullishFactors += 1;
        if (volumeTrend === 'HIGH' && avgPriceChange < 0) bearishFactors += 1;
        
        // Volatility analysis
        if (priceVolatility > 0.02 && avgPriceChange > 0) bullishFactors += 1; // High vol + up = strong move
        if (priceVolatility > 0.02 && avgPriceChange < 0) bearishFactors += 1; // High vol + down = strong move
        
        // RSI trend analysis
        if (rsiSignal === 'OVERSOLD' && avgPriceChange > 0) bullishFactors += 1;
        if (rsiSignal === 'OVERBOUGHT' && avgPriceChange < 0) bearishFactors += 1;
        
        // MACD confirmation
        if (macdSignal === 'BULLISH') bullishFactors += 1;
        if (macdSignal === 'BEARISH') bearishFactors += 1;
        
        // Determine confidence and signal
        const totalFactors = bullishFactors + bearishFactors;
        if (totalFactors >= 3) confidenceLevel = 'HIGH';
        else if (totalFactors >= 2) confidenceLevel = 'MEDIUM';
        
        if (bullishFactors > bearishFactors + 1) {
            predictiveSignal = 'PREDICTED UPTREND';
            predictiveTradeSignal = 'AI BUY SIGNAL';
        } else if (bearishFactors > bullishFactors + 1) {
            predictiveSignal = 'PREDICTED DOWNTREND';
            predictiveTradeSignal = 'AI SELL SIGNAL';
        } else {
            predictiveSignal = 'UNCERTAIN TREND';
            predictiveTradeSignal = 'AI HOLD SIGNAL';
        }
        
        combinations.push({
            name: 'Predictive Analytics - Poor Man\'s AI',
            strategy: 'Statistical Pattern Recognition',
            signal: predictiveTradeSignal,
            details: `Prediction: ${predictiveSignal} | Confidence: ${confidenceLevel} | Momentum: ${(avgPriceChange * 100).toFixed(2)}% | Volume: ${volumeTrend}`,
            score: `${bullishFactors}/${bearishFactors}`
        });
        
        return combinations;
    }

    // Get current indicator values for display
    getCurrentIndicatorValues() {
        if (!this.isKlineDataLoaded() || this.klineData.length < 50) {
            return null;
        }

        let {o,h,l,c,v, buffer } = createIndicatorData(this.klineData);
        
        // Get all indicators
        let rsi = IndicatorList.getIndicator("RsiIndicator")(o,h,l,c,v, {period:14}, buffer);
        let macd = IndicatorList.getIndicator("MacdIndicator")(o,h,l,c,v, {fastPeriod:12, slowPeriod:26, signalPeriod:9}, buffer);
        let superTrend = IndicatorList.getIndicator("SuperTrendIndicator")(o,h,l,c,v, {period:10, multiplier:3}, buffer);
        let atr = IndicatorList.getIndicator("AtrIndicator")(o,h,l,c,v, {period:14}, buffer);
        let bollinger = IndicatorList.getIndicator("BollingerIndicator")(o,h,l,c,v, {period:20, stdDev:2}, buffer);
        let williamsR = IndicatorList.getIndicator("WilliamsRIndicator")(o,h,l,c,v, {period:14}, buffer);
        let mfi = IndicatorList.getIndicator("MfiIndicator")(o,h,l,c,v, {period:14}, buffer);
        let obv = IndicatorList.getIndicator("ObvIndicator")(o,h,l,c,v, {}, buffer);
        let stochastic = IndicatorList.getIndicator("StochasticIndicator")(o,h,l,c,v, {kPeriod:14, dPeriod:3}, buffer);
        let adx = IndicatorList.getIndicator("AdxIndicator")(o,h,l,c,v, {period:14}, buffer);
        let ichimoku = IndicatorList.getIndicator("IchimokuCloudIndicator")(o,h,l,c,v, {}, buffer);
        let emaFast = IndicatorList.getIndicator("EMAIndicator")(o,h,l,c,v, {period:20}, buffer);
        let emaSlow = IndicatorList.getIndicator("EMAIndicator")(o,h,l,c,v, {period:200}, buffer);
        let volumeWeightedAvgPrice = IndicatorList.getIndicator("VolumeWeightedAvgPrice")(o,h,l,c,v, {}, buffer);
        
        // Get latest values
        const latestClose = c.length > 0 ? c[c.length - 1] : null;
        const latestRSI = rsi.length > 0 ? rsi[rsi.length - 1] : null;
        const latestMACD = macd.length > 0 ? macd[macd.length - 1] : null;
        const latestSuperTrend = superTrend.length > 0 ? superTrend[superTrend.length - 1] : null;
        const latestATR = atr.length > 0 ? atr[atr.length - 1] : null;
        const latestBollinger = bollinger.length > 0 ? bollinger[bollinger.length - 1] : null;
        const latestWilliamsR = williamsR.length > 0 ? williamsR[williamsR.length - 1] : null;
        const latestMFI = mfi.length > 0 ? mfi[mfi.length - 1] : null;
        const latestOBV = obv.length > 0 ? obv[obv.length - 1] : null;
        const latestStochastic = stochastic.length > 0 ? stochastic[stochastic.length - 1] : null;
        const latestADX = adx.length > 0 ? adx[adx.length - 1] : null;
        const latestIchimoku = ichimoku.length > 0 ? ichimoku[ichimoku.length - 1] : null;
        const latestEMAFast = emaFast.length > 0 ? emaFast[emaFast.length - 1] : null;
        const latestEMASlow = emaSlow.length > 0 ? emaSlow[emaSlow.length - 1] : null;
        const latestVWAP = volumeWeightedAvgPrice.length > 0 ? volumeWeightedAvgPrice[volumeWeightedAvgPrice.length - 1] : null;
        
        return {
            price: latestClose,
            rsi: latestRSI,
            macd: latestMACD,
            superTrend: latestSuperTrend,
            atr: latestATR,
            bollinger: latestBollinger,
            williamsR: latestWilliamsR,
            mfi: latestMFI,
            obv: latestOBV,
            stochastic: latestStochastic,
            adx: latestADX,
            ichimoku: latestIchimoku,
            emaFast: latestEMAFast,
            emaSlow: latestEMASlow,
            vwap: latestVWAP
        };
    }

    async startRealTimeKlineFeed(interval, symbol) {
        const { getKlineCandles, getInterval } = await import('./clients/cryptoDogRequestHandler.js');
        const intervalValue = getInterval(interval).value;

        // Load initial historical data
        const ohlcv = await getKlineCandles('spot', symbol, intervalValue, null, null, 201);
        if (ohlcv && ohlcv.result && ohlcv.result.list) {
            this.klineData = ohlcv.result.list.reverse();
        }

        // Subscribe to real-time updates
        const topic = `kline.${intervalValue}.${symbol}`;
        this.wsHandler.subscribeToTopics([topic], 'spot');

        // Handle real-time updates
        this.wsHandler.onUpdate((data) => {
            if (data.topic === topic && data.data) {
                const kline = data.data[0];
                if (kline) {
                    const open = parseFloat(kline.open);
                    const high = parseFloat(kline.high);
                    const low = parseFloat(kline.low);
                    const close = parseFloat(kline.close);
                    const volume = parseFloat(kline.volume);
                    const timestamp = parseInt(kline.start);

                    // Load new data point
                    this.loadData(open, close, high, low, volume, timestamp, null, new Date());

                    // Process data (this will be overridden in subclasses)
                    this.processData();
                }
            }
        });
    }
}

export async function startLiveCombinations(symbol = 'BTCUSDT', interval = '1h') {
  console.log(chalk.cyan(`\n🚀 Starting Live Trading Signal Combinations for ${symbol} ${interval}`));
  console.log(chalk.gray(`Press Ctrl+C to exit\n`));

  // Override console.log temporarily to suppress any unwanted logs
  const originalConsoleLog = console.log;
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;
  console.log = () => {}; // Suppress logs
  console.warn = () => {};
  console.error = () => {};

  // Restore after setup
  setTimeout(() => {
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
  }, 2000); // Restore after 2 seconds

  // Create agent
  const agent = new CryptoDogCombinationsAgent();

  // Function to display combinations
  function displayCombinations() {
    console.clear();
    console.log(chalk.cyan(`\n📊 LIVE TRADING SIGNAL COMBINATIONS - ${symbol} ${interval}`));
    console.log(chalk.gray(`Last updated: ${new Date().toLocaleTimeString()}\n`));

    // Call the base method which returns combination data
    const combinations = agent.processSignalCombinations();
    
    // Display each combination
    combinations.forEach((combo, index) => {
      console.log(chalk.yellow(`${index + 1}. ${combo.name} (${combo.strategy})`));
      console.log(chalk.green(`   Signal: ${combo.signal}`));
      console.log(chalk.gray(`   Details: ${combo.details}`));
      if (combo.score) {
        console.log(chalk.blue(`   Score: ${combo.score}`));
      }
      console.log('');
    });
  }

  // Override the processData to call displayCombinations instead
  agent.processData = function() {
    // Just call processSignalCombinations which handles everything
    displayCombinations();
  };

  // Start the feed
  await agent.startRealTimeKlineFeed(interval, symbol);

  // Initial display
  displayCombinations();

  // Handle exit
  process.on('SIGINT', () => {
    console.log = originalConsoleLog; // Restore console.log
    console.clear();
    console.log(chalk.green('\n✅ Live combinations stopped. Goodbye!\n'));
    process.exit(0);
  });
}
