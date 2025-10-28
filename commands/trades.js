import chalk from 'chalk';
import blessed from 'blessed';
import contrib from 'blessed-contrib';

export function registerTradesCommand(program) {
    program
        .command('trades')
        .description('Display live trade feed with price movement indicators')
        .option('-s, --symbol <symbol>', 'Trading symbol (default: BTCUSDT)', 'BTCUSDT')
        .action(async (options) => {
            console.log(chalk.cyan(`\n📈 Starting Live Trade Feed for ${options.symbol}`));
            console.log(chalk.gray(`Press Ctrl+C to exit\n`));

            // Create blessed screen for trades display
            const screen = blessed.screen({
                smartCSR: true,
                title: `CryptoDog Live Trades - ${options.symbol}`
            });

            // Create grid layout
            const grid = new contrib.grid({rows: 12, cols: 12, screen: screen});

            // Header log
            const headerLog = grid.set(0, 0, 1, 12, contrib.log, {
                fg: 'cyan',
                selectedFg: 'cyan',
                label: `Live Trades - ${options.symbol}`,
                border: {type: "line", fg: 'cyan'}
            });

            // Trades log - main display area
            const tradesLog = grid.set(1, 0, 9, 12, contrib.log, {
                fg: 'white',
                selectedFg: 'white',
                label: `Trade Feed`,
                border: {type: "line", fg: 'green'},
                tags: true,
                scrollback: 100
            });

            // Status bar
            const statusBar = grid.set(10, 0, 2, 12, contrib.log, {
                fg: "green",
                selectedFg: "green",
                label: 'Status'
            });

            // Initialize
            headerLog.log(`🔴 Connecting to ${options.symbol} trade stream...`);
            headerLog.log(`─`.repeat(60));

            let lastPrice = null;
            let tradeCount = 0;

            // Create WebSocket handler for trades
            const { CryptoDogWebSocketHandler } = await import('../core/clients/cryptoDogWebsocketHandler.js');
            const wsHandler = new CryptoDogWebSocketHandler({
                testnet: false,
                throttleMs: 100  // Faster updates for trades
            });

            // Subscribe to public trades
            const tradeTopic = `publicTrade.${options.symbol}`;
            statusBar.setContent(`Subscribing to: ${tradeTopic}`);
            screen.render();
            wsHandler.subscribeToTopics([tradeTopic], 'spot');

            // Handle trade updates
            wsHandler.onUpdate((data) => {
                if (data.topic === tradeTopic && data.data) {
                    data.data.forEach(trade => {
                        const price = parseFloat(trade.p); // 'p' is price in Bybit API
                        const quantity = parseFloat(trade.v); // 'v' is volume/size in Bybit API
                        const timestamp = new Date(trade.T).toLocaleTimeString(); // 'T' is timestamp in Bybit API
                        const side = trade.S; // 'S' is side in Bybit API

                        // Skip invalid trades
                        if (isNaN(price) || price <= 0 || isNaN(quantity) || quantity <= 0) {
                            return;
                        }

                        // Determine price movement
                        let priceIndicator = '';
                        let priceColor = 'yellow';

                        if (lastPrice !== null && !isNaN(lastPrice)) {
                            if (price > lastPrice) {
                                priceIndicator = '▲';
                                priceColor = 'green';
                            } else if (price < lastPrice) {
                                priceIndicator = '▼';
                                priceColor = 'red';
                            } else {
                                priceIndicator = '→';
                                priceColor = 'yellow';
                            }
                        } else {
                            priceIndicator = '●';
                            priceColor = 'cyan';
                        }

                        lastPrice = price;
                        tradeCount++;

                        // Format trade line with colors
                        const sideColor = side === 'Buy' ? '{green-fg}' : '{red-fg}';
                        const sideColorEnd = side === 'Buy' ? '{/green-fg}' : '{/red-fg}';

                        let priceIndicatorColored = '';
                        if (priceIndicator === '▲') {
                            priceIndicatorColored = '{green-fg}▲{/green-fg}';
                        } else if (priceIndicator === '▼') {
                            priceIndicatorColored = '{red-fg}▼{/red-fg}';
                        } else if (priceIndicator === '→') {
                            priceIndicatorColored = '{yellow-fg}→{/yellow-fg}';
                        } else if (priceIndicator === '●') {
                            priceIndicatorColored = '{cyan-fg}●{/cyan-fg}';
                        }

                        const tradeLine = `${timestamp} ${priceIndicatorColored} $${price.toFixed(2)} | ${quantity.toFixed(4)} ${options.symbol.replace('USDT', '')} | ${sideColor}${side}${sideColorEnd}`;

                        // Add to trades log (throttle updates to prevent corruption)
                        // Only log trades when price actually changes to reduce clutter
                        if (priceIndicator !== '→') {
                            tradesLog.log(tradeLine);
                        } else if (tradeCount % 10 === 0) {  // Occasionally log same-price trades for activity indication
                            tradesLog.log(tradeLine);
                        }

                        // Update status (less frequent updates)
                        if (tradeCount % 20 === 0) {
                            statusBar.setContent(`✅ Connected | Trades: ${tradeCount} | Last: $${price.toFixed(2)} (${side})\nLegend: ▲ Price Up | ▼ Price Down | → Same Price | ● Initial`);
                            screen.render();
                        }
                    });
                }
            });

            // Handle connection events
            wsHandler.onOpen(() => {
                headerLog.log(`🟢 Connected to ${options.symbol} trade stream`);
                statusBar.setContent(`WebSocket connected successfully`);
                screen.render();
            });

            wsHandler.onClose(() => {
                headerLog.log(`🔴 Disconnected from trade stream`);
                statusBar.setContent(`Connection closed`);
                screen.render();
            });

            wsHandler.onException((error) => {
                headerLog.log(`❌ WebSocket error: ${error.message}`);
                statusBar.setContent(`Error: ${error.message}`);
                screen.render();
            });

            // Key bindings
            screen.key(['escape', 'q', 'C-c'], function(ch, key) {
                statusBar.log('Shutting down trade feed...');
                setTimeout(() => {
                    screen.destroy();
                    process.exit(0);
                }, 1000);
            });

            screen.key(['c'], function(ch, key) {
                tradesLog.setContent(''); // Clear trades log
                tradeCount = 0;
                statusBar.log('Trade feed cleared');
            });

            // Render the screen
            screen.render();
        });
}
