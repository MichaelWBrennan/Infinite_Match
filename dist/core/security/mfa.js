/**
 * Multi-Factor Authentication (MFA) Implementation
 * Provides TOTP-based 2FA for enhanced security
 */
import crypto from 'crypto';
import { AppConfig } from '../config/index.js';
import { Logger } from '../logger/index.js';
const logger = new Logger('MFA');
export class MFAProvider {
    constructor() {
        this.issuer = 'Evergreen Match3';
        this.algorithm = 'sha1';
        this.digits = 6;
        this.period = 30;
    }
    /**
     * Generate a new MFA secret for a user
     * @param {string} userId - User ID
     * @param {string} userEmail - User email
     * @returns {Object} MFA secret and QR code data
     */
    generateSecret(userId, userEmail) {
        try {
            const secret = crypto.randomBytes(20).toString('base32');
            const qrCodeData = this.generateQRCodeData(userId, userEmail, secret);
            logger.info('MFA secret generated', { userId, hasSecret: !!secret });
            return {
                secret,
                qrCodeData,
                backupCodes: this.generateBackupCodes()
            };
        }
        catch (error) {
            logger.error('Failed to generate MFA secret', { error: error.message, userId });
            throw new Error('MFA secret generation failed');
        }
    }
    /**
     * Verify TOTP code
     * @param {string} secret - User's MFA secret
     * @param {string} token - TOTP token to verify
     * @returns {boolean} Whether the token is valid
     */
    verifyToken(secret, token) {
        try {
            const currentTime = Math.floor(Date.now() / 1000);
            const timeWindow = 1; // Allow 1 time window before/after
            for (let i = -timeWindow; i <= timeWindow; i++) {
                const time = currentTime + (i * this.period);
                const expectedToken = this.generateTOTP(secret, time);
                if (crypto.timingSafeEqual(Buffer.from(token, 'utf8'), Buffer.from(expectedToken, 'utf8'))) {
                    logger.info('MFA token verified successfully');
                    return true;
                }
            }
            logger.warn('MFA token verification failed', { token: token.substring(0, 2) + '****' });
            return false;
        }
        catch (error) {
            logger.error('MFA token verification error', { error: error.message });
            return false;
        }
    }
    /**
     * Generate TOTP code for given secret and time
     * @param {string} secret - Base32 encoded secret
     * @param {number} time - Unix timestamp
     * @returns {string} TOTP code
     */
    generateTOTP(secret, time) {
        const counter = Math.floor(time / this.period);
        const key = this.base32Decode(secret);
        const buffer = Buffer.alloc(8);
        for (let i = 7; i >= 0; i--) {
            buffer[i] = counter & 0xff;
            counter >>= 8;
        }
        const hmac = crypto.createHmac(this.algorithm, key);
        hmac.update(buffer);
        const hash = hmac.digest();
        const offset = hash[hash.length - 1] & 0xf;
        const code = ((hash[offset] & 0x7f) << 24) |
            ((hash[offset + 1] & 0xff) << 16) |
            ((hash[offset + 2] & 0xff) << 8) |
            (hash[offset + 3] & 0xff);
        return (code % Math.pow(10, this.digits)).toString().padStart(this.digits, '0');
    }
    /**
     * Generate QR code data for MFA setup
     * @param {string} userId - User ID
     * @param {string} userEmail - User email
     * @param {string} secret - MFA secret
     * @returns {string} QR code data URL
     */
    generateQRCodeData(userId, userEmail, secret) {
        const otpauth = `otpauth://totp/${this.issuer}:${userEmail}?secret=${secret}&issuer=${this.issuer}&algorithm=${this.algorithm.toUpperCase()}&digits=${this.digits}&period=${this.period}`;
        return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauth)}`;
    }
    /**
     * Generate backup codes for MFA recovery
     * @returns {string[]} Array of backup codes
     */
    generateBackupCodes() {
        const codes = [];
        for (let i = 0; i < 10; i++) {
            codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
        }
        return codes;
    }
    /**
     * Verify backup code
     * @param {string[]} backupCodes - User's backup codes
     * @param {string} code - Code to verify
     * @returns {boolean} Whether the backup code is valid
     */
    verifyBackupCode(backupCodes, code) {
        const index = backupCodes.indexOf(code.toUpperCase());
        if (index !== -1) {
            backupCodes.splice(index, 1); // Remove used code
            logger.info('Backup code verified and removed');
            return true;
        }
        return false;
    }
    /**
     * Decode base32 string
     * @param {string} str - Base32 encoded string
     * @returns {Buffer} Decoded buffer
     */
    base32Decode(str) {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        const padding = '=';
        str = str.replace(/\s/g, '').toUpperCase();
        const paddingCount = (str.match(new RegExp(padding, 'g')) || []).length;
        if (paddingCount > 0 && paddingCount < 8) {
            str = str.replace(new RegExp(padding + '+$'), '');
        }
        const bits = str.split('').map(char => {
            const index = alphabet.indexOf(char);
            if (index === -1)
                throw new Error('Invalid base32 character');
            return index.toString(2).padStart(5, '0');
        }).join('');
        const bytes = [];
        for (let i = 0; i < bits.length; i += 8) {
            const byte = bits.substr(i, 8);
            if (byte.length === 8) {
                bytes.push(parseInt(byte, 2));
            }
        }
        return Buffer.from(bytes);
    }
}
export const mfaProvider = new MFAProvider();
export default mfaProvider;
//# sourceMappingURL=mfa.js.map