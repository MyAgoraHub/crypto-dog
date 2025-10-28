import chalk from 'chalk';
import { spawn } from 'child_process';

export function registerServerCommands(program) {
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
}
