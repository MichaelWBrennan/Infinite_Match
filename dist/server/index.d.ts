import { Application } from 'express';
declare class GameServer {
    private app;
    private server;
    private io;
    private config;
    private logger;
    private errorHandler;
    private serviceContainer;
    private platformDetector;
    private universalAPI;
    private webglMiddleware;
    private platformBuildConfig;
    private analyticsService;
    private cloudServices;
    private unifiedAnalytics;
    private prometheusMonitoring;
    private openSourceCloud;
    private asoOptimization;
    constructor();
    private initializeSocketIO;
    private initializeServices;
    private initializeSentry;
    private setupMiddleware;
    private setupRoutes;
    private handleHealthCheck;
    private handleMetrics;
    private setupPlatformRoutes;
    private setupWebSocketHandlers;
    private setupErrorHandling;
    private setupGracefulShutdown;
    /**
     * Exposes the configured Express application. Routes and middleware are
     * wired up in the constructor, so this is usable (for tests or embedding)
     * without calling `start()` and binding a port.
     */
    getApp(): Application;
    start(): Promise<void>;
}
export default GameServer;
//# sourceMappingURL=index.d.ts.map