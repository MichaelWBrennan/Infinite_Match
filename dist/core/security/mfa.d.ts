export class MFAProvider {
    issuer: string;
    algorithm: string;
    digits: number;
    period: number;
    /**
     * Generate a new MFA secret for a user
     * @param {string} userId - User ID
     * @param {string} userEmail - User email
     * @returns {Object} MFA secret and QR code data
     */
    generateSecret(userId: string, userEmail: string): Object;
    /**
     * Verify TOTP code
     * @param {string} secret - User's MFA secret
     * @param {string} token - TOTP token to verify
     * @returns {boolean} Whether the token is valid
     */
    verifyToken(secret: string, token: string): boolean;
    /**
     * Generate TOTP code for given secret and time
     * @param {string} secret - Base32 encoded secret
     * @param {number} time - Unix timestamp
     * @returns {string} TOTP code
     */
    generateTOTP(secret: string, time: number): string;
    /**
     * Generate QR code data for MFA setup
     * @param {string} userId - User ID
     * @param {string} userEmail - User email
     * @param {string} secret - MFA secret
     * @returns {string} QR code data URL
     */
    generateQRCodeData(userId: string, userEmail: string, secret: string): string;
    /**
     * Generate backup codes for MFA recovery
     * @returns {string[]} Array of backup codes
     */
    generateBackupCodes(): string[];
    /**
     * Verify backup code
     * @param {string[]} backupCodes - User's backup codes
     * @param {string} code - Code to verify
     * @returns {boolean} Whether the backup code is valid
     */
    verifyBackupCode(backupCodes: string[], code: string): boolean;
    /**
     * Decode base32 string
     * @param {string} str - Base32 encoded string
     * @returns {Buffer} Decoded buffer
     */
    base32Decode(str: string): Buffer;
}
export const mfaProvider: MFAProvider;
export default mfaProvider;
//# sourceMappingURL=mfa.d.ts.map