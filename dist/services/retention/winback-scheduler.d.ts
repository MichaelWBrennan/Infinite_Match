export default WinBackScheduler;
export class WinBackScheduler {
    constructor(accountEconomy: any, playerSegmentationService: any);
    accountEconomy: any;
    playerSegmentationService: any;
    winBackHistory: Map<any, any>;
    cronJob: NodeJS.Timeout | null;
    isRunning: boolean;
    /**
     * Start the win-back scheduler. Runs every hour by default.
     */
    start({ intervalMs }?: {
        intervalMs?: number | undefined;
    }): void;
    /**
     * Stop the win-back scheduler.
     */
    stop(): void;
    /**
     * Run a single win-back cycle: find at-risk/churned players and send notifications.
     */
    runWinBackCycle(): Promise<{
        sent: number;
        atRisk: number;
        churned: number;
        highValueAtRisk?: never;
        notificationsByOffer?: never;
    } | {
        sent: number;
        atRisk: number;
        churned: number;
        highValueAtRisk: number;
        notificationsByOffer: {
            type: any;
            count: any;
        }[];
    }>;
    /**
     * Check if a win-back notification can be sent to a player (cooldown protection).
     */
    canSendWinBack(playerId: any, offerType: any, nowMs?: number): boolean;
    /**
     * Record that a win-back offer was claimed/converted.
     */
    recordConversion(playerId: any, offerType: any, reward: any): void;
    /**
     * Get win-back statistics.
     */
    getStats(): {
        totalPlayersContacted: number;
        totalNotificationsSent: any;
        totalConversions: number;
        conversionRate: number;
        isRunning: boolean;
    };
}
export namespace WINBACK_OFFERS {
    namespace free_churn_risk {
        let title: string;
        let body: string;
        let coins: number;
        let cooldownDays: number;
    }
    namespace paying_churn_risk {
        let title_1: string;
        export { title_1 as title };
        let body_1: string;
        export { body_1 as body };
        let coins_1: number;
        export { coins_1 as coins };
        let cooldownDays_1: number;
        export { cooldownDays_1 as cooldownDays };
    }
    namespace high_value_churn {
        let title_2: string;
        export { title_2 as title };
        let body_2: string;
        export { body_2 as body };
        let coins_2: number;
        export { coins_2 as coins };
        let cooldownDays_2: number;
        export { cooldownDays_2 as cooldownDays };
    }
    namespace streak_broken {
        let title_3: string;
        export { title_3 as title };
        let body_3: string;
        export { body_3 as body };
        let coins_3: number;
        export { coins_3 as coins };
        let cooldownDays_3: number;
        export { cooldownDays_3 as cooldownDays };
    }
}
//# sourceMappingURL=winback-scheduler.d.ts.map