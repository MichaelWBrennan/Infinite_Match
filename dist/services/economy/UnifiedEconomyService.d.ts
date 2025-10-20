export default UnifiedEconomyService;
export class UnifiedEconomyService {
    constructor(dataLoader: any, validator: any, cacheManager?: null);
    dataPath: any;
    dataLoader: any;
    validator: any;
    cacheManager: import("../ai-cache-manager.js").AICacheManager;
    cache: Map<any, any>;
    cacheStats: {
        hits: number;
        misses: number;
        sets: number;
        deletes: number;
    };
    /**
     * Load economy data from CSV files with AI-optimized caching
     */
    loadEconomyData(): Promise<any>;
    /**
     * Load CSV data from file with enhanced error handling
     */
    loadCSVData(filename: any): Promise<{}[]>;
    /**
     * Parse CSV value based on type with AI optimization
     */
    parseValue(value: any): any;
    /**
     * Validate economy data with common fields and AI enhancement
     */
    validateEconomyData(data: any, type: any, requiredFields: any, fieldMappings: any): {
        id: any;
        name: any;
        type: any;
    }[];
    /**
     * Validate currency data with AI optimization
     */
    validateCurrencies(currencies: any): {
        id: any;
        name: any;
        type: any;
    }[];
    /**
     * Validate inventory data with AI optimization
     */
    validateInventory(inventory: any): {
        id: any;
        name: any;
        type: any;
    }[];
    /**
     * Validate catalog data with AI optimization
     */
    validateCatalog(catalog: any): {
        id: any;
        name: any;
        type: any;
    }[];
    /**
     * Check if object has required fields
     */
    hasRequiredFields(obj: any, requiredFields: any): any;
    /**
     * Generate economy report with AI insights
     */
    generateReport(): Promise<{
        timestamp: string;
        summary: {
            totalCurrencies: any;
            totalInventoryItems: any;
            totalCatalogItems: any;
        };
        currencies: any;
        inventory: any;
        catalog: any;
        validation: {
            currenciesValid: boolean;
            inventoryValid: boolean;
            catalogValid: boolean;
        };
        cacheStats: {
            hits: number;
            misses: number;
            sets: number;
            deletes: number;
        };
        aiOptimized: boolean;
    }>;
    /**
     * Save economy data to JSON with AI optimization
     */
    saveToJSON(economyData: any, filename?: string): Promise<void>;
    /**
     * Get cached economy data with AI optimization
     */
    getCachedData(key: any): any;
    /**
     * Set cached economy data with AI optimization
     */
    setCachedData(key: any, data: any, ttl?: number): void;
    /**
     * Clear expired cache entries with AI optimization
     */
    clearExpiredCache(): void;
    /**
     * Clear all caches
     */
    clearCache(): void;
    /**
     * Get service statistics with AI insights
     */
    getStats(): {
        cacheStats: {
            hits: number;
            misses: number;
            sets: number;
            deletes: number;
        };
        aiCacheStats: {
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
        dataPath: any;
        cacheHitRate: number;
        aiOptimized: boolean;
    };
    /**
     * Optimize economy data with AI insights
     */
    optimizeEconomyData(): Promise<{
        currencyOptimizations: {
            type: string;
            severity: string;
            message: string;
        }[];
        inventoryOptimizations: {
            type: string;
            severity: string;
            message: string;
        }[];
        catalogOptimizations: {
            type: string;
            severity: string;
            message: string;
        }[];
    }>;
    /**
     * Analyze currency optimizations
     */
    analyzeCurrencyOptimizations(currencies: any): {
        type: string;
        severity: string;
        message: string;
    }[];
    /**
     * Analyze inventory optimizations
     */
    analyzeInventoryOptimizations(inventory: any): {
        type: string;
        severity: string;
        message: string;
    }[];
    /**
     * Analyze catalog optimizations
     */
    analyzeCatalogOptimizations(catalog: any): {
        type: string;
        severity: string;
        message: string;
    }[];
}
//# sourceMappingURL=UnifiedEconomyService.d.ts.map