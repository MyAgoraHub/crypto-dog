import inquirer from 'inquirer';
import chalk from 'chalk';
import blessed from 'blessed';
import contrib from 'blessed-contrib';
import { TradingStrategyEvaluator } from '../core/TradingStrategyEvaluator.js';
import { cryptoDogTradeBotAgent } from '../core/cryptoDogTradeBotAgent.js';
import { initializeDB, savePosition, getPositions, updatePosition, deletePosition } from '../core/repository/dbManager.js';

export const registerTradingBotCommand = (program) => {
    program
        .command('trade-bot')
        .description('Interactive trading bot with real-time analysis and position simulation')
        .option('-s, --symbol <symbol>', 'Trading symbol (e.g., BTCUSDT)', 'BTCUSDT')
        .option('-i, --interval <interval>', 'Time interval (e.g., 1m, 5m, 1h)', '1m')
        .option('-a, --amount <amount>', 'Position amount in base currency', '0.001')
        .option('-r, --risk <risk>', 'Stop-loss percentage (e.g., 1.0 for 1%)', '1.0')
        .option('-w, --reward <reward>', 'Profit target percentage (e.g., 2.0 for 2%)', '2.0')
        .action(async (options) => {
            try {
                await initializeDB();

                console.log(chalk.cyan('\n🚀 Crypto Dog Interactive Trading Bot\n'));

                // Validate inputs
                const symbol = options.symbol.toUpperCase();
                const interval = options.interval;
                const amount = parseFloat(options.amount);
                const riskPercent = parseFloat(options.risk);
                const rewardPercent = parseFloat(options.reward);

                if (isNaN(amount) || amount <= 0) {
                    console.error(chalk.red('❌ Invalid amount. Must be a positive number.'));
                    process.exit(1);
                }

                if (isNaN(riskPercent) || riskPercent <= 0 || riskPercent > 50) {
                    console.error(chalk.red('❌ Invalid risk percentage. Must be between 0.1 and 50.'));
                    process.exit(1);
                }

                if (isNaN(rewardPercent) || rewardPercent <= 0 || rewardPercent > 100) {
                    console.error(chalk.red('❌ Invalid reward percentage. Must be between 0.1 and 100.'));
                    process.exit(1);
                }

                console.log(chalk.blue(`📊 Symbol: ${symbol}`));
                console.log(chalk.blue(`⏰ Interval: ${interval}`));
                console.log(chalk.blue(`💰 Amount: ${amount} ${symbol.replace('USDT', '')}`));
                console.log(chalk.blue(`🛡️  Risk: ${riskPercent}% stop-loss`));
                console.log(chalk.blue(`🎯 Reward: ${rewardPercent}% profit target`));
                console.log(chalk.gray('\nStarting trading bot...\n'));

                // Create and start the trading bot
                const tradingBot = new InteractiveTradingBot({
                    symbol,
                    interval,
                    amount,
                    riskPercent,
                    rewardPercent
                });

                await tradingBot.start();

            } catch (error) {
                console.error(chalk.red('\n❌ Error starting trading bot:'), error.message);
                process.exit(1);
            }
        });
};

class InteractiveTradingBot {
    constructor(options) {
        this.options = options;
        this.agent = null;
        this.evaluator = new TradingStrategyEvaluator();
        this.currentPrice = 0;
        this.lastPriceUpdate = null; // Track when price was last updated
        this.positions = [];
        this.isRunning = false;
        this.currentView = 'default'; // 'default', 'analysis', 'positions'

        // Blessed UI components
        this.screen = null;
        this.grid = null;
        this.components = {};

        this.initUI();
    }

