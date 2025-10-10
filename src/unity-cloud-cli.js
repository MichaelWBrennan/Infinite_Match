#!/usr/bin/env node
/**
 * Unity Cloud CLI
 * Command-line interface for Unity Cloud headless operations
 */

import UnityCloudHeadlessIntegration from './unity-cloud-headless-integration.js';
import UnityCloudAPIClient from './unity-cloud-api-client.js';
// Using basic console output instead of external dependencies

// CLI Commands
class UnityCloudCLI {
    constructor() {
        this.setupCommands();
    }

    setupCommands() {
        program
            .name('unity-cloud-cli')
            .description('Unity Cloud headless management CLI')
            .version('1.0.0');

        // Deploy command
        program
            .command('deploy')
            .description('Deploy all Unity Cloud services from local files')
            .option('-e, --economy', 'Deploy economy service only')
            .option('-c, --cloud-code', 'Deploy cloud code service only')
            .option('-r, --remote-config', 'Deploy remote config service only')
            .option('-a, --analytics', 'Deploy analytics service only')
            .action(async (options) => {
                await this.deployCommand(options);
            });

        // Sync command
        program
            .command('sync')
            .description('Sync local data with Unity Cloud')
            .action(async () => {
                await this.syncCommand();
            });

        // Status command
        program
            .command('status')
            .description('Check Unity Cloud service status')
            .action(async () => {
                await this.statusCommand();
            });

        // Health command
        program
            .command('health')
            .description('Check Unity Cloud service health')
            .action(async () => {
                await this.healthCommand();
            });

        // Economy commands
        program
            .command('economy')
            .description('Economy service operations')
            .option('-l, --list', 'List all economy data')
            .option('-c, --currencies', 'List currencies only')
            .option('-i, --inventory', 'List inventory only')
            .option('-a, --catalog', 'List catalog only')
            .action(async (options) => {
                await this.economyCommand(options);
            });

        // Cloud Code commands
        program
            .command('cloud-code')
            .description('Cloud Code service operations')
            .option('-l, --list', 'List all cloud code functions')
            .option('-e, --execute <functionId>', 'Execute cloud code function')
            .action(async (options) => {
                await this.cloudCodeCommand(options);
            });

        // Remote Config commands
        program
            .command('remote-config')
            .description('Remote Config service operations')
            .option('-l, --list', 'List all remote config entries')
            .action(async (options) => {
                await this.remoteConfigCommand(options);
            });

        // Analytics commands
        program
            .command('analytics')
            .description('Analytics service operations')
            .option('-l, --list', 'List recent analytics events')
            .option('-s, --send <eventName>', 'Send analytics event')
            .action(async (options) => {
                await this.analyticsCommand(options);
            });
    }

    async deployCommand(options) {
        console.log(chalk.blue('🚀 Starting Unity Cloud deployment...'));
        
        try {
            const integration = new UnityCloudHeadlessIntegration();
            
            if (options.economy) {
                console.log(chalk.yellow('💰 Deploying Economy service only...'));
                await integration.deployEconomy();
            } else if (options.cloudCode) {
                console.log(chalk.yellow('☁️ Deploying Cloud Code service only...'));
                await integration.deployCloudCode();
            } else if (options.remoteConfig) {
                console.log(chalk.yellow('⚙️ Deploying Remote Config service only...'));
                await integration.deployRemoteConfig();
            } else if (options.analytics) {
                console.log(chalk.yellow('📊 Deploying Analytics service only...'));
                await integration.deployAnalytics();
            } else {
                console.log(chalk.yellow('🎯 Deploying all services...'));
                await integration.deployAll();
            }
            
            console.log(chalk.green('✅ Deployment completed successfully!'));
        } catch (error) {
            console.error(chalk.red('❌ Deployment failed:'), error.message);
            process.exit(1);
        }
    }

    async syncCommand() {
        console.log(chalk.blue('🔄 Syncing local data with Unity Cloud...'));
        
        try {
            const integration = new UnityCloudHeadlessIntegration();
            await integration.syncData();
            console.log(chalk.green('✅ Sync completed successfully!'));
        } catch (error) {
            console.error(chalk.red('❌ Sync failed:'), error.message);
            process.exit(1);
        }
    }

    async statusCommand() {
        console.log(chalk.blue('📊 Checking Unity Cloud status...'));
        
        try {
            const integration = new UnityCloudHeadlessIntegration();
            const report = await integration.apiClient.generateStatusReport();
            
            console.log(chalk.green('\n✅ Unity Cloud Status Report:'));
            console.log(`Project ID: ${report.projectId}`);
            console.log(`Environment ID: ${report.environmentId}`);
            console.log(`Timestamp: ${report.timestamp}`);
            
            // Display service health
            console.log(chalk.yellow('\n🔍 Service Health:'));
            Object.entries(report.health.services).forEach(([service, status]) => {
                const statusIcon = status.status === 'healthy' ? '✅' : '❌';
                const statusColor = status.status === 'healthy' ? chalk.green : chalk.red;
                console.log(`   ${statusIcon} ${service}: ${statusColor(status.message)}`);
            });
            
            // Display data counts
            if (report.data) {
                console.log(chalk.yellow('\n📊 Data Summary:'));
                if (report.data.currencies) {
                    console.log(`   Currencies: ${report.data.currencies.length || 0}`);
                }
                if (report.data.inventory) {
                    console.log(`   Inventory Items: ${report.data.inventory.length || 0}`);
                }
                if (report.data.catalog) {
                    console.log(`   Catalog Items: ${report.data.catalog.length || 0}`);
                }
                if (report.data.remoteConfig) {
                    console.log(`   Remote Config Entries: ${report.data.remoteConfig.length || 0}`);
                }
                if (report.data.cloudCode) {
                    console.log(`   Cloud Code Functions: ${report.data.cloudCode.length || 0}`);
                }
            }
            
        } catch (error) {
            console.error(chalk.red('❌ Status check failed:'), error.message);
            process.exit(1);
        }
    }

