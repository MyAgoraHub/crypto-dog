#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import { spawn } from 'child_process';
import {
    getInstrumentsInfo,
    getTickers,
    getIntervals
} from './core/clients/cryptoDogRequestHandler.js';
import {
    createRsiObSignal, 
    createRsiOsSignal, 
    createCrocodileDiveSignal, 
    createCrocodileSignal,
    createCrossUpSignal,
    createCrossDownSignal,
    createPriceActionSignal,
    createMultiDivSignal,
    createUptrendSignal,
    createDownTrendSignal,
    createWoodiesSignal,
    createSuperTrendSignal
} from './core/cryptoDogSignalManager.js';
import { getAllSignals, deleteAll } from './core/repository/dbManager.js';
import { backtestSignal } from './core/cryptoDogBacktest.js';
import { signalAgent } from './core/cryptoDogSignalAgent.js';

const program = new Command();

// ASCII Art Banner
const banner = chalk.cyan(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   ██████╗██████╗ ██╗   ██╗██████╗ ████████╗ ██████╗    ║
║  ██╔════╝██╔══██╗╚██╗ ██╔╝██╔══██╗╚══██╔══╝██╔═══██╗   ║
║  ██║     ██████╔╝ ╚████╔╝ ██████╔╝   ██║   ██║   ██║   ║
║  ██║     ██╔══██╗  ╚██╔╝  ██╔═══╝    ██║   ██║   ██║   ║
║  ╚██████╗██║  ██║   ██║   ██║        ██║   ╚██████╔╝   ║
║   ╚═════╝╚═╝  ╚═╝   ╚═╝   ╚═╝        ╚═╝    ╚═════╝    ║
║                                                   ║
║            🐕 Crypto Dog - Trading CLI 🐕          ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
`);

console.log(banner);

program
    .name('crypto-dog')
    .description('Crypto Trading & Data Analysis CLI Tool')
    .version('1.0.0');

// Command: List all available intervals
program
    .command('intervals')
    .description('List all available trading intervals')
    .action(() => {
        const intervals = getIntervals();
        const table = new Table({
            head: [chalk.cyan('Key'), chalk.cyan('Value'), chalk.cyan('Label')],
            colWidths: [10, 10, 30]
        });

        Object.entries(intervals).forEach(([key, data]) => {
            table.push([key, data.value, data.label]);
        });

        console.log(chalk.green('\n📊 Available Intervals:\n'));
        console.log(table.toString());
    });

// Command: Get tickers
program
    .command('tickers')
    .description('Get ticker data for a symbol')
    .requiredOption('-c, --category <category>', 'Market category (spot, linear, inverse, option)')
    .option('-s, --symbol <symbol>', 'Trading symbol (e.g., BTCUSDT)')
    .action(async (options) => {
        const spinner = ora('Fetching ticker data...').start();
        try {
            const tickers = await getTickers(options.category, options.symbol);
            spinner.succeed('Ticker data fetched successfully!');

            const table = new Table({
                head: [chalk.cyan('Symbol'), chalk.cyan('Last Price'), chalk.cyan('24h Change'), chalk.cyan('24h Volume')],
                colWidths: [15, 15, 15, 20]
            });

            if (tickers.result && tickers.result.list) {
                tickers.result.list.slice(0, 10).forEach(ticker => {
                    const change = parseFloat(ticker.price24hPcnt || 0) * 100;
                    const changeColor = change >= 0 ? chalk.green : chalk.red;
                    table.push([
                        ticker.symbol,
                        ticker.lastPrice,
                        changeColor(`${change.toFixed(2)}%`),
                        ticker.volume24h
                    ]);
                });
            }

            console.log(chalk.green('\n💰 Ticker Data:\n'));
            console.log(table.toString());
        } catch (error) {
            spinner.fail('Failed to fetch ticker data');
            console.error(chalk.red(error.message));
        }
    });

// Command: Stop-Loss & Profit Target Calculator
program
    .command('calculate')
    .description('Calculate stop-loss and profit targets')
    .requiredOption('-e, --entry <price>', 'Entry price')
    .requiredOption('-t, --type <type>', 'Position type (long/short)')
    .option('-s, --stop-loss <percentage>', 'Stop-loss percentage', '2')
    .option('-p, --profit <percentage>', 'Profit target percentage', '5')
    .option('-a, --amount <amount>', 'Position size', '100')
    .action((options) => {
        const entry = parseFloat(options.entry);
        const stopLossPercent = parseFloat(options.stopLoss);
        const profitPercent = parseFloat(options.profit);
        const amount = parseFloat(options.amount);
        const isLong = options.type.toLowerCase() === 'long';

        let stopLoss, profitTarget, stopLossAmount, profitAmount;

        if (isLong) {
            stopLoss = entry * (1 - stopLossPercent / 100);
            profitTarget = entry * (1 + profitPercent / 100);
        } else {
            stopLoss = entry * (1 + stopLossPercent / 100);
            profitTarget = entry * (1 - profitPercent / 100);
        }

        stopLossAmount = Math.abs(entry - stopLoss) * amount / entry;
        profitAmount = Math.abs(profitTarget - entry) * amount / entry;

        const riskRewardRatio = profitAmount / stopLossAmount;

        console.log(chalk.green('\n� Trading Calculator Results:\n'));
        console.log(chalk.cyan('Position Details:'));
        console.log(`  Type: ${chalk.bold(isLong ? 'LONG' : 'SHORT')}`);
        console.log(`  Entry Price: ${chalk.yellow('$' + entry.toFixed(2))}`);
        console.log(`  Position Size: ${chalk.yellow('$' + amount.toFixed(2))}`);
        
        console.log(chalk.cyan('\nStop-Loss:'));
        console.log(`  Price: ${chalk.red('$' + stopLoss.toFixed(2))}`);
        console.log(`  Distance: ${chalk.red(stopLossPercent + '%')}`);
        console.log(`  Loss Amount: ${chalk.red('-$' + stopLossAmount.toFixed(2))}`);
        
        console.log(chalk.cyan('\nProfit Target:'));
        console.log(`  Price: ${chalk.green('$' + profitTarget.toFixed(2))}`);
        console.log(`  Distance: ${chalk.green(profitPercent + '%')}`);
        console.log(`  Profit Amount: ${chalk.green('+$' + profitAmount.toFixed(2))}`);
        
        console.log(chalk.cyan('\nRisk/Reward:'));
        console.log(`  Ratio: ${chalk.bold(riskRewardRatio.toFixed(2) + ':1')}`);
        
        const riskColor = riskRewardRatio >= 2 ? chalk.green : riskRewardRatio >= 1.5 ? chalk.yellow : chalk.red;
        console.log(`  Rating: ${riskColor(riskRewardRatio >= 2 ? 'Excellent ✓' : riskRewardRatio >= 1.5 ? 'Good' : 'Poor ✗')}\n`);
    });

// Command: Start Signal Process Manager
program
    .command('start-monitor')
    .description('Start the signal monitoring process')
    .option('-d, --daemon', 'Run in background (daemon mode)')
    .action((options) => {
        console.log(chalk.green('\n🚀 Starting Signal Process Manager...\n'));
        
        const processArgs = ['core/cryptoDogSignalProcessor.js'];
        const processOptions = {
            stdio: options.daemon ? 'ignore' : 'inherit',
            detached: options.daemon
        };

        const child = spawn('node', processArgs, processOptions);

        if (options.daemon) {
            child.unref();
            console.log(chalk.green(`✓ Signal monitor started in background (PID: ${child.pid})`));
            console.log(chalk.cyan(`  Use 'kill ${child.pid}' to stop it\n`));
        } else {
            console.log(chalk.cyan('Signal monitor is running... Press Ctrl+C to stop\n'));
        }

        child.on('error', (error) => {
            console.error(chalk.red('Failed to start process:'), error.message);
        });
    });

// Command: Start Web Server
program
    .command('start-server')
    .description('Start the API server and portal')
    .option('-p, --port <port>', 'Server port', '3000')
    .action((options) => {
        console.log(chalk.green('\n🌐 Starting API Server...\n'));
        
        const child = spawn('node', ['server.js'], {
            stdio: 'inherit',
            env: { ...process.env, PORT: options.port }
        });

        console.log(chalk.cyan(`API Server running on http://localhost:${options.port}`));
        console.log(chalk.cyan('Press Ctrl+C to stop\n'));

        child.on('error', (error) => {
            console.error(chalk.red('Failed to start server:'), error.message);
        });
    });