    initUI() {
        // Create blessed screen
        this.screen = blessed.screen({
            smartCSR: true,
            title: `Crypto Dog Trading Bot - ${this.options.symbol}`,
            fullUnicode: true
        });

        // Create grid layout
        this.grid = new contrib.grid({ rows: 12, cols: 12, screen: this.screen });

        // Header with bot info (always visible)
        this.components.header = this.grid.set(0, 0, 2, 12, contrib.log, {
            fg: 'cyan',
            selectedFg: 'cyan',
            label: '🤖 Crypto Dog Trading Bot',
            border: { type: "line", fg: 'cyan' }
        });

        // Main content area (changes based on view)
        this.components.mainContent = this.grid.set(2, 0, 8, 12, blessed.box, {
            fg: 'white',
            selectedFg: 'white',
            label: 'Main Content',
            border: { type: "line", fg: 'white' },
            scrollable: true,
            alwaysScroll: false, // Don't always scroll to bottom
            mouse: true, // Enable mouse scrolling
            keys: true   // Enable keyboard scrolling
        });

        // Menu for navigation (replaces keyboard shortcuts)
        this.components.menu = this.grid.set(10, 0, 2, 6, blessed.list, {
            fg: "green",
            selectedFg: "white",
            selectedBg: "green",
            label: '🎮 Menu',
            border: { type: "line", fg: 'green' },
            keys: false, // Disable built-in keys to avoid conflicts
            mouse: true,
            interactive: true,
            invertSelected: true,
            vi: false, // Disable vi keys
            items: [
                '📊 Analysis',
                '📈 Buy Long',
                '📉 Sell Short',
                '📊 Positions',
                '🏠 Default View',
                '❌ Close All',
                '🚪 Quit'
            ]
        });

        // Initialize menu selection index
        this.menuSelectedIndex = 0;
        this.components.menu.select(0);

        // Status info (compact)
        this.components.statusBox = this.grid.set(10, 6, 2, 6, contrib.log, {
            fg: "cyan",
            selectedFg: "cyan",
            label: '📊 Status',
            border: { type: "line", fg: 'cyan' }
        });

        // Set up menu selection handler
        this.components.menu.on('select', (item, index) => {
            this.handleMenuSelection(index);
        });

        // Focus the menu by default
        this.components.menu.focus();

        // Manual key handling for menu navigation
        this.screen.key(['up', 'k'], () => {
            if (this.screen.focused === this.components.menu) {
                this.menuSelectedIndex = Math.max(0, this.menuSelectedIndex - 1);
                this.components.menu.select(this.menuSelectedIndex);
                this.screen.render();
            }
        });

        this.screen.key(['down', 'j'], () => {
            if (this.screen.focused === this.components.menu) {
                this.menuSelectedIndex = Math.min(this.components.menu.items.length - 1, this.menuSelectedIndex + 1);
                this.components.menu.select(this.menuSelectedIndex);
                this.screen.render();
            }
        });

        this.screen.key(['enter', 'space'], () => {
            if (this.screen.focused === this.components.menu) {
                this.handleMenuSelection(this.menuSelectedIndex);
            }
        });

        // Initial UI updates
        this.updateHeader();
        this.updateStatus();
        this.showDefaultView();

        this.screen.render();
    }

    updateHeader() {
        const headerText = [
            `🤖 CRYPTO DOG TRADING BOT`,
            `─`.repeat(50),
            `Symbol: ${this.options.symbol} | Interval: ${this.options.interval}`,
            `Amount: ${this.options.amount} | Risk: ${this.options.riskPercent}% | Reward: ${this.options.rewardPercent}%`,
            `─`.repeat(50)
        ].join('\n');

        this.components.header.setContent(headerText);
        this.screen.render();
    }

    updatePriceDisplay() {
        if (this.currentPrice === 0) {
            this.components.priceBox.setContent('Waiting for price data...');
            this.screen.render();
            return;
        }

        let content = `Current Price: ${this.currentPrice.toFixed(2)}\n`;

        // Calculate total P&L
        let totalPnL = 0;
        let totalPnLPercent = 0;

        this.positions.forEach(pos => {
            const pnl = this.calculatePnL(pos);
            const pnlPercent = this.calculatePnLPercent(pos);
            totalPnL += pnl;
            totalPnLPercent += pnlPercent;

            content += `${pos.side.toUpperCase()} ${pos.amount}@${pos.entryPrice.toFixed(2)} → `;
            content += `${pnl >= 0 ? '📈' : '📉'} ${pnl.toFixed(2)} (${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}%)\n`;
        });

        if (this.positions.length > 0) {
            content += `─`.repeat(30) + '\n';
            content += `Total P&L: ${totalPnL >= 0 ? '📈' : '📉'} ${totalPnL.toFixed(2)} (${totalPnLPercent >= 0 ? '+' : ''}${totalPnLPercent.toFixed(2)}%)`;
        }

        this.components.priceBox.setContent(content);
        this.screen.render();
    }

