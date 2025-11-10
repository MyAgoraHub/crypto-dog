#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';

// Import command modules
import { registerIntervalsCommand } from './commands/intervals.js';
import { registerTickersCommand } from './commands/tickers.js';
import { registerCalculateCommand } from './commands/calculate.js';
import { registerServerCommands } from './commands/server.js';
import { registerSignalCommands } from './commands/signals.js';
import { registerCacheCommand } from './commands/cache.js';
import { registerBacktestCommand } from './commands/backtest.js';
import { registerLiveFeedCommand } from './commands/live-feed.js';
import { registerCombinationsCommand } from './commands/combinations.js';
import { registerTradesCommand } from './commands/trades.js';
import { registerApiKeysCommand } from './commands/api-keys.js';
import { registerTradingBotCommand } from './commands/trade-bot.js';
import { registerAIPredictCommand } from './commands/ai-predict.js';
import { registerAIReportCommand } from './commands/ai-report.js';
import { registerAIStatusCommand } from './commands/ai-status.js';

const program = new Command();

// ASCII Art Banner
const banner = chalk.cyan(`
   ██████╗██████╗ ██╗   ██╗██████╗ ████████╗ ██████╗
  ██╔════╝██╔══██╗╚██╗ ██╔╝██╔══██╗╚══██╔══╝██╔═══██╗
  ██║     ██████╔╝ ╚████╔╝ ██████╔╝   ██║   ██║   ██║
  ██║     ██╔══██╗  ╚██╔╝  ██╔═══╝    ██║   ██║   ██║
  ╚██████╗██║  ██║   ██║   ██║        ██║   ╚██████╔╝
   ╚═════╝╚═╝  ╚═╝   ╚═╝   ╚═╝        ╚═╝    ╚═════╝

            🐕 Crypto Dog - Trading CLI 🐕
`);

console.log(banner);

program
    .name('crypto-dog')
    .description('Crypto Trading & Data Analysis CLI Tool')
    .version('1.0.0');

// Register all commands
registerIntervalsCommand(program);
registerTickersCommand(program);
registerCalculateCommand(program);
registerServerCommands(program);
registerSignalCommands(program);
registerCacheCommand(program);
registerBacktestCommand(program);
registerLiveFeedCommand(program);
registerCombinationsCommand(program);
registerTradesCommand(program);
registerApiKeysCommand(program);
registerTradingBotCommand(program);
registerAIPredictCommand(program);
registerAIReportCommand(program);
registerAIStatusCommand(program);

program.parse();
