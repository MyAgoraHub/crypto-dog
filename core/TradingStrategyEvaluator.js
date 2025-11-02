import fs from 'fs';

export class TradingStrategyEvaluator {
    constructor(indicatorsData = null, currentPrice = null) {
        this.indicators = indicatorsData;
        this.currentPrice = currentPrice;
        this.signals = {
            trend: null,
            momentum: null,
            volatility: null,
            volume: null,
            supportResistance: null,
            divergence: null,
            staticIndicators: null,
            overall: null
        };
    }

    // Load indicators from JSON file
    loadFromFile(filePath) {
        try {
            const data = fs.readFileSync(filePath, 'utf8');
            this.indicators = JSON.parse(data);
            return true;
        } catch (error) {
            console.error('❌ Error loading indicators from file:', error.message);
            return false;
        }
    }

    // Load indicators from object
    loadFromObject(indicatorsData) {
        this.indicators = indicatorsData;
    }

    // Set current price for static indicator evaluation
    setCurrentPrice(price) {
        this.currentPrice = parseFloat(price);
    }

    // Evaluate all signals
    evaluateAllSignals() {
        if (!this.indicators) {
            console.error('❌ No indicators data loaded');
            return null;
        }

        this.evaluateTrendSignals();
        this.evaluateMomentumSignals();
        this.evaluateVolatilitySignals();
        this.evaluateVolumeSignals();
        this.evaluateSupportResistanceSignals();
        this.evaluateDivergenceSignals();
        this.evaluateStaticIndicators();
        this.evaluateOverallSignal();

        return this.signals;
    }

    // Evaluate trend signals
    evaluateTrendSignals() {
        const signals = [];

        // SuperTrend
        if (this.indicators.SuperTrendIndicator) {
            const superTrend = this.indicators.SuperTrendIndicator;
            signals.push({
                indicator: 'SuperTrend',
                signal: superTrend.trend === 'long' ? 'bullish' : 'bearish',
                strength: 'strong',
                value: superTrend.value
            });
        }

        // ADX
        if (this.indicators.AdxIndicator) {
            const adx = this.indicators.AdxIndicator;
            let trendStrength = 'weak';
            if (adx.adx > 25) trendStrength = 'strong';
            else if (adx.adx > 20) trendStrength = 'moderate';

            let direction = 'neutral';
            if (adx.pdi > adx.mdi + 5) direction = 'bullish';
            else if (adx.mdi > adx.pdi + 5) direction = 'bearish';

            signals.push({
                indicator: 'ADX',
                signal: direction,
                strength: trendStrength,
                value: adx.adx
            });
        }

        // MACD
        if (this.indicators.MacdIndicator) {
            const macd = this.indicators.MacdIndicator;
            let signal = 'neutral';
            if (macd.MACD > macd.signal && macd.histogram > 0) signal = 'bullish';
            else if (macd.MACD < macd.signal && macd.histogram < 0) signal = 'bearish';

            signals.push({
                indicator: 'MACD',
                signal: signal,
                strength: Math.abs(macd.histogram) > Math.abs(macd.signal) * 0.5 ? 'strong' : 'weak',
                value: macd.histogram
            });
        }

        // Determine overall trend
        const bullishCount = signals.filter(s => s.signal === 'bullish').length;
        const bearishCount = signals.filter(s => s.signal === 'bearish').length;

        if (bullishCount > bearishCount) {
            this.signals.trend = { direction: 'bullish', strength: 'moderate', signals: signals };
        } else if (bearishCount > bullishCount) {
            this.signals.trend = { direction: 'bearish', strength: 'moderate', signals: signals };
        } else {
            this.signals.trend = { direction: 'neutral', strength: 'weak', signals: signals };
        }
    }