    updatePositions() {
        if (this.positions.length === 0) {
            this.components.positionsBox.setContent('No active positions');
            this.screen.render();
            return;
        }

        let content = `📊 POSITIONS\n`;
        content += `═`.repeat(30) + '\n';

        if (this.positions.length === 0) {
            content += '\nNo positions\n';
        } else {
            // Show only first position to fit in space
            const pos = this.positions[0];
            const pnl = this.calculatePnL(pos);
            const pnlPercent = this.calculatePnLPercent(pos);

            content += `${pos.side.toUpperCase()} ${pos.amount}\n`;
            content += `Entry: ${pos.entryPrice.toFixed(0)}\n`;
            content += `P&L: ${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}\n`;
            content += `(${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(1)}%)\n`;

            if (this.positions.length > 1) {
                content += `\n+${this.positions.length - 1} more\n`;
            }

            // Total P&L only
            const totalPnL = this.positions.reduce((sum, pos) => sum + this.calculatePnL(pos), 0);
            content += `═`.repeat(30) + '\n';
            content += `Total: ${totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}\n`;
        }

        content += '\nMenu: navigate';

        this.components.positionsBox.setContent(content);
        this.screen.render();
    }

    updateSignals() {
        if (!this.evaluator.signals.overall) {
            this.components.signalsBox.setContent('No signals available');
            this.screen.render();
            return;
        }

        const signals = this.evaluator.signals;
        let content = '';

        content += `Overall: ${signals.overall.direction.toUpperCase()}\n`;
        content += `Confidence: ${signals.overall.confidence.toUpperCase()}\n\n`;

        content += `Trend: ${signals.trend?.direction || 'N/A'}\n`;
        content += `Momentum: ${signals.momentum?.direction || 'N/A'}\n`;
        content += `Volume: ${signals.volume?.direction || 'N/A'}\n`;
        content += `Static: ${signals.staticIndicators?.direction || 'N/A'}\n`;

        this.components.signalsBox.setContent(content);
        this.screen.render();
    }

    updateAnalysis() {
        if (!this.evaluator.signals.overall) {
            this.components.analysisBox.setContent('Run analysis with [A] key');
            this.screen.render();
            return;
        }

        const recommendation = this.evaluator.signals.overall.summary;
        this.components.analysisBox.setContent(recommendation);
        this.screen.render();
    }

    updateStatus() {
        const statusText = [
            `Status: ${this.isRunning ? '🟢 Running' : '🔴 Stopped'}`,
            `Positions: ${this.positions.length}`,
            `Price: ${this.currentPrice > 0 ? this.currentPrice.toFixed(4) : 'Loading...'}`,
            `Updated: ${this.lastPriceUpdate ? this.lastPriceUpdate.toLocaleTimeString() : 'Never'}`
        ].join('\n');

        this.components.statusBox.setContent(statusText);
        this.screen.render();
    }

    showDefaultView() {
        if (!this.screen) return; // Skip if UI not initialized
        
        this.currentView = 'default';
        this.components.mainContent.setLabel('🎯 Default View - Use Menu to Navigate');
        this.components.mainContent.setContent(`
Welcome to Crypto Dog Trading Bot!

Current Price: ${this.currentPrice > 0 ? this.currentPrice.toFixed(4) : 'Loading...'}
${this.lastPriceUpdate ? `Last Update: ${this.lastPriceUpdate.toLocaleTimeString()}` : ''}
Active Positions: ${this.positions.length}

Use the menu on the bottom left to:
• 📊 Analysis - View trading recommendations
• 📈 Buy Long - Open long position
• 📉 Sell Short - Open short position
• 📊 Positions - View position details
• 🏠 Default View - This welcome screen
• 🏠 Default View - This welcome screen
• ❌ Close All - Close all positions
• 🚪 Quit - Exit the application

${this.positions.length > 0 ? '\nActive Positions:\n' + this.positions.map((pos, i) =>
    `${i+1}. ${pos.side.toUpperCase()} ${pos.amount} @ ${pos.entryPrice.toFixed(4)} (P&L: ${this.calculatePnL(pos).toFixed(4)})`
).join('\n') : ''}

Status: ${this.isRunning ? '🟢 Running' : '🔴 Stopped'}
        `.trim());
        this.screen.render();
    }

