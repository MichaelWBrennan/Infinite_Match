export default LevelAnalyticsService;
export class LevelAnalyticsService {
    isEnabled: boolean;
    /**
     * Record a level start attempt.
     */
    recordLevelStart(playerId: any, levelNumber: any, { mode, nowMs }?: {
        mode?: string | undefined;
        nowMs?: number | undefined;
    }): void;
    /**
     * Record a level completion (win).
     */
    recordLevelComplete(playerId: any, levelNumber: any, { movesUsed, timeMs, starsEarned, nowMs }?: {
        nowMs?: number | undefined;
    }): void;
    /**
     * Record a level failure (loss / out of moves).
     */
    recordLevelFail(playerId: any, levelNumber: any, { movesUsed, timeMs, reason, nowMs }?: {
        reason?: string | undefined;
        nowMs?: number | undefined;
    }): void;
    /**
     * Record a continue used on a level.
     */
    recordContinue(playerId: any, levelNumber: any, { nowMs }?: {
        nowMs?: number | undefined;
    }): void;
    /**
     * Record a skip used on a level.
     */
    recordSkip(playerId: any, levelNumber: any, { nowMs }?: {
        nowMs?: number | undefined;
    }): void;
    /**
     * Get statistics for a specific level.
     */
    getLevelStats(levelNumber: any): any;
    /**
     * Get fail rate for a level (failures / attempts).
     */
    getFailRate(levelNumber: any): number;
    /**
     * Get completion rate for a level (completions / attempts).
     */
    getCompletionRate(levelNumber: any): number;
    /**
     * Identify choke points - levels with high fail rates that may cause churn.
     * Returns levels with fail rate > threshold, sorted by severity.
     */
    getChokePoints({ failRateThreshold, minAttempts }?: {
        failRateThreshold?: number | undefined;
        minAttempts?: number | undefined;
    }): {
        level: any;
        attempts: any;
        completions: any;
        failures: any;
        failRate: number;
        completionRate: number;
        continuesUsed: any;
        skipsUsed: any;
        avgMoves: number;
        avgTimeMs: number;
        severity: string;
    }[];
    /**
     * Get level difficulty curve - fail rates for a range of levels.
     */
    getDifficultyCurve(fromLevel?: number, toLevel?: number): {
        level: number;
        attempts: any;
        failRate: number;
        completionRate: number;
        difficulty: string;
    }[];
    /**
     * Get overall analytics summary.
     */
    getSummary(): {
        totalLevelsTracked: number;
        totalAttempts: any;
        totalCompletions: any;
        totalFailures: any;
        overallFailRate: number;
        overallCompletionRate: number;
        chokePoints: number;
    };
    /**
     * Reset all analytics (for testing).
     */
    reset(): void;
}
//# sourceMappingURL=level-analytics-service.d.ts.map