    // Evaluate momentum signals
    evaluateMomentumSignals() {
        const signals = [];

        // RSI
        if (this.indicators.RsiIndicator !== undefined) {
            const rsi = this.indicators.RsiIndicator;
            let signal = 'neutral';
            let strength = 'moderate';

            if (rsi > 70) {
                signal = 'overbought';
                strength = 'strong';
            } else if (rsi < 30) {
                signal = 'oversold';
                strength = 'strong';
            } else if (rsi > 60) {
                signal = 'bullish';
            } else if (rsi < 40) {
                signal = 'bearish';
            }

            signals.push({
                indicator: 'RSI',
                signal: signal,
                strength: strength,
                value: rsi
            });
        }

        // Stochastic
        if (this.indicators.StochasticIndicator) {
            const stoch = this.indicators.StochasticIndicator;
            let signal = 'neutral';

            if (stoch.k > 80 && stoch.d > 80) signal = 'overbought';
            else if (stoch.k < 20 && stoch.d < 20) signal = 'oversold';
            else if (stoch.k > stoch.d && stoch.k > 50) signal = 'bullish';
            else if (stoch.k < stoch.d && stoch.k < 50) signal = 'bearish';

            signals.push({
                indicator: 'Stochastic',
                signal: signal,
                strength: signal === 'overbought' || signal === 'oversold' ? 'strong' : 'moderate',
                value: stoch.k
            });
        }

        // Williams %R
        if (this.indicators.WilliamsRIndicator !== undefined) {
            const williams = this.indicators.WilliamsRIndicator;
            let signal = 'neutral';

            if (williams > -20) signal = 'overbought';
            else if (williams < -80) signal = 'oversold';
            else if (williams > -50) signal = 'bullish';
            else if (williams < -50) signal = 'bearish';

            signals.push({
                indicator: 'Williams %R',
                signal: signal,
                strength: signal === 'overbought' || signal === 'oversold' ? 'strong' : 'moderate',
                value: williams
            });
        }

        // Determine overall momentum
        const overboughtCount = signals.filter(s => s.signal === 'overbought').length;
        const oversoldCount = signals.filter(s => s.signal === 'oversold').length;
        const bullishCount = signals.filter(s => s.signal === 'bullish').length;
        const bearishCount = signals.filter(s => s.signal === 'bearish').length;

        if (oversoldCount > 0 || (bullishCount > bearishCount && overboughtCount === 0)) {
            this.signals.momentum = { direction: 'bullish', strength: 'moderate', signals: signals };
        } else if (overboughtCount > 0 || (bearishCount > bullishCount && oversoldCount === 0)) {
            this.signals.momentum = { direction: 'bearish', strength: 'moderate', signals: signals };
        } else {
            this.signals.momentum = { direction: 'neutral', strength: 'weak', signals: signals };
        }
    }

    // Evaluate volatility signals
    evaluateVolatilitySignals() {
        const signals = [];

        // Bollinger Bands
        if (this.indicators.BollingerIndicator) {
            const bb = this.indicators.BollingerIndicator;
            let signal = 'neutral';
            let strength = 'moderate';

            if (bb.pb > 0.8) {
                signal = 'overbought';
                strength = 'strong';
            } else if (bb.pb < 0.2) {
                signal = 'oversold';
                strength = 'strong';
            } else if (bb.pb > 0.6) {
                signal = 'bullish';
            } else if (bb.pb < 0.4) {
                signal = 'bearish';
            }

            signals.push({
                indicator: 'Bollinger Bands',
                signal: signal,
                strength: strength,
                value: bb.pb
            });
        }

        // ATR (volatility measure)
        if (this.indicators.AtrIndicator !== undefined) {
            const atr = this.indicators.AtrIndicator;
            signals.push({
                indicator: 'ATR',
                signal: 'volatility_measure',
                strength: 'info',
                value: atr
            });
        }

        // Determine overall volatility
        const overboughtCount = signals.filter(s => s.signal === 'overbought').length;
        const oversoldCount = signals.filter(s => s.signal === 'oversold').length;

        if (oversoldCount > 0) {
            this.signals.volatility = { direction: 'bullish', strength: 'moderate', signals: signals };
        } else if (overboughtCount > 0) {
            this.signals.volatility = { direction: 'bearish', strength: 'moderate', signals: signals };
        } else {
            this.signals.volatility = { direction: 'neutral', strength: 'weak', signals: signals };
        }
    }