    showAnalysisView() {
        if (!this.screen) return; // Skip if UI not initialized
        
        this.currentView = 'analysis';

        // Aggressive clearing to prevent floating characters
        // Fill the entire box with spaces first to clear any remnants
        const boxWidth = this.components.mainContent.width - 4; // Account for borders
        const boxHeight = this.components.mainContent.height - 2; // Account for borders
        const clearString = ' '.repeat(boxWidth) + '\n';
        const fullClear = clearString.repeat(boxHeight);
        
        this.components.mainContent.setContent(fullClear);
        this.components.mainContent.setLabel('');
        this.screen.render();
        
        // Small delay to ensure clearing takes effect
        setTimeout(() => {
            if (!this.evaluator.signals?.overall) {
                this.components.mainContent.setLabel('🔍 Analysis & Recommendations');
                this.components.mainContent.setContent('Use the menu to run analysis first');
                this.screen.render();
                return;
            }

            const recommendation = this.evaluator.signals.overall.summary || 'Analysis completed but no recommendation available';
            const signals = this.evaluator.signals;

            let content = `📊 TRADING ANALYSIS\n`;
            content += `═`.repeat(35) + '\n\n';

            content += `${recommendation}\n\n`;

            content += `Signal Breakdown:\n`;
            content += `• Trend: ${signals.trend?.direction || 'N/A'} (${signals.trend?.strength || 'N/A'})\n`;
            content += `• Momentum: ${signals.momentum?.direction || 'N/A'} (${signals.momentum?.strength || 'N/A'})\n`;
            content += `• Volatility: ${signals.volatility?.direction || 'N/A'} (${signals.volatility?.strength || 'N/A'})\n`;
            content += `• Volume: ${signals.volume?.direction || 'N/A'} (${signals.volume?.strength || 'N/A'})\n`;
            content += `• Static Indicators: ${signals.staticIndicators?.direction || 'N/A'} (${signals.staticIndicators?.strength || 'N/A'})\n\n`;

            if (signals.staticIndicators?.signals?.length > 0) {
                content += `Static Indicator Details:\n`;
                signals.staticIndicators.signals.forEach(signal => {
                    content += `• ${signal.indicator}: ${signal.signal} (${signal.strength})\n`;
                });
                content += '\n';
            }

            content += `Current Price: ${this.currentPrice.toFixed(4)}\n`;
            content += `Analysis Time: ${new Date().toLocaleTimeString()}\n\n`;

            content += `Use the menu to navigate back or execute trades`;

            this.components.mainContent.setLabel('🔍 Analysis & Recommendations');
            this.components.mainContent.setContent(content);
            
            // Reset scroll position and force render
            if (this.components.mainContent.scrollTo) {
                this.components.mainContent.scrollTo(0);
            }
            this.screen.render();
        }, 10);
    }

    showPositionsView() {
        this.currentView = 'positions';
        this.updatePositionsView();
    }

    updatePositionsView() {
        if (!this.screen) return; // Skip if UI not initialized
        
        if (this.currentView !== 'positions') return;

        // Aggressive clearing to prevent floating characters
        // Fill the entire box with spaces first to clear any remnants
        const boxWidth = this.components.mainContent.width - 4; // Account for borders
        const boxHeight = this.components.mainContent.height - 2; // Account for borders
        const clearString = ' '.repeat(boxWidth) + '\n';
        const fullClear = clearString.repeat(boxHeight);
        
        this.components.mainContent.setContent(fullClear);
        this.components.mainContent.setLabel('');
        this.screen.render();
        
        // Small delay to ensure clearing takes effect
        setTimeout(() => {
            // Now set the actual content
            let content = `📊 POSITIONS\n`;
            content += `═`.repeat(30) + '\n';

            if (this.positions.length === 0) {
                content += '\nNo positions\n';
            } else {
                // Show only first position to fit in space
                const pos = this.positions[0];
                const pnl = this.calculatePnL(pos);
                const pnlPercent = this.calculatePnLPercent(pos);

                content += `${pos.side.toUpperCase()} ${pos.amount}\n`;
                content += `Entry: ${pos.entryPrice.toFixed(0)}\n`;
                content += `P&L: ${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}\n`;
                content += `(${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(1)}%)\n`;

                if (this.positions.length > 1) {
                    content += `\n+${this.positions.length - 1} more\n`;
                }

                // Total P&L only
                const totalPnL = this.positions.reduce((sum, pos) => sum + this.calculatePnL(pos), 0);
                content += `═`.repeat(30) + '\n';
                content += `Total: ${totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}\n`;
            }

            content += '\nMenu: navigate';

            this.components.mainContent.setLabel('📊 Active Positions');
            this.components.mainContent.setContent(content);
            
            // Reset scroll position and force render
            if (this.components.mainContent.scrollTo) {
                this.components.mainContent.scrollTo(0);
            }
            this.screen.render();
        }, 10);
    }

