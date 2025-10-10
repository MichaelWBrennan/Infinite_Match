#!/usr/bin/env node
/**
 * Simple Remote Config Deployer
 * Deploys Remote Config using individual key-value pairs
 */

import fs from 'fs';
import path from 'path';

class SimpleRemoteConfigDeployer {
    constructor() {
        this.configFile = path.join(process.cwd(), 'remote-config', 'game_config.json');
        this.projectId = "0dd5a03e-7f23-49c4-964e-7919c48c0574";
        this.environmentId = "1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d";
        this.clientId = process.env.UNITY_CLIENT_ID;
        this.clientSecret = process.env.UNITY_CLIENT_SECRET;
    }

    async deploy() {
        console.log('⚙️ Simple Remote Config Deployer');
        console.log('================================');
        console.log(`Project ID: ${this.projectId}`);
        console.log(`Environment ID: ${this.environmentId}`);
        console.log(`Client ID: ${this.clientId ? 'Set' : 'Not set'}`);
        console.log(`Client Secret: ${this.clientSecret ? 'Set' : 'Not set'}`);
        console.log('================================\n');

        try {
            // Load configuration
            const config = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
            console.log('✅ Configuration loaded from:', this.configFile);

            // Generate individual keys
            const individualKeys = this.generateIndividualKeys(config);
            
            console.log('\n📋 Individual Keys to Add in Unity Cloud Dashboard:');
            console.log('===================================================');
            
            individualKeys.forEach((keyData, index) => {
                console.log(`\n${index + 1}. Key: ${keyData.key}`);
                console.log(`   Value: ${keyData.value}`);
                console.log(`   Type: ${keyData.type}`);
            });

            console.log('\n🎯 Instructions:');
            console.log('1. Go to Unity Cloud Dashboard: https://cloud.unity.com/');
            console.log('2. Navigate to your project');
            console.log('3. Go to Remote Config');
            console.log('4. Click "Add Key" for each entry above');
            console.log('5. Enter the Key, Value, and Type as shown');
            console.log('6. Choose your environment and save');

            // Save to file for easy copy-paste
            const outputFile = path.join(process.cwd(), 'remote-config-keys.txt');
            const output = individualKeys.map(key => 
                `Key: ${key.key}\nValue: ${key.value}\nType: ${key.type}\n`
            ).join('\n');
            
            fs.writeFileSync(outputFile, output);
            console.log(`\n📁 Keys saved to: ${outputFile}`);

        } catch (error) {
            console.error('❌ Error:', error.message);
        }
    }

    generateIndividualKeys(config) {
        const keys = [];

        // Game Settings
        Object.entries(config.game_settings).forEach(([key, value]) => {
            keys.push({
                key: key,
                value: value,
                type: typeof value === 'number' ? 'int' : 'string'
            });
        });

        // Economy Settings
        Object.entries(config.economy_settings).forEach(([key, value]) => {
            keys.push({
                key: key,
                value: value,
                type: typeof value === 'number' ? 'float' : 'string'
            });
        });

        // Feature Flags
        Object.entries(config.feature_flags).forEach(([key, value]) => {
            keys.push({
                key: key,
                value: value,
                type: 'bool'
            });
        });

        // UI Settings
        Object.entries(config.ui_settings).forEach(([key, value]) => {
            keys.push({
                key: key,
                value: value,
                type: 'bool'
            });
        });

        // Analytics Events
        Object.entries(config.analytics_events).forEach(([key, value]) => {
            keys.push({
                key: key,
                value: value,
                type: 'bool'
            });
        });

        return keys;
    }
}

// Run the deployer
const deployer = new SimpleRemoteConfigDeployer();
deployer.deploy().catch(error => {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
});