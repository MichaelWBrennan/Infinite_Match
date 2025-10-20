/**
 * Universal Platform Detection and Routing System
 * Detects and optimizes for all platforms: WebGL, Android, iOS, Kongregate, Poki, Game Crazy, etc.
 */
export interface PlatformInfo {
    type: 'web' | 'mobile' | 'desktop' | 'console';
    name: 'webgl' | 'android' | 'ios' | 'kongregate' | 'poki' | 'gamecrazy' | 'itch' | 'steam' | 'unknown';
    version?: string;
    capabilities: PlatformCapabilities;
    sdk?: any;
    config: PlatformConfig;
}
export interface PlatformCapabilities {
    webgl: boolean;
    webgl2: boolean;
    wasm: boolean;
    webWorkers: boolean;
    serviceWorkers: boolean;
    ads: boolean;
    iap: boolean;
    social: boolean;
    analytics: boolean;
    achievements: boolean;
    chat: boolean;
    leaderboards: boolean;
    cloudSave: boolean;
    pushNotifications: boolean;
    maxMemory: number;
    maxTextureSize: number;
    maxVertexUniforms: number;
    maxFragmentUniforms: number;
    touch: boolean;
    keyboard: boolean;
    gamepad: boolean;
    accelerometer: boolean;
    gyroscope: boolean;
}
export interface PlatformConfig {
    name: string;
    sdkUrl?: string;
    api: Record<string, string>;
    features: PlatformCapabilities;
    optimization: {
        compression: 'gzip' | 'brotli' | 'none';
        memorySize: number;
        textureFormat: 'astc' | 'etc2' | 'dxt' | 'none';
        audioFormat: 'mp3' | 'ogg' | 'wav';
    };
    build: {
        target: string;
        architecture: 'wasm32' | 'arm64' | 'x86_64';
        optimization: 'debug' | 'release';
    };
}
export declare class PlatformDetector {
    private logger;
    private currentPlatform;
    private platformConfigs;
    constructor();
    /**
     * Initialize platform configurations
     */
    private initializePlatformConfigs;
    /**
     * Detect current platform
     */
    detectPlatform(): Promise<PlatformInfo>;
    /**
     * Detect platform name
     */
    private detectPlatformName;
    /**
     * Detect platform capabilities
     */
    private detectCapabilities;
    /**
     * Load platform SDK
     */
    private loadPlatformSDK;
    /**
     * Load script dynamically
     */
    private loadScript;
    /**
     * Get platform type
     */
    private getPlatformType;
    /**
     * Get fallback platform
     */
    private getFallbackPlatform;
    /**
     * Get current platform
     */
    getCurrentPlatform(): PlatformInfo | null;
    /**
     * Get platform-specific API
     */
    getPlatformAPI(): any;
    /**
     * Resolve API path
     */
    private resolveAPIPath;
    /**
     * Get mock API for development
     */
    private getMockAPI;
    /**
     * Get platform-specific build configuration
     */
    getBuildConfig(): any;
    /**
     * Get platform-specific optimization settings
     */
    getOptimizationConfig(): any;
}
export default PlatformDetector;
//# sourceMappingURL=PlatformDetector.d.ts.map