// Command: List Signal Types
program
    .command('signal-types')
    .description('List all available signal types')
    .action(() => {
        console.log(chalk.green('\n📋 Available Signal Types:\n'));
        console.log(chalk.cyan('Indicator-Based Signals:'));
        console.log('  rsi-ob          - RSI Overbought (requires --value, e.g., 70)');
        console.log('  rsi-os          - RSI Oversold (requires --value, e.g., 30)');
        console.log('  crocodile-dive  - Crocodile Dive (Bearish EMA pattern)');
        console.log('  crocodile       - Crocodile (Bullish EMA pattern)');
        console.log('  cross-up        - EMA Cross Up');
        console.log('  cross-down      - EMA Cross Down');
        console.log('  multi-div       - Multi Divergence Detector');
        console.log('  uptrend         - Uptrend Signal');
        console.log('  downtrend       - Downtrend Signal');
        console.log('  woodies         - Woodies Pivot Signal');
        console.log('  supertrend-long - SuperTrend Long');
        console.log('  supertrend-short- SuperTrend Short');
        
        console.log(chalk.cyan('\nPrice Action Signals:'));
        console.log('  price-gt        - Price Greater Than (requires --value)');
        console.log('  price-lt        - Price Less Than (requires --value)');
        console.log('  price-gte       - Price Greater Than or Equal (requires --value)');
        console.log('  price-lte       - Price Less Than or Equal (requires --value)');
        console.log('  price-eq        - Price Equal (requires --value)');
        
        console.log(chalk.green('\n💡 Example Usage:'));
        console.log(chalk.gray('  crypto-dog create-signal -s BTCUSDT -i 1h -t rsi-ob -v 70'));
        console.log(chalk.gray('  crypto-dog create-signal -s ETHUSDT -i 15m -t cross-up'));
        console.log(chalk.gray('  crypto-dog create-signal -s ADAUSDT -i 5m -t price-gt -v 0.5\n'));
    });

