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
    private posthogAnalytics;
    private asoOptimization;
    constructor();
    private initializeSocketIO;
    private initializeServices;
    private initializeSentry;
    private setupMiddleware;
    private setupRoutes;
    private handleHealthCheck;
    private setupPlatformRoutes;
    private setupWebSocketHandlers;
    private setupErrorHandling;
    private setupGracefulShutdown;
    start(): Promise<void>;
}
export default GameServer;
//# sourceMappingURL=index.d.ts.map