    async healthCommand() {
        console.log(chalk.blue('🔍 Checking Unity Cloud service health...'));
        
        try {
            const integration = new UnityCloudHeadlessIntegration();
            const health = await integration.apiClient.checkServiceHealth();
            
            console.log(chalk.green('\n✅ Unity Cloud Health Check:'));
            console.log(`Project ID: ${health.projectId}`);
            console.log(`Environment ID: ${health.environmentId}`);
            console.log(`Timestamp: ${health.timestamp}`);
            
            // Display authentication status
            const authIcon = health.authentication.status === 'healthy' ? '✅' : '❌';
            const authColor = health.authentication.status === 'healthy' ? chalk.green : chalk.red;
            console.log(`\n🔐 Authentication: ${authIcon} ${authColor(health.authentication.message)}`);
            
            // Display service status
            console.log(chalk.yellow('\n🔍 Services:'));
            Object.entries(health.services).forEach(([service, status]) => {
                const statusIcon = status.status === 'healthy' ? '✅' : '❌';
                const statusColor = status.status === 'healthy' ? chalk.green : chalk.red;
                console.log(`   ${statusIcon} ${service}: ${statusColor(status.message)}`);
            });
            
        } catch (error) {
            console.error(chalk.red('❌ Health check failed:'), error.message);
            process.exit(1);
        }
    }

    async economyCommand(options) {
        console.log(chalk.blue('💰 Economy service operations...'));
        
        try {
            const integration = new UnityCloudHeadlessIntegration();
            await integration.initialize();
            
            if (options.list || options.currencies) {
                console.log(chalk.yellow('\n💵 Currencies:'));
                const currencies = await integration.apiClient.getCurrencies();
                currencies.forEach(currency => {
                    console.log(`   - ${currency.id}: ${currency.name} (${currency.type})`);
                });
            }
            
            if (options.list || options.inventory) {
                console.log(chalk.yellow('\n🎒 Inventory Items:'));
                const inventory = await integration.apiClient.getInventoryItems();
                inventory.forEach(item => {
                    console.log(`   - ${item.id}: ${item.name} (${item.type})`);
                });
            }
            
            if (options.list || options.catalog) {
                console.log(chalk.yellow('\n🛒 Catalog Items:'));
                const catalog = await integration.apiClient.getCatalogItems();
                catalog.forEach(item => {
                    console.log(`   - ${item.id}: ${item.name} (${item.cost_amount} ${item.cost_currency})`);
                });
            }
            
        } catch (error) {
            console.error(chalk.red('❌ Economy operation failed:'), error.message);
            process.exit(1);
        }
    }

    async cloudCodeCommand(options) {
        console.log(chalk.blue('☁️ Cloud Code service operations...'));
        
        try {
            const integration = new UnityCloudHeadlessIntegration();
            await integration.initialize();
            
            if (options.list) {
                console.log(chalk.yellow('\n🔧 Cloud Code Functions:'));
                const functions = await integration.apiClient.getCloudCodeFunctions();
                functions.forEach(func => {
                    console.log(`   - ${func.name}: ${func.description || 'No description'}`);
                });
            }
            
            if (options.execute) {
                console.log(chalk.yellow(`\n⚡ Executing function: ${options.execute}`));
                const result = await integration.apiClient.executeCloudCodeFunction(options.execute);
                console.log(chalk.green('✅ Function executed successfully:'));
                console.log(JSON.stringify(result, null, 2));
            }
            
        } catch (error) {
            console.error(chalk.red('❌ Cloud Code operation failed:'), error.message);
            process.exit(1);
        }
    }

    async remoteConfigCommand(options) {
        console.log(chalk.blue('⚙️ Remote Config service operations...'));
        
        try {
            const integration = new UnityCloudHeadlessIntegration();
            await integration.initialize();
            
            if (options.list) {
                console.log(chalk.yellow('\n🔧 Remote Config Entries:'));
                const configs = await integration.apiClient.getRemoteConfigs();
                configs.forEach(config => {
                    console.log(`   - ${config.key}: ${config.value} (${config.type})`);
                });
            }
            
        } catch (error) {
            console.error(chalk.red('❌ Remote Config operation failed:'), error.message);
            process.exit(1);
        }
    }

    async analyticsCommand(options) {
        console.log(chalk.blue('📊 Analytics service operations...'));
        
        try {
            const integration = new UnityCloudHeadlessIntegration();
            await integration.initialize();
            
            if (options.list) {
                console.log(chalk.yellow('\n📈 Recent Analytics Events:'));
                const events = await integration.apiClient.getAnalyticsEvents();
                events.forEach(event => {
                    console.log(`   - ${event.eventName}: ${event.timestamp}`);
                });
            }
            
            if (options.send) {
                console.log(chalk.yellow(`\n📤 Sending event: ${options.send}`));
                const eventData = {
                    eventName: options.send,
                    timestamp: new Date().toISOString(),
                    properties: {
                        source: 'unity-cloud-cli'
                    }
                };
                await integration.apiClient.sendAnalyticsEvent(eventData);
                console.log(chalk.green('✅ Event sent successfully!'));
            }
            
        } catch (error) {
            console.error(chalk.red('❌ Analytics operation failed:'), error.message);
            process.exit(1);
        }
    }

    run() {
        program.parse();
    }
}

// Run CLI
const cli = new UnityCloudCLI();
cli.run();