/**
 * Unity Cloud Service - Optimized for Unity Integration
 * Enhanced service for Unity Cloud Build, Gaming Services, and WebGL optimization
 */
export interface UnityBuildConfig {
    target: 'webgl' | 'android' | 'ios';
    buildName: string;
    buildNumber: number;
    buildTarget: string;
    developmentBuild: boolean;
    customBuildTarget?: string;
}
export interface UnityCloudBuildStatus {
    buildId: string;
    status: 'queued' | 'started' | 'success' | 'failed' | 'cancelled';
    progress: number;
    buildStartTime: string;
    buildEndTime?: string;
    buildDuration?: number;
    buildSize?: number;
    downloadUrl?: string;
    errorMessage?: string;
}
export interface UnityWebGLConfig {
    compressionFormat: 'gzip' | 'brotli';
    memorySize: number;
    dataUrl: string;
    frameworkUrl: string;
    codeUrl: string;
    streamingAssetsUrl?: string;
    companyName: string;
    productName: string;
    productVersion: string;
}
export declare class UnityCloudService {
    private logger;
    private apiClient;
    private buildCache;
    private webglConfig;
    constructor();
    private getDefaultWebGLConfig;
    /**
     * Initialize Unity Cloud Service
     */
    initialize(): Promise<void>;
    /**
     * Validate Unity Cloud credentials
     */
    private validateCredentials;
    /**
     * Test Unity Cloud authentication
     */
    private testAuthentication;
    /**
     * Trigger Unity Cloud Build
     */
    triggerBuild(config: UnityBuildConfig): Promise<ApiResponse<UnityCloudBuildStatus>>;
    /**
     * Get Unity Cloud Build status
     */
    getBuildStatus(buildId: string): Promise<ApiResponse<UnityCloudBuildStatus>>;
    /**
     * Download Unity Cloud Build
     */
    downloadBuild(buildId: string, targetPath: string): Promise<ApiResponse<{
        downloadUrl: string;
        localPath: string;
    }>>;
    /**
     * Get Unity WebGL configuration
     */
    getWebGLConfig(): ApiResponse<UnityWebGLConfig>;
    /**
     * Update Unity WebGL configuration
     */
    updateWebGLConfig(config: Partial<UnityWebGLConfig>): ApiResponse<UnityWebGLConfig>;
    /**
     * Optimize Unity WebGL build for serving
     */
    optimizeWebGLBuild(buildPath: string): Promise<ApiResponse<{
        optimized: boolean;
        optimizations: string[];
    }>>;
    /**
     * Get Unity Cloud service health
     */
    getServiceHealth(): Promise<ApiResponse<any>>;
    /**
     * Validate build configuration
     */
    private validateBuildConfig;
    /**
     * Call Unity Cloud API
     */
    private callUnityCloudAPI;
    /**
     * Download file from URL
     */
    private downloadFile;
    /**
     * Clean up build cache
     */
    cleanupBuildCache(): void;
}
export default UnityCloudService;
//# sourceMappingURL=UnityCloudService.d.ts.map