// Command: Create Signal
program
    .command('create-signal')
    .description('Create a new trading signal')
    .requiredOption('-s, --symbol <symbol>', 'Trading symbol (e.g., BTCUSDT)')
    .requiredOption('-i, --interval <interval>', 'Time interval (e.g., 1m, 5m, 15m, 1h, 4h)')
    .requiredOption('-t, --type <type>', 'Signal type (use "crypto-dog signal-types" to list)')
    .option('-v, --value <value>', 'Signal value (for RSI, price action, etc.)')
    .option('-m, --max-triggers <number>', 'Max trigger times', '3')
    .action(async (options) => {
        const spinner = ora('Creating signal...').start();
        
        try {
            const symbol = options.symbol.toUpperCase();
            const interval = options.interval;
            const maxTriggers = parseInt(options.maxTriggers);
            const value = options.value ? parseFloat(options.value) : 0;

            let created = false;

            switch (options.type.toLowerCase()) {
                case 'rsi-ob':
                    if (!options.value) throw new Error('--value required for RSI Overbought (e.g., 70)');
                    await createRsiObSignal(symbol, interval, value, {});
                    created = true;
                    break;
                
                case 'rsi-os':
                    if (!options.value) throw new Error('--value required for RSI Oversold (e.g., 30)');
                    await createRsiOsSignal(symbol, interval, value, {});
                    created = true;
                    break;
                
                case 'crocodile-dive':
                    await createCrocodileDiveSignal(symbol, interval, 0, {});
                    created = true;
                    break;
                
                case 'crocodile':
                    await createCrocodileSignal(symbol, interval, 0, {});
                    created = true;
                    break;
                
                case 'cross-up':
                    await createCrossUpSignal(symbol, interval, 0, { period: 200 });
                    created = true;
                    break;
                
                case 'cross-down':
                    await createCrossDownSignal(symbol, interval, 0, { period: 200 });
                    created = true;
                    break;
                
                case 'multi-div':
                    await createMultiDivSignal(symbol, interval, 0, {});
                    created = true;
                    break;
                
                case 'uptrend':
                    await createUptrendSignal(symbol, interval, 0, {});
                    created = true;
                    break;
                
                case 'downtrend':
                    await createDownTrendSignal(symbol, interval, 0, {});
                    created = true;
                    break;
                
                case 'woodies':
                    await createWoodiesSignal(symbol, interval, 0, {});
                    created = true;
                    break;
                
                case 'supertrend-long':
                    await createSuperTrendSignal(symbol, interval, 'long', {});
                    created = true;
                    break;
                
                case 'supertrend-short':
                    await createSuperTrendSignal(symbol, interval, 'short', {});
                    created = true;
                    break;
                
                case 'price-gt':
                    if (!options.value) throw new Error('--value required for price-gt');
                    await createPriceActionSignal(symbol, interval, value, 'gt');
                    created = true;
                    break;
                
                case 'price-lt':
                    if (!options.value) throw new Error('--value required for price-lt');
                    await createPriceActionSignal(symbol, interval, value, 'lt');
                    created = true;
                    break;
                
                case 'price-gte':
                    if (!options.value) throw new Error('--value required for price-gte');
                    await createPriceActionSignal(symbol, interval, value, 'gte');
                    created = true;
                    break;
                
                case 'price-lte':
                    if (!options.value) throw new Error('--value required for price-lte');
                    await createPriceActionSignal(symbol, interval, value, 'lte');
                    created = true;
                    break;
                
                case 'price-eq':
                    if (!options.value) throw new Error('--value required for price-eq');
                    await createPriceActionSignal(symbol, interval, value, 'eq');
                    created = true;
                    break;
                
                default:
                    throw new Error(`Unknown signal type: ${options.type}. Use --list-types to see available types.`);
            }

            if (created) {
                spinner.succeed(chalk.green(`✓ Signal created successfully!`));
                console.log(chalk.cyan(`  Symbol: ${symbol}`));
                console.log(chalk.cyan(`  Interval: ${interval}`));
                console.log(chalk.cyan(`  Type: ${options.type}`));
                if (options.value) console.log(chalk.cyan(`  Value: ${value}`));
                console.log(chalk.cyan(`  Max Triggers: ${maxTriggers}\n`));
            }
        } catch (error) {
            spinner.fail('Failed to create signal');
            console.error(chalk.red(error.message));
        }
    });

