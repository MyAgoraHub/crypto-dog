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
        .option('--api-only', 'Start only the API server without portal')
        .action((options) => {
            console.log(chalk.green('\n🌐 Starting Crypto Dog Server...\n'));

            const processes = [];

            // Start API Server
            const apiServer = spawn('node', ['server.js'], {
                stdio: 'inherit',
                env: { ...process.env, PORT: options.port }
            });

            processes.push({ name: 'API Server', process: apiServer });

            console.log(chalk.cyan(`✓ API Server running on http://localhost:${options.port}`));

            apiServer.on('error', (error) => {
                console.error(chalk.red('Failed to start API server:'), error.message);
            });

            // Start Portal (Vite) unless --api-only flag is set
            let portalServer;
            if (!options.apiOnly) {
                console.log(chalk.cyan('✓ Starting Portal (Vite dev server)...'));
                
                portalServer = spawn('npm', ['run', 'dev'], {
                    cwd: './portal',
                    stdio: 'inherit',
                    shell: true
                });

                processes.push({ name: 'Portal', process: portalServer });

                portalServer.on('error', (error) => {
                    console.error(chalk.red('Failed to start portal:'), error.message);
                });
            }

            console.log(chalk.green('\n✨ All services started!'));
            console.log(chalk.cyan('Press Ctrl+C to stop all services\n'));

            // Graceful shutdown handler
            const cleanup = () => {
                console.log(chalk.yellow('\n\n🛑 Shutting down services...'));
                
                processes.forEach(({ name, process }) => {
                    if (process && !process.killed) {
                        console.log(chalk.gray(`  Stopping ${name}...`));
                        process.kill('SIGTERM');
                    }
                });

                // Force kill after timeout
                setTimeout(() => {
                    processes.forEach(({ name, process }) => {
                        if (process && !process.killed) {
                            console.log(chalk.gray(`  Force stopping ${name}...`));
                            process.kill('SIGKILL');
                        }
                    });
                    console.log(chalk.green('✓ All services stopped\n'));
                    process.exit(0);
                }, 2000);
            };

            // Handle SIGINT (Ctrl+C)
            process.on('SIGINT', cleanup);
            
            // Handle SIGTERM
            process.on('SIGTERM', cleanup);

            // Handle process exit
            apiServer.on('exit', (code) => {
                if (code !== 0 && code !== null) {
                    console.error(chalk.red(`API Server exited with code ${code}`));
                    cleanup();
                }
            });

            if (portalServer) {
                portalServer.on('exit', (code) => {
                    if (code !== 0 && code !== null) {
                        console.error(chalk.red(`Portal exited with code ${code}`));
                        cleanup();
                    }
                });
            }
        });
}
