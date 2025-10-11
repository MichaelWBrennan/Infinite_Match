export { default } from "./EconomyService.js";
export class EconomyService {
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
     * Load CSV data from file
     */
    loadCSVData(filename: any): Promise<{}[]>;
    /**
     * Parse CSV value based on type
     */
    parseValue(value: any): any;
    /**
     * Validate economy data with common fields
     */
    validateEconomyData(data: any, type: any, requiredFields: any, fieldMappings: any): {
        id: any;
        name: any;
        type: any;
    }[];
    /**
     * Validate currency data
     */
    validateCurrencies(currencies: any): {
        id: any;
        name: any;
        type: any;
    }[];
    /**
     * Validate inventory data
     */
    validateInventory(inventory: any): {
        id: any;
        name: any;
        type: any;
    }[];
    /**
     * Validate catalog data
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
        validation: {
            currenciesValid: boolean;
            inventoryValid: boolean;
            catalogValid: boolean;
        };
    }>;
    /**
     * Save economy data to JSON
     */
    saveToJSON(economyData: any, filename?: string): Promise<void>;
    /**
     * Get cached economy data
     */
    getCachedData(key: any): any;
    /**
     * Set cached economy data
     */
    setCachedData(key: any, data: any, ttl?: number): void;
    /**
     * Clear expired cache entries
     */
    clearExpiredCache(): void;
}
//# sourceMappingURL=index.d.ts.map