// Command: List Signals
program
    .command('list-signals')
    .description('List all configured signals')
    .option('-a, --active', 'Show only active signals')
    .option('-t, --triggered', 'Show only triggered signals')
    .action(async (options) => {
        const spinner = ora('Fetching signals...').start();
        
        try {
            let signals = await getAllSignals();
            
            if (options.active) {
                signals = signals.filter(s => s.isActive);
            }
            
            if (options.triggered) {
                signals = signals.filter(s => s.triggerCount > 0);
            }
            
            spinner.succeed(`Found ${signals.length} signal(s)`);
            
            if (signals.length === 0) {
                console.log(chalk.yellow('\nNo signals found. Create one with: crypto-dog create-signal\n'));
                return;
            }
            
            const table = new Table({
                head: [
                    chalk.cyan('Symbol'),
                    chalk.cyan('Interval'),
                    chalk.cyan('Type'),
                    chalk.cyan('Triggers'),
                    chalk.cyan('Status')
                ],
                colWidths: [12, 10, 30, 12, 10]
            });
            
            signals.forEach(signal => {
                const statusColor = signal.isActive ? chalk.green : chalk.gray;
                const triggerColor = signal.triggerCount > 0 ? chalk.yellow : chalk.gray;
                
                table.push([
                    signal.symbol,
                    signal.timeframe,
                    signal.signalType,
                    triggerColor(`${signal.triggerCount}/${signal.maxTriggerTimes}`),
                    statusColor(signal.isActive ? 'Active' : 'Inactive')
                ]);
            });
            
            console.log(chalk.green('\n📊 Configured Signals:\n'));
            console.log(table.toString());
            console.log('');
        } catch (error) {
            spinner.fail('Failed to fetch signals');
            console.error(chalk.red(error.message));
        }
    });

