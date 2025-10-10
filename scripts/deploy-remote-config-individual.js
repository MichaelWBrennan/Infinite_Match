#!/usr/bin/env node
/**
 * Deploy Remote Config with Individual Keys
 * Deploys Remote Config as individual key-value pairs instead of JSON objects
 */

import UnityCloudAPIClient from '../src/unity-cloud-api-client.js';
import fs from 'fs';
import path from 'path';

class RemoteConfigIndividualDeployer {
    constructor() {
        this.apiClient = new UnityCloudAPIClient();
        this.configFile = path.join(process.cwd(), 'remote-config', 'game_config.json');
    }

    async deploy() {
        console.log('⚙️ Deploying Remote Config with Individual Keys...');
        
        try {
            // Authenticate
            await this.apiClient.authenticate();
            console.log('✅ Authentication successful');

            // Load configuration
            const config = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
            console.log('✅ Configuration loaded');

            // Deploy individual keys
            const results = {
                game_settings: await this.deployGameSettings(config.game_settings),
                economy_settings: await this.deployEconomySettings(config.economy_settings),
                feature_flags: await this.deployFeatureFlags(config.feature_flags),
                ui_settings: await this.deployUISettings(config.ui_settings),
                analytics_events: await this.deployAnalyticsEvents(config.analytics_events)
            };

            console.log('\n📊 Deployment Results:');
            Object.entries(results).forEach(([category, result]) => {
                console.log(`   ${category}: ${result.success ? '✅' : '❌'} ${result.count} keys`);
            });

        } catch (error) {
            console.error('❌ Deployment failed:', error.message);
        }
    }

    async deployGameSettings(settings) {
        console.log('\n🎮 Deploying Game Settings...');
        const keys = [
            { key: 'max_level', value: settings.max_level, type: 'int' },
            { key: 'energy_refill_time', value: settings.energy_refill_time, type: 'int' },
            { key: 'daily_reward_coins', value: settings.daily_reward_coins, type: 'int' },
            { key: 'daily_reward_gems', value: settings.daily_reward_gems, type: 'int' },
            { key: 'max_energy', value: settings.max_energy, type: 'int' },
            { key: 'energy_refill_cost_gems', value: settings.energy_refill_cost_gems, type: 'int' }
        ];

        return await this.deployKeys(keys);
    }

    async deployEconomySettings(settings) {
        console.log('\n💰 Deploying Economy Settings...');
        const keys = [
            { key: 'coin_multiplier', value: settings.coin_multiplier, type: 'float' },
            { key: 'gem_multiplier', value: settings.gem_multiplier, type: 'float' },
            { key: 'sale_discount', value: settings.sale_discount, type: 'float' },
            { key: 'daily_bonus_multiplier', value: settings.daily_bonus_multiplier, type: 'float' },
            { key: 'streak_bonus_multiplier', value: settings.streak_bonus_multiplier, type: 'float' }
        ];

        return await this.deployKeys(keys);
    }

    async deployFeatureFlags(settings) {
        console.log('\n🚩 Deploying Feature Flags...');
        const keys = [
            { key: 'new_levels_enabled', value: settings.new_levels_enabled, type: 'bool' },
            { key: 'daily_challenges_enabled', value: settings.daily_challenges_enabled, type: 'bool' },
            { key: 'social_features_enabled', value: settings.social_features_enabled, type: 'bool' },
            { key: 'ads_enabled', value: settings.ads_enabled, type: 'bool' },
            { key: 'iap_enabled', value: settings.iap_enabled, type: 'bool' },
            { key: 'economy_enabled', value: settings.economy_enabled, type: 'bool' }
        ];

        return await this.deployKeys(keys);
    }

    async deployUISettings(settings) {
        console.log('\n🖥️ Deploying UI Settings...');
        const keys = [
            { key: 'show_currency_balance', value: settings.show_currency_balance, type: 'bool' },
            { key: 'show_energy_timer', value: settings.show_energy_timer, type: 'bool' },
            { key: 'show_daily_rewards', value: settings.show_daily_rewards, type: 'bool' },
            { key: 'show_shop_notifications', value: settings.show_shop_notifications, type: 'bool' }
        ];

        return await this.deployKeys(keys);
    }

    async deployAnalyticsEvents(settings) {
        console.log('\n📊 Deploying Analytics Events...');
        const keys = [
            { key: 'economy_purchase', value: settings.economy_purchase, type: 'bool' },
            { key: 'economy_balance_change', value: settings.economy_balance_change, type: 'bool' },
            { key: 'economy_inventory_change', value: settings.economy_inventory_change, type: 'bool' },
            { key: 'level_completed', value: settings.level_completed, type: 'bool' },
            { key: 'streak_achieved', value: settings.streak_achieved, type: 'bool' },
            { key: 'currency_awarded', value: settings.currency_awarded, type: 'bool' },
            { key: 'booster_used', value: settings.booster_used, type: 'bool' },
            { key: 'pack_opened', value: settings.pack_opened, type: 'bool' }
        ];

        return await this.deployKeys(keys);
    }

    async deployKeys(keys) {
        let successCount = 0;
        let errorCount = 0;

        for (const keyData of keys) {
            try {
                const configData = {
                    key: keyData.key,
                    value: keyData.value,
                    type: keyData.type
                };

                await this.apiClient.createRemoteConfig(configData);
                console.log(`   ✅ ${keyData.key}: ${keyData.value} (${keyData.type})`);
                successCount++;
            } catch (error) {
                console.log(`   ❌ ${keyData.key}: ${error.message}`);
                errorCount++;
            }
        }

        return {
            success: errorCount === 0,
            count: successCount,
            errors: errorCount
        };
    }
}

// Run the deployer
const deployer = new RemoteConfigIndividualDeployer();
deployer.deploy().catch(error => {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
});