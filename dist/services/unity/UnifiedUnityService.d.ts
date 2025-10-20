export default UnifiedUnityService;
declare class UnifiedUnityService {
    constructor(cacheManager?: null);
    projectId: any;
    environmentId: any;
    cacheManager: import("../ai-cache-manager.js").AICacheManager;
    mode: string;
    authenticated: boolean;
    accessToken: string | null;
    performanceMetrics: {
        requests: number;
        cacheHits: number;
        cacheMisses: number;
        averageResponseTime: number;
    };
    serviceStatus: {
        economy: string;
        cloudCode: string;
        remoteConfig: string;
        lastUpdate: Date;
    };
    /**
     * Authenticate with Unity Services
     * Supports both headless simulation and real API authentication
     */
    authenticate(useRealAPI?: boolean): Promise<boolean>;
    /**
     * Economy Service Methods with AI optimization
     */
    createCurrency(currencyData: any): Promise<any>;
    createInventoryItem(itemData: any): Promise<any>;
    createCatalogItem(catalogData: any): Promise<any>;
    getCurrencies(): Promise<any>;
    getInventoryItems(): Promise<any>;
    getCatalogItems(): Promise<any>;
    /**
     * Cloud Code Service Methods with AI optimization
     */
    deployCloudCodeFunction(functionData: any): Promise<any>;
    getCloudCodeFunctions(): Promise<any>;
    /**
     * Remote Config Service Methods with AI optimization
     */
    updateRemoteConfig(configData: any): Promise<any>;
    getRemoteConfig(): Promise<any>;
    /**
     * Batch operations for efficiency with AI optimization
     */
    deployEconomyData(economyData: any): Promise<{
        currencies: never[];
        inventory: never[];
        catalog: never[];
        errors: never[];
        performance: {};
    }>;
    /**
     * Deploy all Unity services with AI optimization
     */
    deployAllServices(): Promise<{
        economy: {
            success: boolean;
            method: string;
            error: null;
        };
        cloudCode: {
            success: boolean;
            method: string;
            error: null;
        };
        remoteConfig: {
            success: boolean;
            method: string;
            error: null;
        };
        performance: {};
    }>;
    /**
     * Load economy data from CSV files with AI optimization
     */
    loadEconomyDataFromCSV(): Promise<any>;
    /**
     * Parse CSV data into objects with AI optimization
     */
    parseCSV(csvData: any, headers: any): {}[];
    /**
     * Update performance metrics
     */
    updatePerformanceMetrics(startTime: any): void;
    /**
     * Get service status with AI insights
     */
    getStatus(): {
        mode: string;
        projectId: any;
        environmentId: any;
        authenticated: boolean;
        serviceStatus: {
            economy: string;
            cloudCode: string;
            remoteConfig: string;
            lastUpdate: Date;
        };
        performance: {
            requests: number;
            cacheHits: number;
            cacheMisses: number;
            averageResponseTime: number;
        };
        cacheStats: {
            hitRate: number;
            missRate: number;
            totalRequests: number;
            memoryUsage: number;
            cacheSizes: {};
            uptime: number;
            hits: number;
            misses: number;
            sets: number;
            deletes: number;
            evictions: number;
            totalSize: number;
            lastReset: number;
        };
        message: string;
        aiOptimized: boolean;
    };
    /**
     * Get performance analytics
     */
    getPerformanceAnalytics(): {
        requests: number;
        cacheHitRate: number;
        averageResponseTime: number;
        serviceStatus: {
            economy: string;
            cloudCode: string;
            remoteConfig: string;
            lastUpdate: Date;
        };
        lastUpdate: Date;
    };
    /**
     * Clear all caches
     */
    clearCache(): Promise<void>;
    createCurrencyAPI(currencyData: any): Promise<void>;
    createInventoryItemAPI(itemData: any): Promise<void>;
    createCatalogItemAPI(catalogData: any): Promise<void>;
    deployCloudCodeFunctionAPI(functionData: any): Promise<void>;
    updateRemoteConfigAPI(configData: any): Promise<void>;
}
//# sourceMappingURL=UnifiedUnityService.d.ts.map