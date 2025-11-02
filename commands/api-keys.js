import inquirer from 'inquirer';
import chalk from 'chalk';
import { initializeDB, getApiKeys, saveApiKey, updateApiKey } from '../core/repository/dbManager.js';

export const registerApiKeysCommand = (program) => {
    const apiKeysCmd = program
        .command('api-keys')
        .description('Manage Bybit API keys for mainnet and testnet');

    apiKeysCmd
        .command('add')
        .description('Add or update Bybit API keys')
        .action(async () => {
            try {
                await initializeDB();

                console.log(chalk.cyan('\n🔑 Bybit API Keys Management\n'));

                // Get current API keys
                const currentKeys = await getApiKeys();
                const mainnetKey = currentKeys.find(key => key.environment === 'mainnet');
                const testnetKey = currentKeys.find(key => key.environment === 'testnet');

                console.log(chalk.gray('Current API Keys:'));
                console.log(`Mainnet: ${mainnetKey ? chalk.green('✓ Configured') : chalk.red('✗ Not configured')}`);
                console.log(`Testnet: ${testnetKey ? chalk.green('✓ Configured') : chalk.red('✗ Not configured')}\n`);

                // Ask which environment to configure
                const { environment } = await inquirer.prompt([
                    {
                        type: 'list',
                        name: 'environment',
                        message: 'Which environment would you like to configure?',
                        choices: [
                            { name: 'Mainnet (Live Trading)', value: 'mainnet' },
                            { name: 'Testnet (Paper Trading)', value: 'testnet' }
                        ]
                    }
                ]);

                const existingKey = environment === 'mainnet' ? mainnetKey : testnetKey;
                const isUpdate = !!existingKey;

                console.log(chalk.cyan(`\n${isUpdate ? 'Updating' : 'Adding'} ${environment} API key:`));
                console.log(chalk.yellow('⚠️  Important: Get your API keys from:'));
                console.log(chalk.blue(`   ${environment === 'mainnet' ? 'https://www.bybit.com/app/user/api-management' : 'https://testnet.bybit.com/app/user/api-management'}`));
                console.log(chalk.gray('   Make sure to enable the necessary permissions for your use case.\n'));

                // Ask for API credentials
                const answers = await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'apiKey',
                        message: 'API Key:',
                        default: existingKey?.apiKey || '',
                        validate: (input) => {
                            if (!input.trim()) {
                                return 'API Key is required';
                            }
                            if (input.length < 10) {
                                return 'API Key seems too short';
                            }
                            return true;
                        }
                    },
                    {
                        type: 'password',
                        name: 'apiSecret',
                        message: 'API Secret:',
                        default: existingKey?.apiSecret || '',
                        validate: (input) => {
                            if (!input.trim()) {
                                return 'API Secret is required';
                            }
                            if (input.length < 10) {
                                return 'API Secret seems too short';
                            }
                            return true;
                        }
                    },
                    {
                        type: 'confirm',
                        name: 'confirm',
                        message: `Are you sure you want to ${isUpdate ? 'update' : 'save'} the ${environment} API key?`,
                        default: false
                    }
                ]);

                if (!answers.confirm) {
                    console.log(chalk.yellow('\n❌ Operation cancelled.'));
                    return;
                }

                // Create or update the API key
                const apiKeyData = {
                    environment,
                    apiKey: answers.apiKey.trim(),
                    apiSecret: answers.apiSecret.trim(),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                if (isUpdate) {
                    await updateApiKey(existingKey.id, apiKeyData);
                    console.log(chalk.green(`\n✅ ${environment} API key updated successfully!`));
                } else {
                    await saveApiKey(apiKeyData);
                    console.log(chalk.green(`\n✅ ${environment} API key added successfully!`));
                }

                console.log(chalk.gray('\n🔒 Your API keys are stored securely in the local database.'));

            } catch (error) {
                console.error(chalk.red('\n❌ Error managing API keys:'), error.message);
                process.exit(1);
            }
        });

    apiKeysCmd
        .command('list')
        .description('List configured API keys')
        .action(async () => {
            try {
                await initializeDB();

                console.log(chalk.cyan('\n🔑 Configured API Keys\n'));

                const apiKeys = await getApiKeys();

                if (apiKeys.length === 0) {
                    console.log(chalk.yellow('No API keys configured.'));
                    console.log(chalk.gray('Use "crypto-dog api-keys add" to add your first API key.'));
                    return;
                }

                apiKeys.forEach((key, index) => {
                    console.log(chalk.blue(`${index + 1}. ${key.environment.toUpperCase()}`));
                    console.log(`   API Key: ${key.apiKey.substring(0, 8)}...${key.apiKey.substring(key.apiKey.length - 4)}`);
                    console.log(`   Created: ${new Date(key.createdAt).toLocaleDateString()}`);
                    console.log(`   Updated: ${new Date(key.updatedAt).toLocaleDateString()}\n`);
                });

            } catch (error) {
                console.error(chalk.red('\n❌ Error listing API keys:'), error.message);
                process.exit(1);
            }
        });

    apiKeysCmd
        .command('remove <environment>')
        .description('Remove API key for specified environment (mainnet or testnet)')
        .action(async (environment) => {
            try {
                if (!['mainnet', 'testnet'].includes(environment)) {
                    console.error(chalk.red('\n❌ Invalid environment. Use "mainnet" or "testnet".'));
                    process.exit(1);
                }

                await initializeDB();

                const apiKeys = await getApiKeys();
                const keyToRemove = apiKeys.find(key => key.environment === environment);

                if (!keyToRemove) {
                    console.log(chalk.yellow(`\n⚠️  No ${environment} API key found.`));
                    return;
                }

                const { confirm } = await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'confirm',
                        message: `Are you sure you want to remove the ${environment} API key?`,
                        default: false
                    }
                ]);

                if (!confirm) {
                    console.log(chalk.yellow('\n❌ Operation cancelled.'));
                    return;
                }

                await removeApiKey(keyToRemove.id);
                console.log(chalk.green(`\n✅ ${environment} API key removed successfully!`));

            } catch (error) {
                console.error(chalk.red('\n❌ Error removing API key:'), error.message);
                process.exit(1);
            }
        });
};
