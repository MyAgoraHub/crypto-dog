import chalk from 'chalk';
import blessed from 'blessed';
import contrib from 'blessed-contrib';

export function registerCombinationsCommand(program) {
    program
        .command('combinations')
        .description('Interactive trading signal combinations monitor')
        .option('-s, --symbol <symbol>', 'Trading symbol (default: BTCUSDT)', 'BTCUSDT')
        .option('-i, --interval <interval>', 'Time interval (default: 1h)', '1h')
        .action(async (options) => {
            await showCombinationSelector(options);
        });
}

async function showCombinationSelector(options) {
    console.log(chalk.cyan(`\n🎯 Starting Interactive Trading Signal Combinations`));
    console.log(chalk.gray(`Symbol: ${options.symbol} | Interval: ${options.interval}`));
    console.log(chalk.gray(`Press Ctrl+C to exit\n`));

    // Create blessed screen for combinations selection
    const screen = blessed.screen({
        smartCSR: true,
        title: `CryptoDog Signal Combinations - ${options.symbol}`
    });

    // Detect screen size for responsive layout
    const screenWidth = screen.width || 80;
    const screenHeight = screen.height || 24;
    const isSmallScreen = screenWidth < 80 || screenHeight < 20;
    const isVerySmallScreen = screenWidth < 60 || screenHeight < 15;

    // Adjust grid based on screen size - use more columns to utilize full width
    let gridRows = 12;
    let gridCols = Math.floor(screenWidth / 3); // Use more columns - 1/3 of screen width
    let headerRows = 2;
    let listRows = 8;
    let statusRows = 2;

    if (isVerySmallScreen) {
        gridRows = 10;
        gridCols = Math.max(30, Math.floor(screenWidth / 2)); // Even more columns for very small screens
        headerRows = 1;
        listRows = 7;
        statusRows = 2;
    } else if (isSmallScreen) {
        gridRows = 12;
        gridCols = Math.max(25, Math.floor(screenWidth / 3)); // More columns for small screens
        headerRows = 2;
        listRows = 8;
        statusRows = 2;
    } else {
        // For normal/large screens, use many more columns
        gridCols = Math.max(30, Math.floor(screenWidth / 2));
    }

    // Create grid layout for selection screen
    const grid = new contrib.grid({rows: gridRows, cols: gridCols, screen: screen});

    // Header - adjust content for small screens
    const headerLabel = isSmallScreen ? 'Combinations' : 'Signal Combinations Menu';
    const headerLog = grid.set(0, 0, headerRows, gridCols, contrib.log, {
        fg: 'cyan',
        selectedFg: 'cyan',
        label: headerLabel,
        border: isSmallScreen ? undefined : {type: "line", fg: 'cyan'},
        width: '100%'
    });

    // Combinations list
    const listLabel = isSmallScreen ? 'Select Combination' : 'Select a Combination to Monitor';
    const combinationsList = grid.set(headerRows, 0, listRows, gridCols, blessed.list, {
        fg: 'white',
        selectedFg: 'black',
        selectedBg: 'cyan',
        label: listLabel,
        border: isSmallScreen ? undefined : {type: "line", fg: 'green'},
        scrollable: true,
        invertSelected: true,
        mouse: true,
        keys: true,
        width: '100%'
    });

    // Status bar
    const statusBar = grid.set(headerRows + listRows, 0, statusRows, gridCols, contrib.log, {
        fg: "green",
        selectedFg: "green",
        label: isSmallScreen ? 'Status' : 'Status',
        width: '100%'
    });

    // Initialize header - adjust content for small screens
    if (isVerySmallScreen) {
        headerLog.log(`📊 Combinations`);
        headerLog.log(`${options.symbol} ${options.interval}`);
    } else if (isSmallScreen) {
        headerLog.log(`📊 Trading Combinations`);
        headerLog.log(`${options.symbol} | ${options.interval}`);
    } else {
        headerLog.log(`📊 Available Trading Signal Combinations`);
        headerLog.log(`Symbol: ${options.symbol} | Interval: ${options.interval}`);
        headerLog.log(`─`.repeat(Math.min(40, screenWidth - 10)));
    }

    // Get available combinations
    const { CryptoDogCombinationsAgent } = await import('../core/cryptoDogCombinations.js');
    const agent = new CryptoDogCombinationsAgent();

    // Load initial data to get combination names
    const { getKlineCandles, getInterval } = await import('../core/clients/cryptoDogRequestHandler.js');
    const intervalValue = getInterval(options.interval).value;
    const ohlcv = await getKlineCandles('spot', options.symbol, intervalValue, null, null, 201);

    if (!ohlcv || !ohlcv.result || !ohlcv.result.list) {
        statusBar.setContent(chalk.red(`Failed to fetch data: ${ohlcv?.retMsg || 'Unknown error'}`));
        screen.render();
        setTimeout(() => screen.destroy(), 3000);
        return;
    }

    agent.klineData = ohlcv.result.list.reverse();
    const combinations = agent.processSignalCombinations();

    // Populate the list - adjust formatting for small screens
    const comboNames = combinations.map((combo, index) => {
        if (isVerySmallScreen) {
            return `${index + 1}. ${combo.name.split(' + ')[0]}...`;
        } else if (isSmallScreen) {
            return `${index + 1}. ${combo.name}`;
        } else {
            return `${index + 1}. ${combo.name} (${combo.strategy})`;
        }
    });
    combinationsList.setItems(comboNames);

    // Adjust status message for small screens
    const statusMsg = isSmallScreen
        ? '↑↓ Enter Esc'
        : '↑↓ to navigate | Enter to select | Esc to exit';
    statusBar.setContent(statusMsg);
    screen.render();

    // Handle selection
    combinationsList.on('select', async function(item, index) {
        const selectedCombo = combinations[index];
        screen.destroy();
        await startLiveCombinationMonitor(selectedCombo, options.symbol, options.interval, agent);
    });

    // Key bindings
    screen.key(['escape', 'q', 'C-c'], function(ch, key) {
        screen.destroy();
        process.exit(0);
    });

    // Focus on the list
    combinationsList.focus();
    screen.render();
}