    updatePriceInCurrentView() {
        if (!this.screen) return; // Skip if UI not initialized
        
        if (this.currentView === 'default') {
            this.showDefaultView();
        }
        // For other views, price updates are handled in updateViewData
    }

    updateViewData() {
        if (!this.screen) return; // Skip if UI not initialized
        
        switch (this.currentView) {
            case 'default':
                this.showDefaultView();
                break;
            case 'positions':
                this.updatePositionsView();
                break;
            case 'analysis':
                // Analysis view doesn't need frequent updates
                break;
        }
    }

    calculatePnL(position) {
        if (position.side === 'long') {
            return (this.currentPrice - position.entryPrice) * position.amount;
        } else {
            return (position.entryPrice - this.currentPrice) * position.amount;
        }
    }

    calculatePnLPercent(position) {
        if (position.side === 'long') {
            return ((this.currentPrice - position.entryPrice) / position.entryPrice) * 100;
        } else {
            return ((position.entryPrice - this.currentPrice) / position.entryPrice) * 100;
        }
    }

    async loadPositionsFromDB() {
        try {
            const dbPositions = await getPositions({ symbol: this.options.symbol, status: 'open' });
            this.positions = dbPositions;
            this.updateViewData();
        } catch (error) {
            console.error('Error loading positions from DB:', error);
        }
    }

    showMessage(message) {
        // For now, just log to console. Could be enhanced to show in UI
        console.log(chalk.cyan(`[${new Date().toLocaleTimeString()}] ${message}`));
    }

    async start() {
        this.isRunning = true;

        // Temporarily disable console suppression for debugging
        // Suppress console output for the entire bot session to prevent websocket logs
        this.originalConsole = {
            log: console.log,
            info: console.info,
            warn: console.warn,
            error: console.error,
            debug: console.debug
        };
        
        // Replace console functions with no-ops
        console.log = (msg) => {
            // Temporarily allow log for debugging
            this.originalConsole.log(msg);
        };
        console.info = () => {};
        console.warn = () => {};
        console.error = (msg) => {
            // Keep error logging for important errors
            this.originalConsole.error(msg);
        };
        console.debug = () => {};

        // Create and start the trade bot agent
        this.agent = new cryptoDogTradeBotAgent();

        // Set up price update callback for real-time updates
        this.agent.onPriceUpdate = (price) => {
            const oldPrice = this.currentPrice;
            this.currentPrice = price;
            this.lastPriceUpdate = new Date();
            
            // Update UI with new price data
            this.updatePriceInCurrentView();
            this.updateStatus(); // Also update the status box with new price
        };

        // Load existing positions from database
        await this.loadPositionsFromDB();

        // Set up real-time data handling
        this.agent.startRealTimeKlineFeed(this.options.interval, this.options.symbol);

        // Override the loadIndicators method to include our evaluator
        const originalLoadIndicators = this.agent.loadIndicators.bind(this.agent);
        this.agent.loadIndicators = () => {
            originalLoadIndicators();

            // Update evaluator with latest indicators and current price
            if (this.agent.klineData.length > 0) {
                const latestCandle = this.agent.klineData[this.agent.klineData.length - 1];
                // Only update currentPrice if we don't have real-time price data yet
                if (this.currentPrice === 0) {
                    this.currentPrice = latestCandle[4]; // Close price
                }

                this.evaluator.loadFromObject(this.agent.indicators);
                this.evaluator.setCurrentPrice(this.currentPrice);

                // Update UI for current view
                this.updateViewData();
                this.checkStopLossAndTakeProfit();
            }
        };
    }

    stop() {
        this.isRunning = false;
        
        // Restore console functions
        if (this.originalConsole) {
            console.log = this.originalConsole.log;
            console.info = this.originalConsole.info;
            console.warn = this.originalConsole.warn;
            console.error = this.originalConsole.error;
            console.debug = this.originalConsole.debug;
        }
        
        if (this.agent) {
            // Stop the agent (if it has a stop method)
        }
        if (this.screen) {
            this.screen.destroy();
        }
    }

