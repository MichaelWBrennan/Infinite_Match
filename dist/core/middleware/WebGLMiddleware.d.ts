/**
 * Universal WebGL Middleware - Optimized for All Platforms
 * Handles WebGL build serving, compression, and platform-specific optimizations
 */
import { Request, Response, NextFunction } from 'express';
export interface WebGLBuildInfo {
    dataUrl: string;
    frameworkUrl: string;
    codeUrl: string;
    streamingAssetsUrl?: string;
    memorySize: number;
    compressionFormat: 'gzip' | 'brotli' | 'none';
    platform: string;
    optimization: string;
}
export declare class WebGLMiddleware {
    private logger;
    private platformDetector;
    private buildCache;
    private compressionCache;
    constructor();
    /**
     * Initialize WebGL middleware
     */
    initialize(): Promise<void>;
    /**
     * Main WebGL serving middleware
     */
    webglServingMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Check if request is for WebGL file
     */
    private isWebGLFile;
    /**
     * Serve WebGL file with platform-specific optimizations
     */
    private serveWebGLFile;
    /**
     * Get WebGL file path
     */
    private getWebGLFilePath;
    /**
     * Optimize response for specific platform
     */
    private optimizeForPlatform;
    /**
     * Set WebGL-specific headers
     */
    private setWebGLHeaders;
    /**
     * Get compression type based on platform and request
     */
    private getCompressionType;
    /**
     * Serve compressed file
     */
    private serveCompressedFile;
    /**
     * Serve WebGL configuration
     */
    private serveWebGLConfig;
    /**
     * Handle platform-specific optimization requests
     */
    private handlePlatformOptimization;
    /**
     * Get optimization recommendations for platform
     */
    private getOptimizationRecommendations;
    /**
     * Clean up caches
     */
    cleanup(): void;
    /**
     * Get middleware statistics
     */
    getStats(): any;
}
export default WebGLMiddleware;
//# sourceMappingURL=WebGLMiddleware.d.ts.map