async function startLiveCombinationMonitor(selectedCombo, symbol, interval, agent) {
    // Create blessed screen for live monitoring
    const screen = blessed.screen({
        smartCSR: true,
        title: `CryptoDog - ${selectedCombo.name}`
    });

    // Detect screen size for responsive layout
    const screenWidth = screen.width || 80;
    const screenHeight = screen.height || 24;
    const isSmallScreen = screenWidth < 80 || screenHeight < 20;
    const isVerySmallScreen = screenWidth < 60 || screenHeight < 15;

    // Adjust grid based on screen size - use more columns to utilize full width
    let gridRows = 12;
    let gridCols = Math.floor(screenWidth / 3); // Use more columns - 1/3 of screen width
    let headerRows = 2;
    let logRows = 8;
    let statusRows = 2;

    if (isVerySmallScreen) {
        gridRows = 10;
        gridCols = Math.max(30, Math.floor(screenWidth / 2)); // Even more columns for very small screens
        headerRows = 1;
        logRows = 7;
        statusRows = 2;
    } else if (isSmallScreen) {
        gridRows = 12;
        gridCols = Math.max(25, Math.floor(screenWidth / 3)); // More columns for small screens
        headerRows = 2;
        logRows = 8;
        statusRows = 2;
    } else {
        // For normal/large screens, use many more columns
        gridCols = Math.max(30, Math.floor(screenWidth / 2));
    }

    // Create grid layout for monitoring
    const monitorGrid = new contrib.grid({rows: gridRows, cols: gridCols, screen: screen});

    // Header with selected combination info - adjust for small screens
    const headerLabel = isSmallScreen ? selectedCombo.name.substring(0, 15) : `Live Monitor: ${selectedCombo.name}`;
    const headerLog = monitorGrid.set(0, 0, headerRows, gridCols, contrib.log, {
        fg: 'cyan',
        selectedFg: 'cyan',
        label: headerLabel,
        border: isSmallScreen ? undefined : {type: "line", fg: 'cyan'},
        width: '100%'
    });

    // Signal log - main display area
    const logLabel = isSmallScreen ? 'Signals' : 'Signal Feed';
    const signalLog = monitorGrid.set(headerRows, 0, logRows, gridCols, contrib.log, {
        fg: 'white',
        selectedFg: 'white',
        label: logLabel,
        border: isSmallScreen ? undefined : {type: "line", fg: 'green'},
        tags: true,
        scrollback: isSmallScreen ? 50 : 100,
        width: '100%'
    });

    // Status bar
    const statusBar = monitorGrid.set(headerRows + logRows, 0, statusRows, gridCols, contrib.log, {
        fg: "green",
        selectedFg: "green",
        label: 'Status',
        width: '100%'
    });

    // Initialize header - adjust content for small screens
    if (isVerySmallScreen) {
        headerLog.log(`🎯 ${selectedCombo.name.substring(0, 12)}`);
        headerLog.log(`${symbol} ${interval}`);
    } else if (isSmallScreen) {
        headerLog.log(`🎯 ${selectedCombo.name}`);
        headerLog.log(`${selectedCombo.strategy} | ${symbol} ${interval}`);
    } else {
        headerLog.log(`🎯 Monitoring: ${selectedCombo.name}`);
        headerLog.log(`Strategy: ${selectedCombo.strategy} | Symbol: ${symbol} | Interval: ${interval}`);
        headerLog.log(`─`.repeat(Math.min(40, screenWidth - 10)));
    }

    let signalCount = 0;
    let lastSignal = '';

    // Function to update signals
    function updateSignals() {
        try {
            const combinations = agent.processSignalCombinations();
            const currentCombo = combinations.find(c => c.name === selectedCombo.name);
            const indicatorValues = agent.getCurrentIndicatorValues();

            if (currentCombo && indicatorValues) {
                const timestamp = new Date().toLocaleTimeString();
                const signalColor = getSignalColor(currentCombo.signal);

                // Create detailed indicator display based on combination type
                let indicatorDetails = getIndicatorDetailsForCombination(currentCombo.name, indicatorValues);

                // Format signal line based on screen size - optimize for better space usage
                let signalLine;
                const maxLineLength = gridCols * 8; // Approximate characters per line (increased)
                
                if (isVerySmallScreen) {
                    // For very small screens, keep it simple but show key info
                    const shortDetails = indicatorDetails.length > 35 ? 
                        indicatorDetails.substring(0, 32) + '...' : indicatorDetails;
                    signalLine = `${timestamp.split(':').slice(0,2).join(':')} {${signalColor}-fg}${currentCombo.signal}{/${signalColor}-fg} | ${shortDetails}`;
                } else if (isSmallScreen) {
                    // For small screens, try to fit on one line, truncate if needed
                    const fullLine = `${timestamp} {${signalColor}-fg}${currentCombo.signal}{/${signalColor}-fg} | ${indicatorDetails}`;
                    if (fullLine.length > maxLineLength) {
                        // Truncate smartly
                        const availableForDetails = maxLineLength - timestamp.length - currentCombo.signal.length - 10;
                        const truncatedDetails = indicatorDetails.substring(0, availableForDetails) + '...';
                        signalLine = `${timestamp} {${signalColor}-fg}${currentCombo.signal}{/${signalColor}-fg} | ${truncatedDetails}`;
                    } else {
                        signalLine = fullLine;
                    }
                } else {
                    // For normal/large screens, show full details
                    signalLine = `${timestamp} | {${signalColor}-fg}${currentCombo.signal}{/${signalColor}-fg} | ${indicatorDetails}`;
                }

                // Only log if signal changed or every 10th update
                if (currentCombo.signal !== lastSignal || signalCount % 10 === 0) {
                    signalLog.log(signalLine);
                    lastSignal = currentCombo.signal;
                }

                signalCount++;

                // Update status every 5 signals - adjust message for small screens
                if (signalCount % 5 === 0) {
                    let statusMsg;
                    if (isVerySmallScreen) {
                        statusMsg = `✅ ${signalCount} | ${currentCombo.signal}`;
                    } else if (isSmallScreen) {
                        statusMsg = `✅ Active | ${signalCount} signals | ${currentCombo.signal}`;
                    } else {
                        statusMsg = `✅ Active | Signals: ${signalCount} | Current: ${currentCombo.signal}\nLast Update: ${timestamp}`;
                    }
                    statusBar.setContent(statusMsg);
                    screen.render();
                }
            }
        } catch (error) {
            const errorMsg = isSmallScreen ? `❌ Error` : `{red-fg}Error updating signals: ${error.message}{/red-fg}`;
            signalLog.log(errorMsg);
        }
    }

    // Start real-time feed
    const initialStatus = isSmallScreen
        ? `🔄 Starting...`
        : `🔄 Starting real-time feed...`;
    statusBar.setContent(initialStatus);
    screen.render();

    try {
        await agent.startRealTimeKlineFeed(interval, symbol);

        // Override processData to update our UI
        agent.processData = function() {
            updateSignals();
        };

        // Initial update
        updateSignals();

        const activeStatus = isSmallScreen
            ? `🟢 Active | 'b'=menu Esc=exit`
            : `🟢 Live monitoring active | Press 'b' for menu | Esc to exit`;
        statusBar.setContent(activeStatus);
        screen.render();

    } catch (error) {
        const errorStatus = isSmallScreen
            ? `❌ Error`
            : `❌ Error starting feed: ${error.message}`;
        statusBar.setContent(errorStatus);
        screen.render();
        setTimeout(() => screen.destroy(), 3000);
        return;
    }

    // Key bindings for monitor screen
    screen.key(['escape', 'q', 'C-c'], function(ch, key) {
        statusBar.setContent('Shutting down...');
        setTimeout(() => {
            screen.destroy();
            process.exit(0);
        }, 1000);
    });

    screen.key(['b', 'backspace'], function(ch, key) {
        // Go back to selection menu
        screen.destroy();
        // Re-run the selector
        setTimeout(() => showCombinationSelector({symbol, interval}), 100);
    });

    screen.key(['c'], function(ch, key) {
        signalLog.setContent(''); // Clear signal log
        signalCount = 0;
        statusBar.setContent('Signal feed cleared');
    });

    screen.render();
}