// Command: Delete All Signals
program
    .command('clear-signals')
    .description('Delete all signals from database')
    .option('-y, --yes', 'Skip confirmation')
    .action(async (options) => {
        if (!options.yes) {
            console.log(chalk.yellow('\n⚠️  This will delete ALL signals. Use --yes to confirm.\n'));
            return;
        }
        
        const spinner = ora('Deleting all signals...').start();
        
        try {
            await deleteAll();
            spinner.succeed(chalk.green('✓ All signals deleted successfully!\n'));
        } catch (error) {
            spinner.fail('Failed to delete signals');
            console.error(chalk.red(error.message));
        }
    });

// Command: Cache Management
program
    .command('cache')
    .description('Manage data cache')
    .option('--stats', 'Show cache statistics')
    .option('--clear', 'Clear all cached data')
    .option('--clear-symbol <symbol>', 'Clear cache for specific symbol')
    .option('--clear-interval <interval>', 'Clear cache for specific interval')
    .action(async (options) => {
        const { getCacheStats, clearCache } = await import('./core/indicator/impl/indicatorManager.js');
        
        if (options.stats) {
            const stats = getCacheStats();
            console.log(chalk.green('\n📊 Cache Statistics:\n'));
            console.log(`Total entries: ${chalk.bold(stats.size)}`);
            
            if (stats.entries.length > 0) {
                console.log(chalk.cyan('\nCache Entries:'));
                stats.entries.forEach(entry => {
                    console.log(`  ${entry.key} - ${entry.age}`);
                });
            } else {
                console.log(chalk.yellow('  No cached data'));
            }
            console.log('');
        } else if (options.clear) {
            clearCache();
            console.log(chalk.green('✓ All cache cleared\n'));
        } else if (options.clearSymbol) {
            clearCache(null, options.clearSymbol.toUpperCase());
            console.log(chalk.green(`✓ Cache cleared for ${options.clearSymbol.toUpperCase()}\n`));
        } else if (options.clearInterval) {
            clearCache(null, null, options.clearInterval);
            console.log(chalk.green(`✓ Cache cleared for ${options.clearInterval} interval\n`));
        } else {
            console.log(chalk.yellow('Use --stats to view cache or --clear to clear all cache\n'));
        }
    });

