#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import {
    getInstrumentsInfo,
    getTickers,
    getKlineCandles,
    getIntervals,
    getInterval,
    getOrderBook
} from './core/clients/cryptoDogRequestHandler.js';
import { loadCandleData } from './core/cryptoDogAgent.js';
import { CryptoDogWebSocketHandler } from './core/clients/cryptoDogWebsocketHandler.js';

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

// Command: Get kline/candle data
program
    .command('candles')
    .description('Get historical candle data')
    .requiredOption('-c, --category <category>', 'Market category (spot, linear, inverse)')
    .requiredOption('-s, --symbol <symbol>', 'Trading symbol (e.g., BTCUSDT)')
    .requiredOption('-i, --interval <interval>', 'Time interval (e.g., 1, 5, 15, 60, 240, D, W)')
    .option('-l, --limit <limit>', 'Number of candles to fetch', '10')
    .action(async (options) => {
        const spinner = ora('Fetching candle data...').start();
        try {
            const klineData = await getKlineCandles(
                options.category,
                options.symbol,
                options.interval,
                null,
                null,
                parseInt(options.limit)
            );
            spinner.succeed('Candle data fetched successfully!');

            const table = new Table({
                head: [
                    chalk.cyan('Time'),
                    chalk.cyan('Open'),
                    chalk.cyan('High'),
                    chalk.cyan('Low'),
                    chalk.cyan('Close'),
                    chalk.cyan('Volume')
                ],
                colWidths: [20, 12, 12, 12, 12, 15]
            });

            if (klineData.result && klineData.result.list) {
                klineData.result.list.forEach(candle => {
                    const [timestamp, open, high, low, close, volume] = candle;
                    const date = new Date(parseInt(timestamp)).toISOString();
                    const priceChange = parseFloat(close) - parseFloat(open);
                    const closeColor = priceChange >= 0 ? chalk.green : chalk.red;

                    table.push([
                        date.slice(0, 19).replace('T', ' '),
                        open,
                        high,
                        low,
                        closeColor(close),
                        volume
                    ]);
                });
            }

            console.log(chalk.green(`\n📈 Candle Data for ${options.symbol}:\n`));
            console.log(table.toString());
        } catch (error) {
            spinner.fail('Failed to fetch candle data');
            console.error(chalk.red(error.message));
        }
    });

// Command: Load historical candles
program
    .command('load-history')
    .description('Load historical candle data with multiple iterations')
    .requiredOption('-c, --category <category>', 'Market category (spot, linear, inverse)')
    .requiredOption('-s, --symbol <symbol>', 'Trading symbol (e.g., BTCUSDT)')
    .requiredOption('-i, --interval <interval>', 'Time interval (e.g., 1, 5, 15, 60, 240)')
    .option('-n, --iterations <iterations>', 'Number of iterations to fetch', '5')
    .option('-l, --limit <limit>', 'Candles per request', '200')
    .action(async (options) => {
        const spinner = ora('Loading historical candle data...').start();
        try {
            const candleBuffer = await loadCandleData(
                options.category,
                options.symbol,
                options.interval,
                parseInt(options.iterations),
                parseInt(options.limit)
            );
            spinner.succeed(`Loaded ${candleBuffer.length} candles successfully!`);

            console.log(chalk.green(`\n📊 Historical Data Summary:`));
            console.log(chalk.cyan(`  Symbol: ${options.symbol}`));
            console.log(chalk.cyan(`  Interval: ${options.interval}`));
            console.log(chalk.cyan(`  Total Candles: ${candleBuffer.length}`));
            
            if (candleBuffer.length > 0) {
                const firstCandle = new Date(parseInt(candleBuffer[candleBuffer.length - 1][0]));
                const lastCandle = new Date(parseInt(candleBuffer[0][0]));
                console.log(chalk.cyan(`  Date Range: ${firstCandle.toISOString()} to ${lastCandle.toISOString()}`));
            }
        } catch (error) {
            spinner.fail('Failed to load historical data');
            console.error(chalk.red(error.message));
        }
    });

// Command: Get orderbook
program
    .command('orderbook')
    .description('Get current orderbook data')
    .requiredOption('-c, --category <category>', 'Market category (spot, linear, inverse)')
    .requiredOption('-s, --symbol <symbol>', 'Trading symbol (e.g., BTCUSDT)')
    .option('-l, --limit <limit>', 'Depth limit (max 50)', '10')
    .action(async (options) => {
        const spinner = ora('Fetching orderbook...').start();
        try {
            const orderBook = await getOrderBook(
                options.category,
                options.symbol,
                parseInt(options.limit)
            );
            spinner.succeed('Orderbook fetched successfully!');

            const bidsTable = new Table({
                head: [chalk.green('Bid Price'), chalk.green('Bid Size')],
                colWidths: [20, 20]
            });

            const asksTable = new Table({
                head: [chalk.red('Ask Price'), chalk.red('Ask Size')],
                colWidths: [20, 20]
            });

            if (orderBook.result) {
                const { b: bids, a: asks } = orderBook.result;
                
                bids.slice(0, parseInt(options.limit)).forEach(([price, size]) => {
                    bidsTable.push([chalk.green(price), size]);
                });

                asks.slice(0, parseInt(options.limit)).forEach(([price, size]) => {
                    asksTable.push([chalk.red(price), size]);
                });
            }

            console.log(chalk.green(`\n📖 Order Book for ${options.symbol}:\n`));
            console.log(chalk.red('ASKS (Sell Orders):'));
            console.log(asksTable.toString());
            console.log(chalk.green('\nBIDS (Buy Orders):'));
            console.log(bidsTable.toString());
        } catch (error) {
            spinner.fail('Failed to fetch orderbook');
            console.error(chalk.red(error.message));
        }
    });

// Command: WebSocket streaming
program
    .command('stream')
    .description('Stream live market data via WebSocket')
    .requiredOption('-c, --category <category>', 'Market category (spot, linear, inverse, option)')
    .requiredOption('-t, --topics <topics...>', 'Topics to subscribe (e.g., tickers.BTCUSDT orderbook.50.ETHUSDT)')
    .option('--throttle <ms>', 'Throttle updates (ms)', '1000')
    .option('--testnet', 'Use testnet instead of mainnet')
    .action((options) => {
        console.log(chalk.green('\n🔴 Starting WebSocket stream...\n'));
        console.log(chalk.cyan(`Category: ${options.category}`));
        console.log(chalk.cyan(`Topics: ${options.topics.join(', ')}`));
        console.log(chalk.cyan(`Throttle: ${options.throttle}ms`));
        console.log(chalk.yellow('\nPress Ctrl+C to stop streaming\n'));

        const wsHandler = new CryptoDogWebSocketHandler({
            testnet: options.testnet || false,
            throttleMs: parseInt(options.throttle)
        });

        wsHandler.subscribeToTopics(options.topics, options.category);

        wsHandler.onUpdate((data) => {
            console.log(chalk.green('━'.repeat(60)));
            console.log(chalk.cyan(`[${new Date().toISOString()}]`));
            console.log(JSON.stringify(data, null, 2));
        });

        wsHandler.onException((err) => {
            console.error(chalk.red('WebSocket error:'), err.message);
        });
    });

program.parse();
