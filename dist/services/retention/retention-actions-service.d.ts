export default RetentionActionsService;
export class RetentionActionsService {
    constructor(accountEconomy: any, levelAnalytics: any, winbackScheduler: any, streakProtection: any);
    accountEconomy: any;
    levelAnalytics: any;
    winbackScheduler: any;
    streakProtection: any;
    actionHistory: any[];
    autoActionsEnabled: boolean;
    /**
     * Evaluate retention metrics and trigger automatic actions.
     * Returns { actions: [], alerts: [] }.
     */
    evaluateAndAct({ nowMs }?: {
        nowMs?: number | undefined;
    }): Promise<{
        actions: never[];
        alerts: {
            type: string;
            message: any;
        }[];
    } | {
        actions: any[];
        alerts: ({
            type: string;
            metric: string;
            current: number;
            threshold: number;
            severity: string;
            message: string;
            level?: never;
            failRate?: never;
        } | {
            type: string;
            level: any;
            failRate: any;
            severity: any;
            message: string;
            metric?: never;
            current?: never;
            threshold?: never;
        })[];
    }>;
    /**
     * D1 recovery: send welcome-back to players who played level 1 but haven't returned.
     */
    triggerD1RecoveryActions(nowMs?: number): Promise<any[]>;
    /**
     * D7 recovery: send streak repair to players with broken streaks.
     */
    triggerD7RecoveryActions(nowMs?: number): Promise<any[]>;
    /**
     * D30 recovery: high-value win-back for lapsed spenders.
     */
    triggerD30RecoveryActions(nowMs?: number): Promise<any[]>;
    /**
     * Get recent action history.
     */
    getActionHistory(limit?: number): any[];
    /**
     * Get stats on actions taken.
     */
    getStats(): {
        totalActions: number;
        byType: {};
        autoActionsEnabled: boolean;
    };
    /**
     * Enable or disable auto-actions.
     */
    setAutoActions(enabled: any): void;
}
export namespace RETENTION_BENCHMARKS {
    let d1_warning: number;
    let d7_warning: number;
    let d30_warning: number;
}
//# sourceMappingURL=retention-actions-service.d.ts.map