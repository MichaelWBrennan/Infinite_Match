#!/usr/bin/env node
/**
 * Unity Cloud Secrets Manager
 * Handles reading secrets from Cursor account or environment variables
 */

class UnityCloudSecrets {
    constructor() {
        this.secrets = {};
        this.loaded = false;
    }

    /**
     * Load secrets from Cursor account or environment variables
     */
    async loadSecrets() {
        if (this.loaded) {
            return this.secrets;
        }

        // Try to get from Cursor secrets first
        try {
            if (typeof cursor !== 'undefined' && cursor.getSecret) {
                console.log('🔐 Loading secrets from Cursor account...');
                
                const secretNames = [
                    'UNITY_PROJECT_ID',
                    'UNITY_ENV_ID', 
                    'UNITY_ORG_ID',
                    'UNITY_CLIENT_ID',
                    'UNITY_CLIENT_SECRET',
                    'UNITY_API_TOKEN',
                    'UNITY_EMAIL',
                    'UNITY_PASSWORD'
                ];

                for (const name of secretNames) {
                    try {
                        this.secrets[name] = await cursor.getSecret(name);
                        if (this.secrets[name]) {
                            console.log(`   ✅ ${name}: Loaded from Cursor secrets`);
                        }
                    } catch (error) {
                        console.log(`   ⚠️ ${name}: Not found in Cursor secrets`);
                        this.secrets[name] = null;
                    }
                }
                
                console.log('✅ Secrets loaded from Cursor account');
            } else {
                throw new Error('Cursor secrets not available');
            }
        } catch (error) {
            // Fall back to environment variables
            console.log('🔐 Loading secrets from environment variables...');
            
            this.secrets = {
                UNITY_PROJECT_ID: process.env.UNITY_PROJECT_ID,
                UNITY_ENV_ID: process.env.UNITY_ENV_ID,
                UNITY_ORG_ID: process.env.UNITY_ORG_ID,
                UNITY_CLIENT_ID: process.env.UNITY_CLIENT_ID,
                UNITY_CLIENT_SECRET: process.env.UNITY_CLIENT_SECRET,
                UNITY_API_TOKEN: process.env.UNITY_API_TOKEN,
                UNITY_EMAIL: process.env.UNITY_EMAIL,
                UNITY_PASSWORD: process.env.UNITY_PASSWORD
            };

            // Log which secrets are available
            Object.entries(this.secrets).forEach(([name, value]) => {
                if (value) {
                    console.log(`   ✅ ${name}: Loaded from environment`);
                } else {
                    console.log(`   ❌ ${name}: Not found`);
                }
            });
        }

        this.loaded = true;
        return this.secrets;
    }

    /**
     * Get a specific secret
     */
    getSecret(name) {
        return this.secrets[name];
    }

    /**
     * Check if all required secrets are available
     */
    validateSecrets() {
        const required = ['UNITY_CLIENT_ID', 'UNITY_CLIENT_SECRET'];
        const missing = required.filter(name => !this.secrets[name]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required secrets: ${missing.join(', ')}`);
        }
        
        return true;
    }

    /**
     * Get project configuration
     */
    getProjectConfig() {
        return {
            projectId: this.secrets.UNITY_PROJECT_ID || "0dd5a03e-7f23-49c4-964e-7919c48c0574",
            environmentId: this.secrets.UNITY_ENV_ID || "1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d",
            organizationId: this.secrets.UNITY_ORG_ID || "2473931369648"
        };
    }

    /**
     * Get authentication credentials
     */
    getAuthCredentials() {
        return {
            clientId: this.secrets.UNITY_CLIENT_ID,
            clientSecret: this.secrets.UNITY_CLIENT_SECRET,
            accessToken: this.secrets.UNITY_API_TOKEN
        };
    }
}

export default UnityCloudSecrets;