    // Evaluate volume signals
    evaluateVolumeSignals() {
        const signals = [];

        // MFI
        if (this.indicators.MfiIndicator !== undefined) {
            const mfi = this.indicators.MfiIndicator;
            let signal = 'neutral';

            if (mfi > 80) signal = 'overbought';
            else if (mfi < 20) signal = 'oversold';
            else if (mfi > 60) signal = 'bullish';
            else if (mfi < 40) signal = 'bearish';

            signals.push({
                indicator: 'MFI',
                signal: signal,
                strength: signal === 'overbought' || signal === 'oversold' ? 'strong' : 'moderate',
                value: mfi
            });
        }

        // OBV
        if (this.indicators.ObvIndicator !== undefined) {
            const obv = this.indicators.ObvIndicator;
            signals.push({
                indicator: 'OBV',
                signal: 'volume_flow',
                strength: 'info',
                value: obv
            });
        }

        // Volume Profile
        if (this.indicators.VolumeProfile) {
            const vp = this.indicators.VolumeProfile;
            const volumeRatio = vp.bullishVolume / vp.bearishVolume;

            let signal = 'neutral';
            if (volumeRatio > 1.5) signal = 'bullish';
            else if (volumeRatio < 0.67) signal = 'bearish';

            signals.push({
                indicator: 'Volume Profile',
                signal: signal,
                strength: volumeRatio > 2 || volumeRatio < 0.5 ? 'strong' : 'moderate',
                value: volumeRatio
            });
        }

        // Determine overall volume
        const bullishCount = signals.filter(s => s.signal === 'bullish').length;
        const bearishCount = signals.filter(s => s.signal === 'bearish').length;

        if (bullishCount > bearishCount) {
            this.signals.volume = { direction: 'bullish', strength: 'moderate', signals: signals };
        } else if (bearishCount > bullishCount) {
            this.signals.volume = { direction: 'bearish', strength: 'moderate', signals: signals };
        } else {
            this.signals.volume = { direction: 'neutral', strength: 'weak', signals: signals };
        }
    }

    // Evaluate support/resistance signals
    evaluateSupportResistanceSignals() {
        const signals = [];

        // Pivot Points
        if (this.indicators.FloorPivots) {
            const pivots = this.indicators.FloorPivots.floor;
            signals.push({
                indicator: 'Floor Pivots',
                signal: 'support_resistance',
                strength: 'info',
                value: pivots
            });
        }

        // Ichimoku Cloud
        if (this.indicators.IchimokuCloudIndicator) {
            const ichimoku = this.indicators.IchimokuCloudIndicator;
            signals.push({
                indicator: 'Ichimoku Cloud',
                signal: 'support_resistance',
                strength: 'info',
                value: ichimoku
            });
        }

        this.signals.supportResistance = { direction: 'neutral', strength: 'info', signals: signals };
    }

    // Evaluate divergence signals
    evaluateDivergenceSignals() {
        if (this.indicators.MultiDivergenceDetector) {
            const divergence = this.indicators.MultiDivergenceDetector;
            this.signals.divergence = {
                direction: divergence.hasDivergence ? 'divergence_detected' : 'no_divergence',
                strength: divergence.hasDivergence ? 'strong' : 'weak',
                signals: [divergence]
            };
        } else {
            this.signals.divergence = { direction: 'no_data', strength: 'weak', signals: [] };
        }
    }

