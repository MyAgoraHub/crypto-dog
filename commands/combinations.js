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

    // Create grid layout for selection screen
    const grid = new contrib.grid({rows: 12, cols: 12, screen: screen});

    // Header
    const headerLog = grid.set(0, 0, 2, 12, contrib.log, {
        fg: 'cyan',
        selectedFg: 'cyan',
        label: `Signal Combinations Menu`,
        border: {type: "line", fg: 'cyan'}
    });

    // Combinations list
    const combinationsList = grid.set(2, 0, 8, 12, blessed.list, {
        fg: 'white',
        selectedFg: 'black',
        selectedBg: 'cyan',
        label: 'Select a Combination to Monitor',
        border: {type: "line", fg: 'green'},
        scrollable: true,
        invertSelected: true,
        mouse: true,
        keys: true
    });

    // Status bar
    const statusBar = grid.set(10, 0, 2, 12, contrib.log, {
        fg: "green",
        selectedFg: "green",
        label: 'Status'
    });

    // Initialize header
    headerLog.log(`📊 Available Trading Signal Combinations`);
    headerLog.log(`Symbol: ${options.symbol} | Interval: ${options.interval}`);
    headerLog.log(`─`.repeat(60));

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

    // Populate the list
    const comboNames = combinations.map((combo, index) =>
        `${index + 1}. ${combo.name} (${combo.strategy})`
    );
    combinationsList.setItems(comboNames);

    statusBar.setContent(`↑↓ to navigate | Enter to select | Esc to exit`);
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

    // Create grid layout for monitoring
    const monitorGrid = new contrib.grid({rows: 12, cols: 12, screen: screen});

    // Header with selected combination info
    const headerLog = monitorGrid.set(0, 0, 2, 12, contrib.log, {
        fg: 'cyan',
        selectedFg: 'cyan',
        label: `Live Monitor: ${selectedCombo.name}`,
        border: {type: "line", fg: 'cyan'}
    });

    // Signal log - main display area
    const signalLog = monitorGrid.set(2, 0, 8, 12, contrib.log, {
        fg: 'white',
        selectedFg: 'white',
        label: `Signal Feed`,
        border: {type: "line", fg: 'green'},
        tags: true,
        scrollback: 100
    });

    // Status bar
    const statusBar = monitorGrid.set(10, 0, 2, 12, contrib.log, {
        fg: "green",
        selectedFg: "green",
        label: 'Status'
    });

    // Initialize header
    headerLog.log(`🎯 Monitoring: ${selectedCombo.name}`);
    headerLog.log(`Strategy: ${selectedCombo.strategy} | Symbol: ${symbol} | Interval: ${interval}`);
    headerLog.log(`─`.repeat(60));

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

                // Only log if signal changed or every 10th update
                if (currentCombo.signal !== lastSignal || signalCount % 10 === 0) {
                    const signalLine = `${timestamp} | {${signalColor}-fg}${currentCombo.signal}{/${signalColor}-fg} | ${currentCombo.details}`;
                    signalLog.log(signalLine);
                    lastSignal = currentCombo.signal;
                }

                signalCount++;

                // Update status every 5 signals
                if (signalCount % 5 === 0) {
                    statusBar.setContent(`✅ Active | Signals: ${signalCount} | Current: ${currentCombo.signal}\nLast Update: ${timestamp}`);
                    screen.render();
                }
            }
        } catch (error) {
            signalLog.log(`{red-fg}Error updating signals: ${error.message}{/red-fg}`);
        }
    }

    // Start real-time feed
    statusBar.setContent(`🔄 Starting real-time feed...`);
    screen.render();

    try {
        await agent.startRealTimeKlineFeed(interval, symbol);

        // Override processData to update our UI
        agent.processData = function() {
            updateSignals();
        };

        // Initial update
        updateSignals();

        statusBar.setContent(`🟢 Live monitoring active | Press 'b' for menu | Esc to exit`);
        screen.render();

    } catch (error) {
        statusBar.setContent(`❌ Error starting feed: ${error.message}`);
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