// Command: Backtest Signal
program
    .command('backtest')
    .description('Backtest a signal strategy against historical data')
    .requiredOption('-s, --symbol <symbol>', 'Trading symbol (e.g., BTCUSDT)')
    .requiredOption('-i, --interval <interval>', 'Time interval (e.g., 1m, 5m, 15m, 1h, 4h)')
    .requiredOption('-t, --type <type>', 'Signal type (use "crypto-dog signal-types" to list)')
    .option('-v, --value <value>', 'Signal value (for RSI, price action, etc.)')
    .option('--iterations <number>', 'Number of historical data pulls', '10')
    .option('--candles <number>', 'Candles per pull', '200')
    .option('--risk <percent>', 'Risk per trade (%)', '2')
    .option('--reward <percent>', 'Reward per trade (%)', '5')
    .option('--capital <amount>', 'Initial capital', '10000')
    .option('--show-trades', 'Show all trade details')
    .addHelpText('after', `
${chalk.cyan('Examples:')}

  ${chalk.gray('# RSI Strategies')}
  ${chalk.yellow('crypto-dog backtest -s BTCUSDT -i 1h -t rsi-os -v 30')}
  ${chalk.gray('  → Long when RSI < 30 (oversold)')}
  
  ${chalk.yellow('crypto-dog backtest -s ETHUSDT -i 4h -t rsi-ob -v 70')}
  ${chalk.gray('  → Short when RSI > 70 (overbought)')}

  ${chalk.gray('# SuperTrend Strategies')}
  ${chalk.yellow('crypto-dog backtest -s BTCUSDT -i 15m -t supertrend-long')}
  ${chalk.gray('  → Long positions when SuperTrend shows uptrend')}
  
  ${chalk.yellow('crypto-dog backtest -s ADAUSDT -i 1h -t supertrend-short')}
  ${chalk.gray('  → Short positions when SuperTrend shows downtrend')}

  ${chalk.gray('# Price Action Strategies')}
  ${chalk.yellow('crypto-dog backtest -s BTCUSDT -i 5m -t price-gt -v 50000')}
  ${chalk.gray('  → Long when price breaks above $50,000')}
  
  ${chalk.yellow('crypto-dog backtest -s ETHUSDT -i 15m -t price-lt -v 3000')}
  ${chalk.gray('  → Short when price falls below $3,000')}

  ${chalk.gray('# Pattern Recognition')}
  ${chalk.yellow('crypto-dog backtest -s SOLUSDT -i 4h -t crocodile')}
  ${chalk.gray('  → Long on bullish EMA pattern (EMA1 > EMA2 > EMA3)')}
  
  ${chalk.yellow('crypto-dog backtest -s BNBUSDT -i 1h -t crocodile-dive')}
  ${chalk.gray('  → Short on bearish EMA pattern (EMA1 < EMA2 < EMA3)')}
  
  ${chalk.yellow('crypto-dog backtest -s BTCUSDT -i 15m -t cross-up')}
  ${chalk.gray('  → Long on EMA crossover (bullish cross)')}

  ${chalk.gray('# Divergence Detection')}
  ${chalk.yellow('crypto-dog backtest -s BTCUSDT -i 4h -t multi-div')}
  ${chalk.gray('  → Detects bullish/bearish divergences across RSI, MACD, Stochastic')}
  
  ${chalk.yellow('crypto-dog backtest -s ETHUSDT -i 1h -t woodies')}
  ${chalk.gray('  → Pivot point support/resistance levels')}

  ${chalk.gray('# Advanced Setups')}
  ${chalk.yellow('crypto-dog backtest -s BTCUSDT -i 1h -t rsi-os -v 25 --risk 1.5 --reward 6 --capital 50000')}
  ${chalk.gray('  → RSI strategy with 1:4 risk/reward ratio and $50k capital')}
  
  ${chalk.yellow('crypto-dog backtest -s ETHUSDT -i 4h -t supertrend-long --iterations 20 --show-trades')}
  ${chalk.gray('  → SuperTrend with more historical data + full trade log')}

  ${chalk.gray('# Quick Tests (fewer iterations for faster results)')}
  ${chalk.yellow('crypto-dog backtest -s ADAUSDT -i 15m -t rsi-os -v 30 --iterations 3')}
  ${chalk.gray('  → Quick backtest with 600 candles')}

${chalk.cyan('Notes:')}
  • ${chalk.gray('supertrend-long')} = Enters LONG when SuperTrend indicator trend = 'long'
  • ${chalk.gray('supertrend-short')} = Enters SHORT when SuperTrend indicator trend = 'short'
  • Default risk/reward is 2%/5% (2.5:1 ratio)
  • Use --iterations to control data amount (more = longer test period)
  • Use --show-trades to see every individual trade
    `)
    .action(async (options) => {
        const spinner = ora('Preparing backtest...').start();
        
        try {
            spinner.text = 'Fetching historical data...';
            
            const symbol = options.symbol.toUpperCase();
            const interval = options.interval;
            const risk = parseFloat(options.risk);
            const reward = parseFloat(options.reward);
            const capital = parseFloat(options.capital);
            const iterations = parseInt(options.iterations);
            const candles = parseInt(options.candles);
            
            // Determine signal value based on type
            let value;
            if (options.type === 'supertrend-long') {
                value = 'long';
            } else if (options.type === 'supertrend-short') {
                value = 'short';
            } else if (options.value) {
                value = parseFloat(options.value);
            } else {
                value = 0;
            }
            
            // Create temporary signal for backtesting
            const signalType = mapTypeToSignalType(options.type);
            const indicator = getIndicatorForType(options.type);
            const evaluate = getEvaluateFunctionForType(options.type);
            
            const signal = {
                symbol,
                timeframe: interval,
                signalType,
                indicator,
                value,
                evaluate,
                indicatorArgs: options.type === 'cross-up' || options.type === 'cross-down' ? { period: 200 } : {}
            };
            
            spinner.text = 'Running backtest simulation...';
            const results = await backtestSignal(signal, iterations, candles, risk, reward, capital);
            
            spinner.succeed('Backtest completed!');
            
            // Display results
            console.log(chalk.green('\n📊 BACKTEST RESULTS\n'));
            console.log(chalk.cyan('Signal Configuration:'));
            console.log(`  Symbol: ${results.signal.symbol}`);
            console.log(`  Timeframe: ${results.signal.timeframe}`);
            console.log(`  Type: ${results.signal.type}`);
            if (options.value) console.log(`  Value: ${value}`);
            
            console.log(chalk.cyan('\nTest Period:'));
            console.log(`  Start: ${results.period.start}`);
            console.log(`  End: ${results.period.end}`);
            console.log(`  Candles Analyzed: ${results.period.candles}`);
            console.log(`  Data Points: ${iterations} iterations × ${candles} candles`);
            
            console.log(chalk.cyan('\nPerformance:'));
            const profitColor = parseFloat(results.performance.returnPercent) >= 0 ? chalk.green : chalk.red;
            console.log(`  Initial Capital: $${results.performance.initialCapital}`);
            console.log(`  Final Capital: ${profitColor('$' + results.performance.finalCapital)}`);
            console.log(`  Net Profit: ${profitColor(results.performance.netProfit >= 0 ? '+' : '')}${profitColor('$' + results.performance.netProfit)}`);
            console.log(`  Return: ${profitColor(results.performance.returnPercent + '%')}`);
            console.log(`  Max Drawdown: ${chalk.red(results.performance.maxDrawdown + '%')}`);
            
            console.log(chalk.cyan('\nTrade Statistics:'));
            const winRateColor = parseFloat(results.trades.winRate) >= 50 ? chalk.green : chalk.red;
            console.log(`  Total Trades: ${results.trades.total}`);
            console.log(`  Wins: ${chalk.green(results.trades.wins)}`);
            console.log(`  Losses: ${chalk.red(results.trades.losses)}`);
            console.log(`  Win Rate: ${winRateColor(results.trades.winRate + '%')}`);
            console.log(`  Avg Win: ${chalk.green('$' + results.trades.avgWin)}`);
            console.log(`  Avg Loss: ${chalk.red('$' + results.trades.avgLoss)}`);
            console.log(`  Profit Factor: ${results.trades.profitFactor}`);
            
            if (options.showTrades && results.tradeHistory.length > 0) {
                console.log(chalk.cyan('\n📈 Trade History:\n'));
                
                const table = new Table({
                    head: [
                        chalk.cyan('Entry'),
                        chalk.cyan('Position'),
                        chalk.cyan('Entry Price'),
                        chalk.cyan('Exit Price'),
                        chalk.cyan('Exit Reason'),
                        chalk.cyan('P/L %'),
                        chalk.cyan('P/L $')
                    ],
                    colWidths: [20, 10, 12, 12, 15, 10, 12]
                });
                
                results.tradeHistory.forEach(trade => {
                    const plColor = parseFloat(trade.profitLoss) >= 0 ? chalk.green : chalk.red;
                    table.push([
                        trade.entry.timestamp.slice(0, 19).replace('T', ' '),
                        trade.entry.position,
                        trade.entry.price.toFixed(2),
                        trade.exit.price.toFixed(2),
                        trade.exit.reason,
                        plColor(trade.profitLossPercent + '%'),
                        plColor((parseFloat(trade.profitLoss) >= 0 ? '+' : '') + '$' + trade.profitLoss)
                    ]);
                });
                
                console.log(table.toString());
            }
            
            console.log('');
        } catch (error) {
            spinner.fail('Backtest failed');
            console.error(chalk.red(error.message));
            console.error(error.stack);
        }
    });

