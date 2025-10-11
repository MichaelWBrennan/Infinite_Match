#!/usr/bin/env node
export default UnityGamingServicesAPIClient;
declare class UnityGamingServicesAPIClient {
    constructor(options?: {});
    projectId: any;
    environmentId: any;
    organizationId: any;
    clientId: any;
    clientSecret: any;
    accessToken: any;
    baseURL: string;
    authURL: string;
    ugsBaseURL: string;
    headers: {
        'Content-Type': string;
        Accept: string;
    };
    retryAttempts: number;
    retryDelay: number;
    /**
     * Get secret from environment variables
     */
    getSecret(name: any): string | undefined;
    /**
     * Authenticate with Unity Cloud using client credentials
     */
    authenticate(): Promise<any>;
    /**
     * Make authenticated API request with retry logic
     */
    makeRequest(endpoint: any, options?: {}): Promise<any>;
    /**
     * Get all currencies
     */
    getCurrencies(): Promise<any>;
    /**
     * Create or update currency
     */
    createCurrency(currencyData: any): Promise<any>;
    /**
     * Update currency
     */
    updateCurrency(currencyId: any, currencyData: any): Promise<any>;
    /**
     * Delete currency
     */
    deleteCurrency(currencyId: any): Promise<any>;
    /**
     * Get all inventory items
     */
    getInventoryItems(): Promise<any>;
    /**
     * Create or update inventory item
     */
    createInventoryItem(itemData: any): Promise<any>;
    /**
     * Update inventory item
     */
    updateInventoryItem(itemId: any, itemData: any): Promise<any>;
    /**
     * Delete inventory item
     */
    deleteInventoryItem(itemId: any): Promise<any>;
    /**
     * Get all catalog items
     */
    getCatalogItems(): Promise<any>;
    /**
     * Create or update catalog item
     */
    createCatalogItem(itemData: any): Promise<any>;
    /**
     * Update catalog item
     */
    updateCatalogItem(itemId: any, itemData: any): Promise<any>;
    /**
     * Delete catalog item
     */
    deleteCatalogItem(itemId: any): Promise<any>;
    /**
     * Get all remote config entries
     */
    getRemoteConfigs(): Promise<any>;
    /**
     * Create or update remote config entry
     */
    createRemoteConfig(configData: any): Promise<any>;
    /**
     * Update remote config entry
     */
    updateRemoteConfig(configKey: any, configData: any): Promise<any>;
    /**
     * Delete remote config entry
     */
    deleteRemoteConfig(configKey: any): Promise<any>;
    /**
     * Get all cloud code functions
     */
    getCloudCodeFunctions(): Promise<any>;
    /**
     * Create or update cloud code function
     */
    createCloudCodeFunction(functionData: any): Promise<any>;
    /**
     * Update cloud code function
     */
    updateCloudCodeFunction(functionId: any, functionData: any): Promise<any>;
    /**
     * Delete cloud code function
     */
    deleteCloudCodeFunction(functionId: any): Promise<any>;
    /**
     * Execute cloud code function
     */
    executeCloudCodeFunction(functionId: any, parameters?: {}): Promise<any>;
    /**
     * Get analytics events
     */
    getAnalyticsEvents(filters?: {}): Promise<any>;
    /**
     * Send custom analytics event
     */
    sendAnalyticsEvent(eventData: any): Promise<any>;
    /**
     * Get analytics metrics
     */
    getAnalyticsMetrics(metricType: any, filters?: {}): Promise<any>;
    /**
     * Get project information
     */
    getProjectInfo(): Promise<any>;
    /**
     * Get environment information
     */
    getEnvironmentInfo(): Promise<any>;
    /**
     * Get organization information
     */
    getOrganizationInfo(): Promise<any>;
    /**
     * Deploy economy data from local files
     */
    deployEconomyFromFiles(economyDir?: string): Promise<{
        currencies: {
            created: number;
            updated: number;
            errors: number;
        };
        inventory: {
            created: number;
            updated: number;
            errors: number;
        };
        catalog: {
            created: number;
            updated: number;
            errors: number;
        };
    }>;
    /**
     * Deploy cloud code from local files
     */
    deployCloudCodeFromFiles(cloudCodeDir?: string): Promise<{
        created: number;
        updated: number;
        errors: number;
    }>;
    /**
     * Deploy remote config from local files
     */
    deployRemoteConfigFromFiles(remoteConfigDir?: string): Promise<{
        created: number;
        updated: number;
        errors: number;
    }>;
    /**
     * Parse CSV file to JSON
     */
    parseCSV(filePath: any): {}[];
    /**
     * Check Unity Cloud service health
     */
    checkServiceHealth(): Promise<{
        timestamp: string;
        projectId: any;
        environmentId: any;
        services: {};
    }>;
    /**
     * Generate comprehensive status report
     */
    generateStatusReport(): Promise<{
        timestamp: string;
        projectId: any;
        environmentId: any;
        health: {
            timestamp: string;
            projectId: any;
            environmentId: any;
            services: {};
        };
        data: {};
    }>;
}
//# sourceMappingURL=unity-cloud-api-client.d.ts.map