function getSignalColor(signal) {
    if (signal.includes('BUY') || signal.includes('LONG') || signal.includes('BULLISH')) {
        return 'green';
    } else if (signal.includes('SELL') || signal.includes('SHORT') || signal.includes('BEARISH')) {
        return 'red';
    } else if (signal.includes('NEUTRAL')) {
        return 'yellow';
    } else {
        return 'cyan';
    }
}

function getIndicatorDetailsForCombination(comboName, indicators) {
    const formatValue = (val, decimals = 2) => val !== null && val !== undefined && typeof val === 'number' ? val.toFixed(decimals) : 'N/A';
    
    if (comboName.includes('MACD + RSI + EMA')) {
        return `MACD: ${formatValue(indicators.macd?.MACD)}/${formatValue(indicators.macd?.signal)} | RSI: ${formatValue(indicators.rsi)} | EMA: ${formatValue(indicators.emaFast)}`;
    }
    
    if (comboName.includes('Stochastic + RSI + Williams')) {
        return `Stoch K: ${formatValue(indicators.stochastic?.k)} D: ${formatValue(indicators.stochastic?.d)} | RSI: ${formatValue(indicators.rsi)} | Williams: ${formatValue(indicators.williamsR)}`;
    }
    
    if (comboName.includes('Bollinger Bands + RSI + Volume')) {
        return `BB Upper: ${formatValue(indicators.bollinger?.upper)} Lower: ${formatValue(indicators.bollinger?.lower)} | RSI: ${formatValue(indicators.rsi)}`;
    }
    
    if (comboName.includes('ADX + SuperTrend + ATR')) {
        return `ADX: ${formatValue(indicators.adx)} | SuperTrend: ${formatValue(indicators.superTrend)} | ATR: ${formatValue(indicators.atr)}`;
    }
    
    if (comboName.includes('Ichimoku + RSI + MACD')) {
        return `Tenkan: ${formatValue(indicators.ichimoku?.conversionPeriod)} Kijun: ${formatValue(indicators.ichimoku?.base)} | RSI: ${formatValue(indicators.rsi)} | MACD: ${formatValue(indicators.macd?.MACD)}`;
    }
    
    if (comboName.includes('VWAP + Bollinger Bands + MACD')) {
        return `VWAP: ${formatValue(indicators.vwap)} | BB Mid: ${formatValue(indicators.bollinger?.middle)} | MACD: ${formatValue(indicators.macd?.MACD)}`;
    }
    
    if (comboName.includes('Support/Resistance + ADX + Stochastic')) {
        return `ADX: ${formatValue(indicators.adx)} | Stoch K: ${formatValue(indicators.stochastic?.k)} | Price: ${formatValue(indicators.price)}`;
    }
    
    if (comboName.includes('Volume Profile + RSI + EMA')) {
        return `RSI: ${formatValue(indicators.rsi)} | EMA: ${formatValue(indicators.emaFast)} | MFI: ${formatValue(indicators.mfi)}`;
    }
    
    if (comboName.includes('Pivot Points + SuperTrend + ATR')) {
        return `SuperTrend: ${formatValue(indicators.superTrend)} | ATR: ${formatValue(indicators.atr)} | Price: ${formatValue(indicators.price)}`;
    }
    
    if (comboName.includes('Fibonacci + RSI + Volume')) {
        return `RSI: ${formatValue(indicators.rsi)} | Price: ${formatValue(indicators.price)} | MFI: ${formatValue(indicators.mfi)}`;
    }
    
    if (comboName.includes('Moving Average Crossover + RSI + Volume')) {
        return `EMA Fast: ${formatValue(indicators.emaFast)} Slow: ${formatValue(indicators.emaSlow)} | RSI: ${formatValue(indicators.rsi)}`;
    }
    
    if (comboName.includes('Parabolic SAR + RSI + MACD')) {
        return `RSI: ${formatValue(indicators.rsi)} | MACD: ${formatValue(indicators.macd?.MACD)} | Price: ${formatValue(indicators.price)}`;
    }
    
    if (comboName.includes('CCI + RSI + Bollinger Bands')) {
        return `RSI: ${formatValue(indicators.rsi)} | BB Upper: ${formatValue(indicators.bollinger?.upper)} | Price: ${formatValue(indicators.price)}`;
    }
    
    if (comboName.includes('Engulfing Patterns + Support/Resistance + Volume')) {
        return `MFI: ${formatValue(indicators.mfi)} | OBV: ${formatValue(indicators.obv)} | Price: ${formatValue(indicators.price)}`;
    }
    
    if (comboName.includes('Pin Bars + Trend Lines + RSI')) {
        return `RSI: ${formatValue(indicators.rsi)} | EMA: ${formatValue(indicators.emaFast)} | Price: ${formatValue(indicators.price)}`;
    }
    
    if (comboName.includes('Elder Impulse + MACD + Stochastic')) {
        return `MACD: ${formatValue(indicators.macd?.MACD)} | Stoch K: ${formatValue(indicators.stochastic?.k)} | EMA: ${formatValue(indicators.emaFast)}`;
    }
    
    if (comboName.includes('Keltner Channels + RSI + Volume')) {
        return `RSI: ${formatValue(indicators.rsi)} | ATR: ${formatValue(indicators.atr)} | MFI: ${formatValue(indicators.mfi)}`;
    }
    
    if (comboName.includes('Donchian Channels + ADX + ATR')) {
        return `ADX: ${formatValue(indicators.adx)} | ATR: ${formatValue(indicators.atr)} | Price: ${formatValue(indicators.price)}`;
    }
    
    if (comboName.includes('Inside Bars + Breakout + Volume')) {
        return `ATR: ${formatValue(indicators.atr)} | MFI: ${formatValue(indicators.mfi)} | Price: ${formatValue(indicators.price)}`;
    }
    
    if (comboName.includes('Heikin Ashi + RSI + EMA')) {
        return `RSI: ${formatValue(indicators.rsi)} | EMA: ${formatValue(indicators.emaFast)} | Price: ${formatValue(indicators.price)}`;
    }
    
    if (comboName.includes('Predictive Analytics')) {
        return `Price: ${formatValue(indicators.price)} | RSI: ${formatValue(indicators.rsi)} | MACD: ${formatValue(indicators.macd?.MACD)} | Volume: ${formatValue(indicators.mfi)}`;
    }
    
    // Default fallback
    return `Price: ${formatValue(indicators.price)} | RSI: ${formatValue(indicators.rsi)} | MACD: ${formatValue(indicators.macd?.MACD)}`;
}