    // Evaluate static indicators based on current price
    evaluateStaticIndicators() {
        if (!this.currentPrice) {
            this.signals.staticIndicators = { direction: 'no_price', strength: 'weak', signals: [] };
            return;
        }

        const signals = [];

        // SuperTrend
        if (this.indicators.SuperTrendIndicator) {
            const superTrend = this.indicators.SuperTrendIndicator;
            let signal = 'neutral';
            let strength = 'strong';

            if (superTrend.trend === 'long' && this.currentPrice > superTrend.value) {
                signal = 'bullish';
            } else if (superTrend.trend === 'short' && this.currentPrice < superTrend.value) {
                signal = 'bearish';
            } else if (superTrend.trend === 'long' && this.currentPrice < superTrend.value) {
                signal = 'bearish_reversal';
                strength = 'very_strong';
            } else if (superTrend.trend === 'short' && this.currentPrice > superTrend.value) {
                signal = 'bullish_reversal';
                strength = 'very_strong';
            }

            signals.push({
                indicator: 'SuperTrend',
                signal: signal,
                strength: strength,
                value: superTrend.value,
                currentPrice: this.currentPrice,
                trend: superTrend.trend
            });
        }

        // Volume Profile
        if (this.indicators.VolumeProfile) {
            const vp = this.indicators.VolumeProfile;
            const volumeRatio = vp.bullishVolume / vp.bearishVolume;
            let signal = 'neutral';

            if (volumeRatio > 2) signal = 'strong_bullish_volume';
            else if (volumeRatio > 1.2) signal = 'bullish_volume';
            else if (volumeRatio < 0.5) signal = 'strong_bearish_volume';
            else if (volumeRatio < 0.83) signal = 'bearish_volume';

            signals.push({
                indicator: 'Volume Profile',
                signal: signal,
                strength: Math.abs(volumeRatio - 1) > 1 ? 'strong' : 'moderate',
                value: volumeRatio,
                bullishVolume: vp.bullishVolume,
                bearishVolume: vp.bearishVolume
            });
        }

        // Floor Pivots
        if (this.indicators.FloorPivots && this.indicators.FloorPivots.floor) {
            const pivots = this.indicators.FloorPivots.floor;
            let signal = 'neutral';
            let strength = 'moderate';

            if (this.currentPrice > pivots.r2) {
                signal = 'strong_resistance_break';
                strength = 'strong';
            } else if (this.currentPrice > pivots.r1) {
                signal = 'resistance_break';
            } else if (this.currentPrice < pivots.s2) {
                signal = 'strong_support_break';
                strength = 'strong';
            } else if (this.currentPrice < pivots.s1) {
                signal = 'support_break';
            } else if (this.currentPrice > pivots.pivot) {
                signal = 'above_pivot';
            } else {
                signal = 'below_pivot';
            }

            signals.push({
                indicator: 'Floor Pivots',
                signal: signal,
                strength: strength,
                value: pivots.pivot,
                currentPrice: this.currentPrice,
                levels: pivots
            });
        }

        // Woodies Pivots
        if (this.indicators.Woodies && this.indicators.Woodies.woodies) {
            const woodies = this.indicators.Woodies.woodies;
            let signal = 'neutral';
            let strength = 'moderate';

            if (this.currentPrice > woodies.r2) {
                signal = 'strong_resistance_break';
                strength = 'strong';
            } else if (this.currentPrice > woodies.r1) {
                signal = 'resistance_break';
            } else if (this.currentPrice < woodies.s2) {
                signal = 'strong_support_break';
                strength = 'strong';
            } else if (this.currentPrice < woodies.s1) {
                signal = 'support_break';
            } else if (this.currentPrice > woodies.pivot) {
                signal = 'above_pivot';
            } else {
                signal = 'below_pivot';
            }

            signals.push({
                indicator: 'Woodies Pivots',
                signal: signal,
                strength: strength,
                value: woodies.pivot,
                currentPrice: this.currentPrice,
                levels: woodies
            });
        }

        // Dynamic Grid Signals
        if (this.indicators.DynamicGridSignals) {
            const grid = this.indicators.DynamicGridSignals;
            let signal = 'neutral';
            let strength = 'moderate';
            let nearestLevel = null;
            let levelType = null;

            // Find nearest grid level
            const distances = grid.grid.map(level => ({
                level: level,
                distance: Math.abs(this.currentPrice - level)
            })).sort((a, b) => a.distance - b.distance);

            if (distances.length > 0) {
                nearestLevel = distances[0].level;
                const distance = distances[0].distance;
                const levelIndex = grid.grid.indexOf(nearestLevel);

                if (distance < grid.h * 0.001) { // Within 0.1% of level
                    levelType = 'at_level';
                    signal = 'consolidation';
                } else if (this.currentPrice > nearestLevel) {
                    levelType = 'above_level';
                    signal = levelIndex > grid.grid.length / 2 ? 'overbought_grid' : 'bullish_grid';
                } else {
                    levelType = 'below_level';
                    signal = levelIndex < grid.grid.length / 2 ? 'oversold_grid' : 'bearish_grid';
                }
            }

            signals.push({
                indicator: 'Dynamic Grid',
                signal: signal,
                strength: strength,
                value: nearestLevel,
                currentPrice: this.currentPrice,
                grid: grid.grid,
                nearestLevel: nearestLevel,
                levelType: levelType
            });
        }

        // Determine overall static indicators direction
        const bullishSignals = signals.filter(s =>
            s.signal.includes('bullish') ||
            s.signal.includes('above') ||
            s.signal.includes('break') && !s.signal.includes('support')
        ).length;

        const bearishSignals = signals.filter(s =>
            s.signal.includes('bearish') ||
            s.signal.includes('below') ||
            s.signal.includes('support_break')
        ).length;

        let overallDirection = 'neutral';
        let overallStrength = 'weak';

        if (bullishSignals > bearishSignals) {
            overallDirection = 'bullish';
            overallStrength = bullishSignals > signals.length / 2 ? 'strong' : 'moderate';
        } else if (bearishSignals > bullishSignals) {
            overallDirection = 'bearish';
            overallStrength = bearishSignals > signals.length / 2 ? 'strong' : 'moderate';
        }

        this.signals.staticIndicators = {
            direction: overallDirection,
            strength: overallStrength,
            signals: signals,
            currentPrice: this.currentPrice
        };
    }