// Helper functions for backtest command
function mapTypeToSignalType(type) {
    const mapping = {
        'rsi-ob': 'INDICATOR_RsiObSignal',
        'rsi-os': 'INDICATOR_RsiOsSignal',
        'crocodile-dive': 'INDICATOR_CrocodileDiveSignal',
        'crocodile': 'INDICATOR_CrocodileSignal',
        'cross-up': 'INDICATOR_CrossUpSignal',
        'cross-down': 'INDICATOR_CrossDownSignal',
        'multi-div': 'INDICATOR_DivergenceDetector',
        'uptrend': 'INDICATOR_UptrendSignal',
        'downtrend': 'INDICATOR_DownTrendSignal',
        'woodies': 'INDICATOR_Woodies',
        'supertrend-long': 'INDICATOR_SuperTrendSignal',
        'supertrend-short': 'INDICATOR_SuperTrendSignal',
        'price-gt': 'PRICE_ACTION_GT',
        'price-lt': 'PRICE_ACTION_LT',
        'price-gte': 'PRICE_ACTION_GTE',
        'price-lte': 'PRICE_ACTION_LTE',
        'price-eq': 'PRICE_ACTION_EQ'
    };
    return mapping[type.toLowerCase()] || type;
}

function getIndicatorForType(type) {
    const mapping = {
        'rsi-ob': 'RsiIndicator',
        'rsi-os': 'RsiIndicator',
        'crocodile-dive': 'Ema3Indicator',
        'crocodile': 'Ema3Indicator',
        'cross-up': 'EMAIndicator',
        'cross-down': 'EMAIndicator',
        'multi-div': 'MultiDivergenceDetector',
        'uptrend': 'EMAIndicator',
        'downtrend': 'EMAIndicator',
        'woodies': 'Woodies',
        'supertrend-long': 'SuperTrendIndicator',
        'supertrend-short': 'SuperTrendIndicator'
    };
    return mapping[type.toLowerCase()] || null;
}

function getEvaluateFunctionForType(type) {
    const mapping = {
        'rsi-ob': signalAgent.ob.toString(),
        'rsi-os': signalAgent.os.toString(),
        'crocodile-dive': signalAgent.crocodileDive.toString(),
        'crocodile': signalAgent.crocodile.toString(),
        'cross-up': signalAgent.crossOver.toString(),
        'cross-down': signalAgent.crossUnder.toString(),
        'multi-div': signalAgent.multiDiv.toString(),
        'uptrend': signalAgent.uptrendTrend.toString(),
        'downtrend': signalAgent.downTrend.toString(),
        'woodies': signalAgent.woodies.toString(),
        'supertrend-long': signalAgent.superTrend.toString(),
        'supertrend-short': signalAgent.superTrend.toString(),
        'price-gt': signalAgent.gt.toString(),
        'price-lt': signalAgent.lt.toString(),
        'price-gte': signalAgent.gte.toString(),
        'price-lte': signalAgent.lte.toString(),
        'price-eq': signalAgent.eq.toString()
    };
    
    return mapping[type.toLowerCase()] || signalAgent.gt.toString();
}

program.parse();
