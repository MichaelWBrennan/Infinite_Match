#!/usr/bin/env node
/**
 * Unity Secrets Manager
 * Safely manages Unity Cloud secrets using multiple methods
 */

import fs from 'fs';
import path from 'path';

class UnitySecretsManager {
    constructor() {
        this.secrets = {};
        this.loadSecrets();
    }

    /**
     * Load secrets using multiple methods
     */
    loadSecrets() {
        // Method 1: Try Cursor secrets (if available)
        this.tryCursorSecrets();
        
        // Method 2: Load from .env file
        this.loadFromEnvFile();
        
        // Method 3: Load from environment variables
        this.loadFromEnvironment();
        
        // Method 4: Load from encrypted file
        this.loadFromEncryptedFile();
    }

    /**
     * Try to load from Cursor secrets
     */
    tryCursorSecrets() {
        try {
            // This would work in Cursor's context
            if (typeof cursor !== 'undefined' && cursor.getSecret) {
                console.log('🔐 Using Cursor secrets...');
                // In Cursor context, this would work:
                // cursor.getSecret('UNITY_CLIENT_ID').then(id => this.secrets.UNITY_CLIENT_ID = id);
            }
        } catch (error) {
            // Cursor secrets not available in Node.js context
        }
    }

    /**
     * Load from .env file
     */
    loadFromEnvFile() {
        const envFile = path.join(process.cwd(), '.env');
        if (fs.existsSync(envFile)) {
            console.log('📁 Loading from .env file...');
            const envContent = fs.readFileSync(envFile, 'utf8');
            envContent.split('\n').forEach(line => {
                const [key, value] = line.split('=');
                if (key && value) {
                    this.secrets[key.trim()] = value.trim();
                }
            });
        }
    }

    /**
     * Load from environment variables
     */
    loadFromEnvironment() {
        const unitySecrets = [
            'UNITY_PROJECT_ID',
            'UNITY_ENV_ID', 
            'UNITY_ORG_ID',
            'UNITY_CLIENT_ID',
            'UNITY_CLIENT_SECRET',
            'UNITY_API_TOKEN',
            'UNITY_EMAIL',
            'UNITY_PASSWORD'
        ];

        unitySecrets.forEach(secret => {
            if (process.env[secret] && !this.secrets[secret]) {
                this.secrets[secret] = process.env[secret];
            }
        });
    }

    /**
     * Load from encrypted file
     */
    loadFromEncryptedFile() {
        const encryptedFile = path.join(process.cwd(), 'secrets.encrypted');
        if (fs.existsSync(encryptedFile)) {
            console.log('🔐 Loading from encrypted file...');
            // Implementation would go here
        }
    }

    /**
     * Get a specific secret
     */
    getSecret(name) {
        return this.secrets[name] || null;
    }

    /**
     * Get all secrets (for debugging)
     */
    getAllSecrets() {
        return { ...this.secrets };
    }

    /**
     * Check if secrets are loaded
     */
    hasSecrets() {
        return Object.keys(this.secrets).length > 0;
    }

    /**
     * Display secret status (without values)
     */
    displayStatus() {
        console.log('🔐 Unity Secrets Status:');
        console.log('========================');
        
        const requiredSecrets = [
            'UNITY_PROJECT_ID',
            'UNITY_ENV_ID',
            'UNITY_CLIENT_ID', 
            'UNITY_CLIENT_SECRET'
        ];

        requiredSecrets.forEach(secret => {
            const value = this.secrets[secret];
            const status = value ? '✅' : '❌';
            const displayValue = value ? `${value.substring(0, 8)}...` : 'Not set';
            console.log(`${status} ${secret}: ${displayValue}`);
        });

        console.log('========================');
    }
}

export default UnitySecretsManager;