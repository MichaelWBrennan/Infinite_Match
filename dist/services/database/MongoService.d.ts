export declare class MongoService {
    private connection;
    constructor();
    private setupEventHandlers;
    connect(): Promise<boolean>;
    disconnect(): Promise<void>;
    saveGameAnalytics(analytics: any): Promise<boolean>;
    getGameAnalytics(playerId: string, startDate?: Date, endDate?: Date): Promise<any[]>;
    savePlayerBehavior(behavior: any): Promise<boolean>;
    getPlayerBehavior(playerId: string): Promise<any | null>;
    saveGameEvent(event: any): Promise<boolean>;
    getGameEvents(playerId: string, eventType?: string, limit?: number): Promise<any[]>;
    saveABTestResult(result: any): Promise<boolean>;
    getABTestResults(testId: string): Promise<any[]>;
    saveUnityCloudLog(log: any): Promise<boolean>;
    getUnityCloudLogs(service?: string, level?: string, limit?: number): Promise<any[]>;
    savePerformanceMetrics(metrics: any): Promise<boolean>;
    getPerformanceMetrics(service?: string, startDate?: Date, endDate?: Date): Promise<any[]>;
    healthCheck(): Promise<{
        status: string;
        latency: number;
    }>;
    isConnected(): boolean;
    getDatabaseStats(): Promise<any>;
}
export declare const mongoService: MongoService;
export default mongoService;
//# sourceMappingURL=MongoService.d.ts.map