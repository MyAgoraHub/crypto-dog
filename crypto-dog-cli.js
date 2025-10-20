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

program.parse();
