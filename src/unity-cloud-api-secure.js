#!/usr/bin/env node
/**
 * Unity Cloud API Client - Secure Version
 * Uses secure secrets management without exposing credentials
 */

import UnitySecretsManager from '../scripts/unity-secrets-manager.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class UnityCloudAPISecure {
    constructor(options = {}) {
        // Initialize secure secrets manager
        this.secrets = new UnitySecretsManager();
        
        // Use secrets or provided options
        this.projectId = options.projectId || this.secrets.getSecret('UNITY_PROJECT_ID') || "0dd5a03e-7f23-49c4-964e-7919c48c0574";
        this.environmentId = options.environmentId || this.secrets.getSecret('UNITY_ENV_ID') || "1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d";
        this.organizationId = options.organizationId || this.secrets.getSecret('UNITY_ORG_ID') || "2473931369648";
        this.clientId = options.clientId || this.secrets.getSecret('UNITY_CLIENT_ID');
        this.clientSecret = options.clientSecret || this.secrets.getSecret('UNITY_CLIENT_SECRET');
        this.accessToken = options.accessToken || this.secrets.getSecret('UNITY_API_TOKEN');
        
        this.baseURL = "https://services.api.unity.com";
        this.authURL = "https://services.api.unity.com/auth/v1";
        
        this.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        
        this.retryAttempts = 3;
        this.retryDelay = 1000;
    }

    /**
     * Authenticate with Unity Cloud using client credentials
     */
    async authenticate() {
        if (this.accessToken) {
            this.headers['Authorization'] = `Bearer ${this.accessToken}`;
            return this.accessToken;
        }

        if (!this.clientId || !this.clientSecret) {
            throw new Error('Unity Cloud credentials not available. Please check your secrets configuration.');
        }

        try {
            const response = await fetch(`${this.authURL}/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    grant_type: 'client_credentials',
                    client_id: this.clientId,
                    client_secret: this.clientSecret
                })
            });

            if (!response.ok) {
                throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
            }

            const tokenData = await response.json();
            this.accessToken = tokenData.access_token;
            this.headers['Authorization'] = `Bearer ${this.accessToken}`;
            
            console.log('✅ Unity Cloud authentication successful');
            return this.accessToken;
        } catch (error) {
            console.error('❌ Unity Cloud authentication failed:', error.message);
            throw error;
        }
    }

    /**
     * Make authenticated API request with retry logic
     */
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const requestOptions = {
            ...options,
            headers: {
                ...this.headers,
                ...options.headers
            }
        };

        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                const response = await fetch(url, requestOptions);
                
                if (response.status === 401 && attempt < this.retryAttempts) {
                    // Token expired, re-authenticate
                    await this.authenticate();
                    requestOptions.headers['Authorization'] = `Bearer ${this.accessToken}`;
                    continue;
                }

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
                }

                return await response.json();
            } catch (error) {
                if (attempt === this.retryAttempts) {
                    throw error;
                }
                console.warn(`⚠️ API request attempt ${attempt} failed, retrying...`);
                await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
            }
        }
    }

    /**
     * Get all remote config entries
     */
    async getRemoteConfigs() {
        const endpoint = `/remote-config/v1/projects/${this.projectId}/environments/${this.environmentId}/configs`;
        return await this.makeRequest(endpoint);
    }

    /**
     * Create or update remote config entry
     */
    async createRemoteConfig(configData) {
        const endpoint = `/remote-config/v1/projects/${this.projectId}/environments/${this.environmentId}/configs`;
        return await this.makeRequest(endpoint, {
            method: 'POST',
            body: JSON.stringify(configData)
        });
    }

    /**
     * Test the secure API client
     */
    async testConnection() {
        console.log('🔐 Testing Unity Cloud API with secure secrets...');
        console.log('Project ID:', this.projectId);
        console.log('Environment ID:', this.environmentId);
        console.log('Client ID:', this.clientId ? 'Set' : 'Not set');
        console.log('Client Secret:', this.clientSecret ? 'Set' : 'Not set');
        
        try {
            await this.authenticate();
            console.log('✅ Authentication successful');
            
            // Test Remote Config
            try {
                const configs = await this.getRemoteConfigs();
                console.log('✅ Remote Config accessible:', configs);
            } catch (error) {
                console.log('⚠️ Remote Config error (expected if not enabled):', error.message);
            }
            
            return true;
        } catch (error) {
            console.error('❌ Connection test failed:', error.message);
            return false;
        }
    }
}

export default UnityCloudAPISecure;