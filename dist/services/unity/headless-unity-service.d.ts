export default HeadlessUnityService;
declare class HeadlessUnityService {
    constructor(cacheManager: any);
    projectId: string;
    environmentId: string;
    cacheManager: any;
    mode: string;
    /**
     * Authenticate with Unity Services (Headless Mode)
     * Always returns true for headless operation
     */
    authenticate(): Promise<boolean>;
    accessToken: string | undefined;
    /**
     * Economy Service Methods (Headless Simulation)
     */
    createCurrency(currencyData: any): Promise<{
        id: any;
        name: any;
        type: any;
        status: string;
        method: string;
        message: string;
    }>;
    createInventoryItem(itemData: any): Promise<{
        id: any;
        name: any;
        type: any;
        status: string;
        method: string;
        message: string;
    }>;
    createCatalogItem(catalogData: any): Promise<{
        id: any;
        name: any;
        type: any;
        status: string;
        method: string;
        message: string;
    }>;
    getCurrencies(): Promise<{}[]>;
    getInventoryItems(): Promise<{}[]>;
    getCatalogItems(): Promise<{}[]>;
    /**
     * Cloud Code Service Methods (Headless Simulation)
     */
    deployCloudCodeFunction(functionData: any): Promise<{
        id: any;
        name: any;
        status: string;
        method: string;
        message: string;
    }>;
    getCloudCodeFunctions(): Promise<never[]>;
    /**
     * Remote Config Service Methods (Headless Simulation)
     */
    updateRemoteConfig(configData: any): Promise<{
        status: string;
        method: string;
        message: string;
    }>;
    getRemoteConfig(): Promise<{}>;
    /**
     * Batch operations for efficiency
     */
    deployEconomyData(economyData: any): Promise<{
        currencies: never[];
        inventory: never[];
        catalog: never[];
        errors: never[];
    }>;
    /**
     * Deploy all Unity services (Headless Simulation)
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
    }>;
    /**
     * Load economy data from CSV files
     */
    loadEconomyDataFromCSV(): Promise<{
        currencies: {}[];
        inventory: {}[];
        catalog: {}[];
    }>;
    /**
     * Parse CSV data into objects
     */
    parseCSV(csvData: any, headers: any): {}[];
    /**
     * Get service status
     */
    getStatus(): {
        mode: string;
        projectId: string;
        environmentId: string;
        authenticated: boolean;
        message: string;
    };
}
//# sourceMappingURL=headless-unity-service.d.ts.map