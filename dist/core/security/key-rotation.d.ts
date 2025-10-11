export class KeyRotationManager {
    rotationInterval: number;
    keyHistory: Map<any, any>;
    currentKeys: Map<any, any>;
    rotationCallbacks: Map<any, any>;
    /**
     * Initialize current keys from configuration
     */
    initializeKeys(): void;
    /**
     * Generate a new secure key
     * @param {string} type - Type of key (jwt, encryption, etc.)
     * @param {number} length - Key length in bytes
     * @returns {string} Generated key
     */
    generateKey(type: string, length?: number): string;
    /**
     * Rotate a specific key
     * @param {string} keyType - Type of key to rotate
     * @returns {Object} Rotation result
     */
    rotateKey(keyType: string): Object;
    /**
     * Rotate all keys
     * @returns {Object} Rotation results
     */
    rotateAllKeys(): Object;
    /**
     * Get current key for a type
     * @param {string} keyType - Type of key
     * @returns {string|null} Current key or null
     */
    getCurrentKey(keyType: string): string | null;
    /**
     * Get key by version
     * @param {string} keyType - Type of key
     * @param {number} version - Key version
     * @returns {string|null} Key or null
     */
    getKeyByVersion(keyType: string, version: number): string | null;
    /**
     * Register callback for key rotation events
     * @param {string} keyType - Type of key
     * @param {Function} callback - Callback function
     */
    onKeyRotation(keyType: string, callback: Function): void;
    /**
     * Notify callbacks of key rotation
     * @param {string} keyType - Type of key
     * @param {string} newKey - New key
     * @param {number} version - New version
     */
    notifyKeyRotation(keyType: string, newKey: string, version: number): void;
    /**
     * Start automatic key rotation timer
     */
    startRotationTimer(): void;
    /**
     * Get rotation statistics
     * @returns {Object} Rotation statistics
     */
    getRotationStats(): Object;
    /**
     * Clean up old keys from history
     * @param {number} maxAge - Maximum age in milliseconds
     */
    cleanupOldKeys(maxAge?: number): void;
    /**
     * Force immediate rotation of all keys
     * @returns {Object} Rotation results
     */
    forceRotation(): Object;
    /**
     * Get key rotation schedule
     * @returns {Object} Next rotation information
     */
    getNextRotation(): Object;
}
export const keyRotationManager: KeyRotationManager;
export default keyRotationManager;
//# sourceMappingURL=key-rotation.d.ts.map