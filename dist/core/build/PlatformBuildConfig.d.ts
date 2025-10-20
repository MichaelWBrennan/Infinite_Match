/**
 * Platform-Specific Build Configuration
 * Optimizes Unity builds for different platforms and distribution channels
 */
export interface BuildConfiguration {
    platform: string;
    target: string;
    architecture: string;
    optimization: 'debug' | 'release';
    compression: 'gzip' | 'brotli' | 'none';
    memorySize: number;
    textureFormat: 'astc' | 'etc2' | 'dxt' | 'none';
    audioFormat: 'mp3' | 'ogg' | 'wav';
    features: {
        webgl: boolean;
        mobile: boolean;
        desktop: boolean;
        ads: boolean;
        iap: boolean;
        analytics: boolean;
        social: boolean;
    };
    buildSettings: {
        developmentBuild: boolean;
        allowDebugging: boolean;
        scriptDebugging: boolean;
        il2cpp: boolean;
        managedStrippingLevel: 'disabled' | 'minimal' | 'medium' | 'high';
    };
    playerSettings: {
        companyName: string;
        productName: string;
        productVersion: string;
        bundleIdentifier: string;
        targetSdkVersion: string;
        minSdkVersion: string;
    };
    qualitySettings: {
        pixelLightCount: number;
        shadows: 'disable' | 'hardOnly' | 'all';
        shadowResolution: 'low' | 'medium' | 'high' | 'veryHigh';
        shadowDistance: number;
        textureQuality: number;
        anisotropicFiltering: 'disable' | 'enable' | 'forceEnable';
        antiAliasing: number;
        softVegetation: boolean;
        realtimeReflectionProbes: boolean;
    };
}
export declare class PlatformBuildConfig {
    private logger;
    private platformDetector;
    private buildConfigs;
    constructor();
    /**
     * Initialize platform-specific build configurations
     */
    private initializeBuildConfigs;
    /**
     * Get build configuration for platform
     */
    getBuildConfig(platformName: string): BuildConfiguration | null;
    /**
     * Get optimized build configuration for detected platform
     */
    getOptimizedBuildConfig(): Promise<BuildConfiguration>;
    /**
     * Optimize configuration for specific platform capabilities
     */
    private optimizeConfigForPlatform;
    /**
     * Generate Unity build command
     */
    generateBuildCommand(config: BuildConfiguration): string;
    /**
     * Generate build configuration file
     */
    generateBuildConfigFile(config: BuildConfiguration): string;
    /**
     * Validate build configuration
     */
    validateBuildConfig(config: BuildConfiguration): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Get all available build configurations
     */
    getAllBuildConfigs(): Map<string, BuildConfiguration>;
    /**
     * Get build configuration statistics
     */
    getBuildConfigStats(): any;
}
export default PlatformBuildConfig;
//# sourceMappingURL=PlatformBuildConfig.d.ts.map