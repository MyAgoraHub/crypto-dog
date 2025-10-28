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

    // Adjust grid based on screen size
    let gridRows = 12;
    let gridCols = 12;
    let headerRows = 2;
    let listRows = 8;
    let statusRows = 2;

    if (isVerySmallScreen) {
        gridRows = 10;
        gridCols = 10;
        headerRows = 1;
        listRows = 7;
        statusRows = 2;
    } else if (isSmallScreen) {
        gridRows = 12;
        gridCols = 10;
        headerRows = 2;
        listRows = 8;
        statusRows = 2;
    }

    // Create grid layout for selection screen
    const grid = new contrib.grid({rows: gridRows, cols: gridCols, screen: screen});

    // Header - adjust content for small screens
    const headerLabel = isSmallScreen ? 'Combinations' : 'Signal Combinations Menu';
    const headerLog = grid.set(0, 0, headerRows, gridCols, contrib.log, {
        fg: 'cyan',
        selectedFg: 'cyan',
        label: headerLabel,
        border: isSmallScreen ? undefined : {type: "line", fg: 'cyan'}
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
        keys: true
    });

    // Status bar
    const statusBar = grid.set(headerRows + listRows, 0, statusRows, gridCols, contrib.log, {
        fg: "green",
        selectedFg: "green",
        label: isSmallScreen ? 'Status' : 'Status'
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

    // Adjust grid based on screen size
    let gridRows = 12;
    let gridCols = 12;
    let headerRows = 2;
    let logRows = 8;
    let statusRows = 2;

    if (isVerySmallScreen) {
        gridRows = 10;
        gridCols = 10;
        headerRows = 1;
        logRows = 7;
        statusRows = 2;
    } else if (isSmallScreen) {
        gridRows = 12;
        gridCols = 10;
        headerRows = 2;
        logRows = 8;
        statusRows = 2;
    }

    // Create grid layout for monitoring
    const monitorGrid = new contrib.grid({rows: gridRows, cols: gridCols, screen: screen});

    // Header with selected combination info - adjust for small screens
    const headerLabel = isSmallScreen ? selectedCombo.name.substring(0, 15) : `Live Monitor: ${selectedCombo.name}`;
    const headerLog = monitorGrid.set(0, 0, headerRows, gridCols, contrib.log, {
        fg: 'cyan',
        selectedFg: 'cyan',
        label: headerLabel,
        border: isSmallScreen ? undefined : {type: "line", fg: 'cyan'}
    });

    // Signal log - main display area
    const logLabel = isSmallScreen ? 'Signals' : 'Signal Feed';
    const signalLog = monitorGrid.set(headerRows, 0, logRows, gridCols, contrib.log, {
        fg: 'white',
        selectedFg: 'white',
        label: logLabel,
        border: isSmallScreen ? undefined : {type: "line", fg: 'green'},
        tags: true,
        scrollback: isSmallScreen ? 50 : 100
    });

    // Status bar
    const statusBar = monitorGrid.set(headerRows + logRows, 0, statusRows, gridCols, contrib.log, {
        fg: "green",
        selectedFg: "green",
        label: 'Status'
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

            if (currentCombo) {
                const timestamp = new Date().toLocaleTimeString();
                const signalColor = getSignalColor(currentCombo.signal);

                // Format signal line based on screen size
                let signalLine;
                if (isVerySmallScreen) {
                    signalLine = `${timestamp.split(':').slice(0,2).join(':')} | {${signalColor}-fg}${currentCombo.signal}{/${signalColor}-fg}`;
                } else if (isSmallScreen) {
                    signalLine = `${timestamp} | {${signalColor}-fg}${currentCombo.signal}{/${signalColor}-fg} | ${currentCombo.details.substring(0, 30)}...`;
                } else {
                    signalLine = `${timestamp} | {${signalColor}-fg}${currentCombo.signal}{/${signalColor}-fg} | ${currentCombo.details}`;
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
