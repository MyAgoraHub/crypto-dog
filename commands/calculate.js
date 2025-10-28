import chalk from 'chalk';

export function registerCalculateCommand(program) {
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
}
