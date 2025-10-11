#!/usr/bin/env node
export default UnityGamingServicesHeadlessIntegration;
declare class UnityGamingServicesHeadlessIntegration {
    constructor(options?: {});
    apiClient: UnityGamingServicesAPIClient;
    projectRoot: any;
    economyDir: string;
    cloudCodeDir: string;
    remoteConfigDir: string;
    monitoringDir: string;
    results: {
        timestamp: string;
        projectId: any;
        environmentId: any;
        operations: never[];
        summary: {};
    };
    /**
     * Initialize the headless integration
     */
    initialize(): Promise<boolean>;
    /**
     * Deploy all Unity Cloud services from local files
     */
    deployAll(): Promise<{
        economy: null;
        cloudCode: null;
        remoteConfig: null;
        analytics: null;
    }>;
    /**
     * Deploy Economy service
     */
    deployEconomy(): Promise<{
        service: string;
        timestamp: string;
        status: string;
        results: {};
    }>;
    /**
     * Deploy Cloud Code service
     */
    deployCloudCode(): Promise<{
        service: string;
        timestamp: string;
        status: string;
        results: {};
    }>;
    /**
     * Deploy Remote Config service
     */
    deployRemoteConfig(): Promise<{
        service: string;
        timestamp: string;
        status: string;
        results: {};
    }>;
    /**
     * Deploy Analytics events
     */
    deployAnalytics(): Promise<{
        service: string;
        timestamp: string;
        status: string;
        results: {};
    }>;
    /**
     * Sync local data with Unity Cloud
     */
    syncData(): Promise<{
        currencies: {
            synced: number;
            conflicts: number;
        };
        inventory: {
            synced: number;
            conflicts: number;
        };
        catalog: {
            synced: number;
            conflicts: number;
        };
        remoteConfig: {
            synced: number;
            conflicts: number;
        };
        cloudCode: {
            synced: number;
            conflicts: number;
        };
    }>;
    /**
     * Compare local and cloud data and sync differences
     */
    compareAndSyncData(cloudData: any): Promise<{
        currencies: {
            synced: number;
            conflicts: number;
        };
        inventory: {
            synced: number;
            conflicts: number;
        };
        catalog: {
            synced: number;
            conflicts: number;
        };
        remoteConfig: {
            synced: number;
            conflicts: number;
        };
        cloudCode: {
            synced: number;
            conflicts: number;
        };
    }>;
    /**
     * Load local economy data from CSV files
     */
    loadLocalEconomyData(type: any): {}[];
    /**
     * Generate deployment summary
     */
    generateDeploymentSummary(results: any): void;
    /**
     * Save deployment results
     */
    saveResults(): void;
    /**
     * Run complete headless integration
     */
    run(): Promise<boolean>;
}
import UnityGamingServicesAPIClient from './unity-cloud-api-client.js';
//# sourceMappingURL=unity-cloud-headless-integration.d.ts.map