    async handleBuySignal() {
        if (this.currentPrice === 0) {
            this.showMessage('No price data available');
            return;
        }

        const position = {
            id: `pos_${Date.now()}`,
            symbol: this.options.symbol,
            side: 'long',
            amount: this.options.amount,
            entryPrice: this.currentPrice,
            stopLoss: this.currentPrice * (1 - this.options.riskPercent / 100),
            takeProfit: this.currentPrice * (1 + this.options.rewardPercent / 100),
            timestamp: new Date().toISOString(),
            status: 'open'
        };

        this.positions.push(position);
        await savePosition(position);

        this.updateViewData();
        this.updateStatus();
        this.showMessage(`🟢 LONG position opened at ${this.currentPrice.toFixed(4)}`);
    }

    async handleSellSignal() {
        if (this.currentPrice === 0) {
            this.showMessage('No price data available');
            return;
        }

        const position = {
            id: `pos_${Date.now()}`,
            symbol: this.options.symbol,
            side: 'short',
            amount: this.options.amount,
            entryPrice: this.currentPrice,
            stopLoss: this.currentPrice * (1 + this.options.riskPercent / 100),
            takeProfit: this.currentPrice * (1 - this.options.rewardPercent / 100),
            timestamp: new Date().toISOString(),
            status: 'open'
        };

        this.positions.push(position);
        await savePosition(position);

        this.updateViewData();
        this.updateStatus();
        this.showMessage(`🔴 SHORT position opened at ${this.currentPrice.toFixed(4)}`);
    }

    performAnalysis() {
        if (!this.evaluator?.indicators) {
            this.showMessage('No indicator data available - waiting for market data...');
            return;
        }

        this.evaluator.evaluateAllSignals();
        
        // Debug: Check if signals were generated
        if (!this.evaluator.signals?.overall) {
            this.showMessage('Analysis failed - no signals generated');
            return;
        }
        
        this.showAnalysisView();
        this.showMessage('📊 Analysis completed - use menu to navigate');
    }

    async closeAllPositions() {
        for (const position of this.positions) {
            position.status = 'closed';
            position.exitPrice = this.currentPrice;
            position.exitTime = new Date().toISOString();
            position.finalPnL = this.calculatePnL(position);
            position.finalPnLPercent = this.calculatePnLPercent(position);

            await updatePosition(position.id, position);
        }

        this.positions = [];
        this.updateViewData();
        this.updateStatus();
        this.showMessage('📊 All positions closed');
    }

    checkStopLossAndTakeProfit() {
        const positionsToClose = [];

        for (const position of this.positions) {
            let shouldClose = false;
            let reason = '';

            if (position.side === 'long') {
                if (this.currentPrice <= position.stopLoss) {
                    shouldClose = true;
                    reason = 'Stop Loss';
                } else if (this.currentPrice >= position.takeProfit) {
                    shouldClose = true;
                    reason = 'Take Profit';
                }
            } else { // short
                if (this.currentPrice >= position.stopLoss) {
                    shouldClose = true;
                    reason = 'Stop Loss';
                } else if (this.currentPrice <= position.takeProfit) {
                    shouldClose = true;
                    reason = 'Take Profit';
                }
            }

            if (shouldClose) {
                position.status = 'closed';
                position.exitPrice = this.currentPrice;
                position.exitTime = new Date().toISOString();
                position.finalPnL = this.calculatePnL(position);
                position.finalPnLPercent = this.calculatePnLPercent(position);
                position.closeReason = reason;

                positionsToClose.push(position);
                this.showMessage(`📊 Position closed: ${reason} at ${this.currentPrice.toFixed(4)}`);
            }
        }

        // Remove closed positions from active list
        this.positions = this.positions.filter(pos => pos.status === 'open');

        // Update database
        positionsToClose.forEach(async (pos) => {
            await updatePosition(pos.id, pos);
        });

        if (positionsToClose.length > 0) {
            this.updateViewData();
            this.updateStatus();
        }
    }

    handleMenuSelection(index) {
        switch (index) {
            case 0: // Analysis
                this.performAnalysis();
                break;
            case 1: // Buy Long
                this.handleBuySignal();
                break;
            case 2: // Sell Short
                this.handleSellSignal();
                break;
            case 3: // Positions
                this.showPositionsView();
                break;
            case 4: // Default View
                this.showDefaultView();
                break;
            case 5: // Close All
                this.closeAllPositions();
                break;
            case 6: // Quit
                this.stop();
                process.exit(0);
                break;
        }
    }
}
