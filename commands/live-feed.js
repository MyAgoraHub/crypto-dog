export function registerLiveFeedCommand(program) {
    program
        .command('live-feed')
        .description('Start real-time indicator feed with terminal dashboard')
        .option('-s, --symbol <symbol>', 'Trading symbol (default: BTCUSDT)', 'BTCUSDT')
        .option('-i, --interval <interval>', 'Time interval (default: 1m)', '1m')
        .option('-t, --theme <theme>', 'Color theme: dark/light (default: dark)', 'dark')
        .action(async (options) => {
            const { startLiveFeed } = await import('../core/cryptoDogLifeFeedAgent.js');
            await startLiveFeed(options.symbol, options.interval, options.theme);
        });
}