    // Evaluate overall signal
    evaluateOverallSignal() {
        const directions = [
            this.signals.trend?.direction,
            this.signals.momentum?.direction,
            this.signals.volatility?.direction,
            this.signals.volume?.direction,
            this.signals.staticIndicators?.direction
        ].filter(d => d && d !== 'neutral');

        const bullishCount = directions.filter(d => d === 'bullish').length;
        const bearishCount = directions.filter(d => d === 'bearish').length;

        let overallDirection = 'neutral';
        let confidence = 'low';

        if (bullishCount >= 4) {
            overallDirection = 'very_strong_bullish';
            confidence = 'very_high';
        } else if (bullishCount === 3) {
            overallDirection = 'strong_bullish';
            confidence = 'high';
        } else if (bullishCount === 2) {
            overallDirection = 'bullish';
            confidence = 'moderate';
        } else if (bearishCount >= 4) {
            overallDirection = 'very_strong_bearish';
            confidence = 'very_high';
        } else if (bearishCount === 3) {
            overallDirection = 'strong_bearish';
            confidence = 'high';
        } else if (bearishCount === 2) {
            overallDirection = 'bearish';
            confidence = 'moderate';
        }

        // Check for divergence warnings
        const divergenceWarning = this.signals.divergence?.direction === 'divergence_detected';

        const recommendation = this.generateRecommendation(overallDirection, confidence, divergenceWarning);

        this.signals.overall = {
            direction: overallDirection,
            confidence: confidence,
            divergenceWarning: divergenceWarning,
            summary: recommendation
        };
    }

