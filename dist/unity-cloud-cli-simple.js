#!/usr/bin/env node
/**
 * Unity Gaming Services (UGS) CLI - Simplified Version
 * Command-line interface for UGS headless operations
 * No external dependencies required
 */
import UnityGamingServicesHeadlessIntegration from './unity-cloud-headless-integration.js';
import UnityGamingServicesAPIClient from './unity-cloud-api-client.js';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
class UnityGamingServicesCLISimple {
    constructor() {
        this.commands = {
            deploy: this.deployCommand.bind(this),
            sync: this.syncCommand.bind(this),
            status: this.statusCommand.bind(this),
            health: this.healthCommand.bind(this),
            economy: this.economyCommand.bind(this),
            'cloud-code': this.cloudCodeCommand.bind(this),
            'remote-config': this.remoteConfigCommand.bind(this),
            analytics: this.analyticsCommand.bind(this),
            // Cloud-only build commands (proxy to unity-wrapper)
            build: this.buildCommand.bind(this),
            'build-status': this.buildStatusCommand.bind(this),
            'build-download': this.buildDownloadCommand.bind(this),
            'build-list': this.buildListCommand.bind(this),
            help: this.helpCommand.bind(this),
        };
    }
    async runWrapper(args) {
        const wrapperPath = path.resolve(__dirname, '..', 'unity-wrapper');
        return new Promise((resolve, reject) => {
            const child = spawn(wrapperPath, args, {
                stdio: 'inherit',
                env: process.env,
            });
            child.on('exit', (code) => {
                if (code === 0)
                    return resolve();
                reject(new Error(`unity-wrapper exited with code ${code}`));
            });
            child.on('error', (err) => reject(err));
        });
    }
    async buildCommand(args = []) {
        const target = args[0] || process.env.UNITY_TARGET;
        if (!target) {
            console.error('❌ Build target required. Usage: build <target>');
            process.exit(1);
        }
        console.log(`🚀 Triggering Unity Cloud Build for target: ${target}`);
        await this.runWrapper(['build', target]);
    }
    async buildStatusCommand(args = []) {
        const target = args[0] || process.env.UNITY_TARGET;
        if (!target) {
            console.error('❌ Build target required. Usage: build-status <target>');
            process.exit(1);
        }
        await this.runWrapper(['status', target]);
    }
    async buildDownloadCommand(args = []) {
        const target = args[0] || process.env.UNITY_TARGET;
        if (!target) {
            console.error('❌ Build target required. Usage: build-download <target>');
            process.exit(1);
        }
        await this.runWrapper(['download', target]);
    }
    async buildListCommand(args = []) {
        await this.runWrapper(['list']);
    }
    async deployCommand(args = []) {
        console.log('🚀 Starting Unity Cloud deployment...');
        try {
            const integration = new UnityGamingServicesHeadlessIntegration();
            if (args.includes('--economy')) {
                console.log('💰 Deploying Economy service only...');
                await integration.deployEconomy();
            }
            else if (args.includes('--cloud-code')) {
                console.log('☁️ Deploying Cloud Code service only...');
                await integration.deployCloudCode();
            }
            else if (args.includes('--remote-config')) {
                console.log('⚙️ Deploying Remote Config service only...');
                await integration.deployRemoteConfig();
            }
            else if (args.includes('--analytics')) {
                console.log('📊 Deploying Analytics service only...');
                await integration.deployAnalytics();
            }
            else {
                console.log('🎯 Deploying all services...');
                await integration.deployAll();
            }
            console.log('✅ Deployment completed successfully!');
        }
        catch (error) {
            console.error('❌ Deployment failed:', error.message);
            process.exit(1);
        }
    }
    async syncCommand(args = []) {
        console.log('🔄 Syncing local data with Unity Cloud...');
        try {
            const integration = new UnityGamingServicesHeadlessIntegration();
            await integration.syncData();
            console.log('✅ Sync completed successfully!');
        }
        catch (error) {
            console.error('❌ Sync failed:', error.message);
            process.exit(1);
        }
    }
    async statusCommand(args = []) {
        console.log('📊 Checking Unity Cloud status...');
        try {
            const integration = new UnityGamingServicesHeadlessIntegration();
            const report = await integration.apiClient.generateStatusReport();
            console.log('\n✅ Unity Cloud Status Report:');
            console.log(`Project ID: ${report.projectId}`);
            console.log(`Environment ID: ${report.environmentId}`);
            console.log(`Timestamp: ${report.timestamp}`);
            // Display service health
            console.log('\n🔍 Service Health:');
            Object.entries(report.health.services).forEach(([service, status]) => {
                const statusIcon = status.status === 'healthy' ? '✅' : '❌';
                console.log(`   ${statusIcon} ${service}: ${status.message}`);
            });
            // Display data counts
            if (report.data) {
                console.log('\n📊 Data Summary:');
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
        }
        catch (error) {
            console.error('❌ Status check failed:', error.message);
            process.exit(1);
        }
    }
    async healthCommand(args = []) {
        console.log('🔍 Checking Unity Cloud service health...');
        try {
            const integration = new UnityGamingServicesHeadlessIntegration();
            const health = await integration.apiClient.checkServiceHealth();
            console.log('\n✅ Unity Cloud Health Check:');
            console.log(`Project ID: ${health.projectId}`);
            console.log(`Environment ID: ${health.environmentId}`);
            console.log(`Timestamp: ${health.timestamp}`);
            // Display authentication status
            const authIcon = health.authentication.status === 'healthy' ? '✅' : '❌';
            console.log(`\n🔐 Authentication: ${authIcon} ${health.authentication.message}`);
            // Display service status
            console.log('\n🔍 Services:');
            Object.entries(health.services).forEach(([service, status]) => {
                const statusIcon = status.status === 'healthy' ? '✅' : '❌';
                console.log(`   ${statusIcon} ${service}: ${status.message}`);
            });
        }
        catch (error) {
            console.error('❌ Health check failed:', error.message);
            process.exit(1);
        }
    }
    async economyCommand(args = []) {
        console.log('💰 Economy service operations...');
        try {
            const integration = new UnityGamingServicesHeadlessIntegration();
            await integration.initialize();
            if (args.includes('--list') || args.includes('-l')) {
                console.log('\n💵 Currencies:');
                const currencies = await integration.apiClient.getCurrencies();
                currencies.forEach((currency) => {
                    console.log(`   - ${currency.id}: ${currency.name} (${currency.type})`);
                });
            }
        }
        catch (error) {
            console.error('❌ Economy operation failed:', error.message);
            process.exit(1);
        }
    }
    async cloudCodeCommand(args = []) {
        console.log('☁️ Cloud Code service operations...');
        try {
            const integration = new UnityGamingServicesHeadlessIntegration();
            await integration.initialize();
            if (args.includes('--list') || args.includes('-l')) {
                console.log('\n🔧 Cloud Code Functions:');
                const functions = await integration.apiClient.getCloudCodeFunctions();
                functions.forEach((func) => {
                    console.log(`   - ${func.name}: ${func.description || 'No description'}`);
                });
            }
        }
        catch (error) {
            console.error('❌ Cloud Code operation failed:', error.message);
            process.exit(1);
        }
    }
    async remoteConfigCommand(args = []) {
        console.log('⚙️ Remote Config service operations...');
        try {
            const integration = new UnityGamingServicesHeadlessIntegration();
            await integration.initialize();
            if (args.includes('--list') || args.includes('-l')) {
                console.log('\n🔧 Remote Config Entries:');
                const configs = await integration.apiClient.getRemoteConfigs();
                configs.forEach((config) => {
                    console.log(`   - ${config.key}: ${config.value} (${config.type})`);
                });
            }
        }
        catch (error) {
            console.error('❌ Remote Config operation failed:', error.message);
            process.exit(1);
        }
    }
    async analyticsCommand(args = []) {
        console.log('📊 Analytics service operations...');
        try {
            const integration = new UnityGamingServicesHeadlessIntegration();
            await integration.initialize();
            if (args.includes('--list') || args.includes('-l')) {
                console.log('\n📈 Recent Analytics Events:');
                const events = await integration.apiClient.getAnalyticsEvents();
                events.forEach((event) => {
                    console.log(`   - ${event.eventName}: ${event.timestamp}`);
                });
            }
        }
        catch (error) {
            console.error('❌ Analytics operation failed:', error.message);
            process.exit(1);
        }
    }
    helpCommand(args = []) {
        console.log('🎮 Unity Cloud CLI - Help');
        console.log('========================');
        console.log('');
        console.log('Available commands:');
        console.log('  deploy [options]     Deploy Unity Cloud services');
        console.log('    --economy         Deploy economy service only');
        console.log('    --cloud-code      Deploy cloud code service only');
        console.log('    --remote-config   Deploy remote config service only');
        console.log('    --analytics       Deploy analytics service only');
        console.log('');
        console.log('  sync                Sync local data with Unity Cloud');
        console.log('  status              Check Unity Cloud status');
        console.log('  health              Check Unity Cloud service health');
        console.log('  economy --list      List economy data');
        console.log('  cloud-code --list   List cloud code functions');
        console.log('  remote-config --list List remote config entries');
        console.log('  analytics --list    List analytics events');
        console.log('  help                Show this help message');
        console.log('');
        console.log('Examples:');
        console.log('  node src/unity-cloud-cli-simple.js deploy');
        console.log('  node src/unity-cloud-cli-simple.js status');
        console.log('  node src/unity-cloud-cli-simple.js economy --list');
    }
    async run() {
        const args = process.argv.slice(2);
        const command = args[0] || 'help';
        const commandArgs = args.slice(1);
        if (this.commands[command]) {
            await this.commands[command](commandArgs);
        }
        else {
            console.error(`❌ Unknown command: ${command}`);
            console.log('Run "node src/unity-cloud-cli-simple.js help" for available commands.');
            process.exit(1);
        }
    }
}
// Run CLI
const cli = new UnityGamingServicesCLISimple();
cli.run().catch((error) => {
    console.error('❌ CLI failed:', error);
    process.exit(1);
});
//# sourceMappingURL=unity-cloud-cli-simple.js.map