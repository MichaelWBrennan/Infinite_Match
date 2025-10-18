/**
 * Universal WebGL Middleware - Optimized for All Platforms
 * Handles WebGL build serving, compression, and platform-specific optimizations
 */

import { Request, Response, NextFunction } from 'express';
import { Logger } from '../logger/index.js';
import { PlatformDetector, PlatformInfo } from '../platform/PlatformDetector.js';
import { ApiResponseBuilder } from '../types/ApiResponse.js';
import { createReadStream, statSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { gzip, brotliCompress } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);
const brotliCompressAsync = promisify(brotliCompress);

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

export class WebGLMiddleware {
  private logger: Logger;
  private platformDetector: PlatformDetector;
  private buildCache: Map<string, any> = new Map();
  private compressionCache: Map<string, Buffer> = new Map();

  constructor() {
    this.logger = new Logger('WebGLMiddleware');
    this.platformDetector = new PlatformDetector();
  }

  /**
   * Initialize WebGL middleware
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing WebGL middleware...');

      // Detect platform
      await this.platformDetector.detectPlatform();

      this.logger.info('WebGL middleware initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize WebGL middleware:', { error });
      throw error;
    }
  }

  /**
   * Main WebGL serving middleware
   */
  webglServingMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const platform = this.platformDetector.getCurrentPlatform();
      if (!platform) {
        next();
        return;
      }

      // Handle different WebGL file types
      if (this.isWebGLFile(req.path)) {
        await this.serveWebGLFile(req, res, platform);
        return;
      }

      // Handle WebGL build configuration
      if (req.path === '/webgl-config.json') {
        await this.serveWebGLConfig(req, res, platform);
        return;
      }

      // Handle platform-specific optimizations
      if (req.path === '/platform-optimize') {
        await this.handlePlatformOptimization(req, res, platform);
        return;
      }