    // Generate trading recommendation
    generateRecommendation(direction, confidence, divergenceWarning) {
        const trend = this.signals.trend;
        const momentum = this.signals.momentum;
        const volatility = this.signals.volatility;
        const volume = this.signals.volume;
        const staticIndicators = this.signals.staticIndicators;

        let recommendation = '';

        if (direction.includes('bullish')) {
            const strength = direction.includes('very_strong') ? 'VERY STRONG' :
                           direction.includes('strong') ? 'STRONG' : 'MODERATE';
            recommendation += `📈 ${strength} BULLISH SIGNAL (${confidence} confidence)\n`;
            recommendation += 'Consider: Long position, Buy calls, Bullish options\n';
        } else if (direction.includes('bearish')) {
            const strength = direction.includes('very_strong') ? 'VERY STRONG' :
                           direction.includes('strong') ? 'STRONG' : 'MODERATE';
            recommendation += `📉 ${strength} BEARISH SIGNAL (${confidence} confidence)\n`;
            recommendation += 'Consider: Short position, Buy puts, Bearish options\n';
        } else {
            recommendation += `⚪ NEUTRAL SIGNAL\n`;
            recommendation += 'Consider: Wait for clearer signals, Range trading\n';
        }

        if (divergenceWarning) {
            recommendation += '⚠️  WARNING: Divergence detected - potential reversal\n';
        }

        recommendation += '\nSignal Breakdown:\n';
        recommendation += `Trend: ${trend?.direction || 'unknown'} (${trend?.strength || 'unknown'})\n`;
        recommendation += `Momentum: ${momentum?.direction || 'unknown'} (${momentum?.strength || 'unknown'})\n`;
        recommendation += `Volatility: ${volatility?.direction || 'unknown'} (${volatility?.strength || 'unknown'})\n`;
        recommendation += `Volume: ${volume?.direction || 'unknown'} (${volume?.strength || 'unknown'})\n`;
        recommendation += `Static Indicators: ${staticIndicators?.direction || 'unknown'} (${staticIndicators?.strength || 'unknown'})\n`;

        if (staticIndicators?.signals?.length > 0) {
            recommendation += '\nStatic Indicator Details:\n';
            staticIndicators.signals.forEach(signal => {
                recommendation += `- ${signal.indicator}: ${signal.signal} (${signal.strength})\n`;
            });
        }

        return recommendation;
    }

    // Get formatted analysis
    getAnalysis() {
        if (!this.signals.overall) {
            this.evaluateAllSignals();
        }

        return {
            timestamp: new Date().toISOString(),
            indicators: this.indicators,
            signals: this.signals,
            recommendation: this.signals.overall?.summary || 'No analysis available'
        };
    }

    // Print analysis to console
    printAnalysis() {
        const analysis = this.getAnalysis();
        console.log('\n' + '='.repeat(60));
        console.log('📊 TRADING STRATEGY ANALYSIS');
        console.log('='.repeat(60));
        console.log(analysis.recommendation);
        console.log('='.repeat(60));
    }
}

/*

Ok Now we can start thinking implementing our interactive trading bot and it will part of our CLI, 
the arguments to command will be symbol, interval, amount risk (stop-loss) reward (profit target) both are percentage value 
we want this to be interactive so well use blessed-contrib similar to combinations where we capture characters during runtime b is for buy s is for sell and a is to start an analysis 
that will use our implemented StrategyEvaluator to give us a recommendation based on the indicators we have implemented
We won't be implementing the trade entry just yet but we need to simulate it somehow so we can see how it would work in real time
'fetch https://github.com/tiagosiebler/bybit-api/tree/master?tab=readme-ov-file#documentation I am not asking you to implement the trade execution just yet but we will need to simulate it somehow so we can see how it would work in real time'
sure if we should simulate through test net? we should store the position in our db and then display the progress with every price change like how much in profit or loss
*/