import chalk from 'chalk';

export function registerCacheCommand(program) {
    program
        .command('cache')
        .description('Manage data cache')
        .option('--stats', 'Show cache statistics')
        .option('--clear', 'Clear all cached data')
        .option('--clear-symbol <symbol>', 'Clear cache for specific symbol')
        .option('--clear-interval <interval>', 'Clear cache for specific interval')
        .action(async (options) => {
            const { getCacheStats, clearCache } = await import('../core/indicator/impl/indicatorManager.js');

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
}
