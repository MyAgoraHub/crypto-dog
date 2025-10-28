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

            // Detect screen size for responsive layout
            const screenWidth = screen.width || 80;
            const screenHeight = screen.height || 24;
            const isSmallScreen = screenWidth < 80 || screenHeight < 20;
            const isVerySmallScreen = screenWidth < 60 || screenHeight < 15;

            // Adjust grid based on screen size
            let gridRows = 12;
            let gridCols = 12;
            let headerRows = 1;
            let logRows = 9;
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
                headerRows = 1;
                logRows = 9;
                statusRows = 2;
            }

            // Create grid layout
            const grid = new contrib.grid({rows: gridRows, cols: gridCols, screen: screen});

            // Header log - adjust for small screens
            const headerLabel = isSmallScreen ? `Trades ${options.symbol}` : `Live Trades - ${options.symbol}`;
            const headerLog = grid.set(0, 0, headerRows, gridCols, contrib.log, {
                fg: 'cyan',
                selectedFg: 'cyan',
                label: headerLabel,
                border: isSmallScreen ? undefined : {type: "line", fg: 'cyan'}
            });

            // Trades log - main display area
            const tradesLogLabel = isSmallScreen ? 'Trade Feed' : 'Trade Feed';
            const tradesLog = grid.set(headerRows, 0, logRows, gridCols, contrib.log, {
                fg: 'white',
                selectedFg: 'white',
                label: tradesLogLabel,
                border: isSmallScreen ? undefined : {type: "line", fg: 'green'},
                tags: true,
                scrollback: isSmallScreen ? 50 : 100
            });

            // Status bar
            const statusBar = grid.set(headerRows + logRows, 0, statusRows, gridCols, contrib.log, {
                fg: "green",
                selectedFg: "green",
                label: 'Status'
            });

            // Initialize - adjust for small screens
            if (isSmallScreen) {
                headerLog.log(`🔴 Connecting...`);
            } else {
                headerLog.log(`🔴 Connecting to ${options.symbol} trade stream...`);
                headerLog.log(`─`.repeat(Math.min(40, screenWidth - 10)));
            }

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
            const subscribeMsg = isSmallScreen ? `Subscribing...` : `Subscribing to: ${tradeTopic}`;
            statusBar.setContent(subscribeMsg);
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

                        // Format trade line with colors - adjust for small screens
                        let tradeLine;
                        if (isVerySmallScreen) {
                            // Multi-line format for very small screens to show more data vertically
                            const timePrice = `${timestamp.split(':').slice(0,2).join(':')} ${priceIndicatorColored} $${price.toFixed(4)}`;
                            const quantitySymbol = `${quantity.toFixed(4)} ${options.symbol.replace('USDT', '')}`;
                            const sideDisplay = `${sideColor}${side === 'Buy' ? 'BUY' : 'SELL'}${sideColorEnd}`;
                            tradeLine = `${timePrice}\n${quantitySymbol}\n${sideDisplay}`;
                        } else if (isSmallScreen) {
                            // Compact format for small screens - keep 4 decimals for price and quantity
                            tradeLine = `${timestamp} ${priceIndicatorColored} $${price.toFixed(4)} | ${quantity.toFixed(4)} | ${sideColor}${side}${sideColorEnd}`;
                        } else {
                            // Full format for normal screens
                            tradeLine = `${timestamp} ${priceIndicatorColored} $${price.toFixed(4)} | ${quantity.toFixed(4)} ${options.symbol.replace('USDT', '')} | ${sideColor}${side}${sideColorEnd}`;
                        }

                        // Add to trades log (throttle updates to prevent corruption)
                        // Only log trades when price actually changes to reduce clutter
                        if (priceIndicator !== '→') {
                            tradesLog.log(tradeLine);
                        } else if (tradeCount % 10 === 0) {  // Occasionally log same-price trades for activity indication
                            tradesLog.log(tradeLine);
                        }

                        // Update status (less frequent updates) - adjust for small screens
                        if (tradeCount % 20 === 0) {
                            let statusContent;
                            if (isVerySmallScreen) {
                                statusContent = `✅ ${tradeCount} | $${price.toFixed(0)}`;
                            } else if (isSmallScreen) {
                                statusContent = `✅ ${tradeCount} trades | $${price.toFixed(2)}`;
                            } else {
                                statusContent = `✅ Connected | Trades: ${tradeCount} | Last: $${price.toFixed(2)} (${side})\nLegend: ▲ Price Up | ▼ Price Down | → Same Price | ● Initial`;
                            }
                            statusBar.setContent(statusContent);
                            screen.render();
                        }
                    });
                }
            });

            // Handle connection events
            wsHandler.onOpen(() => {
                const connectMsg = isSmallScreen ? `🟢 Connected` : `🟢 Connected to ${options.symbol} trade stream`;
                headerLog.log(connectMsg);
                const statusMsg = isSmallScreen ? `Connected` : `WebSocket connected successfully`;
                statusBar.setContent(statusMsg);
                screen.render();
            });

            wsHandler.onClose(() => {
                const disconnectMsg = isSmallScreen ? `🔴 Disconnected` : `🔴 Disconnected from trade stream`;
                headerLog.log(disconnectMsg);
                statusBar.setContent(`Connection closed`);
                screen.render();
            });

            wsHandler.onException((error) => {
                const errorMsg = isSmallScreen ? `❌ Error` : `❌ WebSocket error: ${error.message}`;
                headerLog.log(errorMsg);
                const statusError = isSmallScreen ? `Error` : `Error: ${error.message}`;
                statusBar.setContent(statusError);
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
