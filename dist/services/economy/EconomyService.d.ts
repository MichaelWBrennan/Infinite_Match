export default EconomyService;
declare class EconomyService {
    constructor(dataLoader: any, validator: any, cacheManager: any);
    dataPath: string;
    dataLoader: any;
    validator: any;
    cacheManager: any;
    /**
     * Load economy data from CSV files
     */
    loadEconomyData(): Promise<any>;
    /**
     * Generate economy report
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
    }>;
    /**
     * Save economy data to file
     */
    saveEconomyData(data: any, filename?: string): Promise<void>;
    /**
     * Clear cache
     */
    clearCache(): void;
    /**
     * Get service statistics
     */
    getStats(): {
        cacheStats: any;
        dataPath: string;
    };
}
//# sourceMappingURL=EconomyService.d.ts.map