export default SegmentedRetentionService;
export class SegmentedRetentionService {
    constructor(retentionService: any);
    retentionService: any;
    /**
     * Compute retention for a specific segment of players.
     *
     * @param {Map} playerEconomies - Map of playerId -> economy
     * @param {string} segmentId - Segment ID to filter by
     * @param {Object} context - Context with nowMs
     * @returns {Object} Retention data for the segment
     */
    computeSegmentRetention(playerEconomies: Map<any, any>, segmentId: string, { nowMs }?: Object): Object;
    /**
     * Compute retention for ALL segments at once.
     * Returns { segments: { segmentId: retentionData }, summary: {} }.
     */
    computeAllSegmentRetention(playerEconomies: any, { nowMs }?: {
        nowMs?: number | undefined;
    }): Promise<{
        segments: {};
        belowBenchmark: {
            segmentId: string;
            metric: string;
            value: any;
            benchmark: number;
        }[];
        computedAt: string;
    }>;
    /**
     * Get the segments that need immediate attention (lowest retention).
     */
    getPrioritySegments(playerEconomies: any, { nowMs, limit }?: {
        nowMs?: number | undefined;
        limit?: number | undefined;
    }): Promise<{
        segmentId: string;
        metric: string;
        currentValue: any;
        benchmark: number;
        gap: number;
        segmentSize: any;
    }[]>;
    utcDay(ms: any): string;
    addDays(day: any, n: any): string;
    _avg(rows: any, field: any): number;
}
//# sourceMappingURL=segmented-retention-service.d.ts.map