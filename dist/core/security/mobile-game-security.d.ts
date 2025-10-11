export class MobileGameSecurity {
    cheatDetection: Map<any, any>;
    deviceFingerprints: Map<any, any>;
    suspiciousPlayers: Map<any, any>;
    /**
     * Generate device fingerprint for mobile client
     * @param {Object} deviceInfo - Device information from client
     * @returns {string} Device fingerprint
     */
    generateDeviceFingerprint(deviceInfo: Object): string;
    /**
     * Validate device fingerprint
     * @param {string} fingerprint - Device fingerprint
     * @param {Object} deviceInfo - Current device info
     * @returns {boolean} Whether fingerprint is valid
     */
    validateDeviceFingerprint(fingerprint: string, deviceInfo: Object): boolean;
    /**
     * Detect suspicious device changes
     * @param {Object} storedInfo - Stored device info
     * @param {Object} currentInfo - Current device info
     * @returns {Array} List of suspicious changes
     */
    detectSuspiciousDeviceChanges(storedInfo: Object, currentInfo: Object): any[];
    /**
     * Check if version is a downgrade
     * @param {string} oldVersion - Old version
     * @param {string} newVersion - New version
     * @returns {boolean} Whether it's a downgrade
     */
    isVersionDowngrade(oldVersion: string, newVersion: string): boolean;
    /**
     * Detect potential cheating in game actions
     * @param {string} playerId - Player ID
     * @param {Object} gameAction - Game action data
     * @returns {Object} Cheat detection result
     */
    detectCheating(playerId: string, gameAction: Object): Object;
    /**
     * Get recent actions for a player
     * @param {string} playerId - Player ID
     * @returns {Array} Recent actions
     */
    getRecentActions(playerId: string): any[];
    /**
     * Record suspicious activity
     * @param {string} playerId - Player ID
     * @param {Object} gameAction - Game action
     * @param {Object} cheatScore - Cheat detection score
     */
    recordSuspiciousActivity(playerId: string, gameAction: Object, cheatScore: Object): void;
    /**
     * Validate in-app purchase
     * @param {Object} purchaseData - Purchase data
     * @returns {Object} Validation result
     */
    validatePurchase(purchaseData: Object): Object;
    /**
     * Check for duplicate purchases
     * @param {Object} purchaseData - Purchase data
     * @returns {boolean} Whether purchase is duplicate
     */
    isDuplicatePurchase(purchaseData: Object): boolean;
    /**
     * Check for rapid purchases
     * @param {string} playerId - Player ID
     * @returns {boolean} Whether player has rapid purchases
     */
    hasRapidPurchases(playerId: string): boolean;
    /**
     * Validate cloud save data
     * @param {string} playerId - Player ID
     * @param {Object} saveData - Save data
     * @returns {Object} Validation result
     */
    validateCloudSave(playerId: string, saveData: Object): Object;
    /**
     * Check if save data has been tampered with
     * @param {Object} saveData - Save data
     * @returns {boolean} Whether data is tampered
     */
    isSaveDataTampered(saveData: Object): boolean;
    /**
     * Get security statistics for mobile game
     * @returns {Object} Security statistics
     */
    getMobileGameSecurityStats(): Object;
}
export const mobileGameSecurity: MobileGameSecurity;
export default mobileGameSecurity;
//# sourceMappingURL=mobile-game-security.d.ts.map