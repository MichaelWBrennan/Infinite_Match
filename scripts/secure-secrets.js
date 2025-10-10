#!/usr/bin/env node
/**
 * Secure Secrets Manager
 * Handles secrets securely without exposing them in code
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

class SecureSecretsManager {
    constructor() {
        this.secretsFile = path.join(process.cwd(), 'secrets.encrypted');
        this.keyFile = path.join(process.cwd(), '.secret-key');
        this.algorithm = 'aes-256-gcm';
    }

    /**
     * Generate or load encryption key
     */
    getEncryptionKey() {
        if (fs.existsSync(this.keyFile)) {
            return fs.readFileSync(this.keyFile);
        }
        
        // Generate new key
        const key = crypto.randomBytes(32);
        fs.writeFileSync(this.keyFile, key);
        console.log('🔑 Generated new encryption key');
        return key;
    }

    /**
     * Encrypt and save secrets
     */
    saveSecrets(secrets) {
        const key = this.getEncryptionKey();
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher(this.algorithm, key);
        cipher.setAAD(Buffer.from('unity-cloud-secrets'));
        
        let encrypted = cipher.update(JSON.stringify(secrets), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        const encryptedData = {
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex'),
            data: encrypted
        };
        
        fs.writeFileSync(this.secretsFile, JSON.stringify(encryptedData));
        console.log('🔐 Secrets encrypted and saved');
    }

    /**
     * Decrypt and load secrets
     */
    loadSecrets() {
        if (!fs.existsSync(this.secretsFile)) {
            console.log('❌ No encrypted secrets file found');
            return null;
        }

        try {
            const key = this.getEncryptionKey();
            const encryptedData = JSON.parse(fs.readFileSync(this.secretsFile, 'utf8'));
            
            const decipher = crypto.createDecipher(this.algorithm, key);
            decipher.setAAD(Buffer.from('unity-cloud-secrets'));
            decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
            
            let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return JSON.parse(decrypted);
        } catch (error) {
            console.error('❌ Failed to decrypt secrets:', error.message);
            return null;
        }
    }

    /**
     * Get a specific secret
     */
    getSecret(name) {
        const secrets = this.loadSecrets();
        return secrets ? secrets[name] : null;
    }

    /**
     * Set environment variables from encrypted secrets
     */
    loadToEnvironment() {
        const secrets = this.loadSecrets();
        if (secrets) {
            Object.entries(secrets).forEach(([key, value]) => {
                if (!process.env[key]) {
                    process.env[key] = value;
                }
            });
            console.log('🔐 Secrets loaded to environment');
            return true;
        }
        return false;
    }
}

export default SecureSecretsManager;