      next();
    } catch (error) {
      this.logger.error('WebGL middleware error:', { error });
      next(error);
    }
  };

  /**
   * Check if request is for WebGL file
   */
  private isWebGLFile(path: string): boolean {
    const webglExtensions = ['.wasm', '.data', '.framework.js', '.loader.js', '.symbols.json'];
    return webglExtensions.includes(extname(path));
  }

  /**
   * Serve WebGL file with platform-specific optimizations
   */
  private async serveWebGLFile(req: Request, res: Response, platform: PlatformInfo): Promise<void> {
    try {
      const filePath = this.getWebGLFilePath(req.path);

      if (!existsSync(filePath)) {
        res
          .status(404)
          .json(
            ApiResponseBuilder.error(
              'WEBGL_FILE_NOT_FOUND',
              'WebGL file not found',
              'not_found',
              false,
              'check_build_files',
            ),
          );
        return;
      }

      // Get file stats
      const stats = statSync(filePath);
      const fileSize = stats.size;

      // Apply platform-specific optimizations
      const optimizedResponse = await this.optimizeForPlatform(req, res, filePath, platform);

      if (optimizedResponse) {
        return;
      }

      // Set appropriate headers
      this.setWebGLHeaders(res, req.path, platform);

      // Apply compression if supported
      const compression = this.getCompressionType(req, platform);
      if (compression !== 'none') {
        await this.serveCompressedFile(req, res, filePath, compression);
      } else {
        // Serve uncompressed file
        const stream = createReadStream(filePath);
        stream.pipe(res);
      }
    } catch (error) {
      this.logger.error('Error serving WebGL file:', { error });
      res
        .status(500)
        .json(
          ApiResponseBuilder.error(
            'WEBGL_SERVE_ERROR',
            'Failed to serve WebGL file',
            'server_error',
            true,
            'retry_request',
          ),
        );
    }
  }

  /**
   * Get WebGL file path
   */
  private getWebGLFilePath(requestPath: string): string {
    const webglDir = join(process.cwd(), 'webgl');
    return join(webglDir, requestPath);
  }

  /**
   * Optimize response for specific platform
   */
  private async optimizeForPlatform(
    req: Request,
    res: Response,
    filePath: string,
    platform: PlatformInfo,
  ): Promise<boolean> {
    const optimization = platform.config.optimization;

    // Memory optimization for mobile platforms
    if (platform.type === 'mobile' && req.path.endsWith('.wasm')) {
      const memorySize = optimization.memorySize;
      res.setHeader('X-WebGL-Memory-Size', memorySize.toString());
    }

    // Texture format optimization
    if (req.path.endsWith('.data')) {
      const textureFormat = optimization.textureFormat;
      res.setHeader('X-WebGL-Texture-Format', textureFormat);
    }

    // Audio format optimization
    if (req.path.endsWith('.ogg') || req.path.endsWith('.mp3')) {
      const audioFormat = optimization.audioFormat;
      res.setHeader('X-WebGL-Audio-Format', audioFormat);
    }

    return false; // Continue with normal serving
  }

  /**
   * Set WebGL-specific headers
   */
  private setWebGLHeaders(res: Response, filePath: string, platform: PlatformInfo): void {
    const ext = extname(filePath);

    // Set MIME types
    switch (ext) {
    case '.wasm':
      res.setHeader('Content-Type', 'application/wasm');
      res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      break;
    case '.data':
      res.setHeader('Content-Type', 'application/octet-stream');
      break;
    case '.framework.js':
    case '.loader.js':
      res.setHeader('Content-Type', 'application/javascript');
      break;
    case '.symbols.json':
      res.setHeader('Content-Type', 'application/json');
      break;
    }

    // Set caching headers
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('ETag', `"${Date.now()}"`);

    // Set platform-specific headers
    res.setHeader('X-Platform', platform.name);
    res.setHeader('X-Platform-Type', platform.type);
    res.setHeader('X-WebGL-Optimized', 'true');

    // Set CORS headers for cross-platform compatibility
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
  }

  /**
   * Get compression type based on platform and request
   */
  private getCompressionType(req: Request, platform: PlatformInfo): 'gzip' | 'brotli' | 'none' {
    const acceptEncoding = req.headers['accept-encoding'] || '';
    const optimization = platform.config.optimization;

    // Check if client supports brotli
    if (acceptEncoding.includes('br') && optimization.compression === 'brotli') {
      return 'brotli';
    }

    // Check if client supports gzip
    if (acceptEncoding.includes('gzip') && optimization.compression === 'gzip') {
      return 'gzip';
    }

    return 'none';
  }

  /**
   * Serve compressed file
   */
  private async serveCompressedFile(
    req: Request,
    res: Response,
    filePath: string,
    compression: 'gzip' | 'brotli',
  ): Promise<void> {
    try {
      const cacheKey = `${filePath}_${compression}`;

      // Check cache first
      if (this.compressionCache.has(cacheKey)) {
        const compressedData = this.compressionCache.get(cacheKey)!;
        res.setHeader('Content-Encoding', compression);
        res.setHeader('Content-Length', compressedData.length.toString());
        res.send(compressedData);
        return;
      }

      // Read and compress file
      const fs = await import('fs');
      const fileData = await fs.promises.readFile(filePath);

      let compressedData: Buffer;
      if (compression === 'brotli') {
        compressedData = await brotliCompressAsync(fileData);
      } else {
        compressedData = await gzipAsync(fileData);
      }

      // Cache compressed data
      this.compressionCache.set(cacheKey, compressedData);

      // Set compression headers
      res.setHeader('Content-Encoding', compression);
      res.setHeader('Content-Length', compressedData.length.toString());

      res.send(compressedData);
    } catch (error) {
      this.logger.error('Error serving compressed file:', { error });
      // Fallback to uncompressed
      const stream = createReadStream(filePath);
      stream.pipe(res);
    }
  }

  /**
   * Serve WebGL configuration
   */
  private async serveWebGLConfig(
    req: Request,
    res: Response,
    platform: PlatformInfo,
  ): Promise<void> {
    try {
      const config: WebGLBuildInfo = {
        dataUrl: '/Build/WebGL.data',
        frameworkUrl: '/Build/WebGL.framework.js',
        codeUrl: '/Build/WebGL.wasm',
        streamingAssetsUrl: '/StreamingAssets',
        memorySize: platform.config.optimization.memorySize,
        compressionFormat: platform.config.optimization.compression,
        platform: platform.name,
        optimization: platform.config.build.optimization,
      };

      res.json(ApiResponseBuilder.success(config));
    } catch (error) {
      this.logger.error('Error serving WebGL config:', { error });
      res
        .status(500)
        .json(
          ApiResponseBuilder.error(
            'WEBGL_CONFIG_ERROR',
            'Failed to serve WebGL configuration',
            'server_error',
            true,
            'retry_request',
          ),
        );
    }
  }

  /**
   * Handle platform-specific optimization requests
   */
  private async handlePlatformOptimization(
    req: Request,
    res: Response,
    platform: PlatformInfo,
  ): Promise<void> {
    try {
      const optimization = {
        platform: platform.name,
        type: platform.type,
        capabilities: platform.capabilities,
        optimization: platform.config.optimization,
        build: platform.config.build,
        recommendations: this.getOptimizationRecommendations(platform),
      };

      res.json(ApiResponseBuilder.success(optimization));
    } catch (error) {
      this.logger.error('Error handling platform optimization:', error);
      res
        .status(500)
        .json(
          ApiResponseBuilder.error(
            'PLATFORM_OPTIMIZATION_ERROR',
            'Failed to handle platform optimization',
            'server_error',
            true,
            'retry_request',
          ),
        );
    }
  }

  /**
   * Get optimization recommendations for platform
   */
  private getOptimizationRecommendations(platform: PlatformInfo): string[] {
    const recommendations: string[] = [];

    // Memory recommendations
    if (platform.capabilities.maxMemory < 512) {
      recommendations.push('Reduce memory usage for better performance');
    }

    // Texture recommendations
    if (platform.capabilities.maxTextureSize < 2048) {
      recommendations.push('Use smaller texture sizes');
    }

    // Compression recommendations
    if (platform.config.optimization.compression === 'none') {
      recommendations.push('Enable compression for faster loading');
    }

    // Mobile-specific recommendations
    if (platform.type === 'mobile') {
      recommendations.push('Optimize for touch input');
      recommendations.push('Reduce battery usage');
    }

    // Web platform recommendations
    if (platform.type === 'web') {
      recommendations.push('Enable service worker for offline support');
      recommendations.push('Use WebGL2 features when available');
    }

    return recommendations;
  }

  /**
   * Clean up caches
   */
  cleanup(): void {
    this.buildCache.clear();
    this.compressionCache.clear();
    this.logger.info('WebGL middleware caches cleaned up');
  }

  /**
   * Get middleware statistics
   */
  getStats(): any {
    return {
      buildCacheSize: this.buildCache.size,
      compressionCacheSize: this.compressionCache.size,
      platform: this.platformDetector.getCurrentPlatform()?.name || 'unknown',
    };
  }
}

export default WebGLMiddleware;
