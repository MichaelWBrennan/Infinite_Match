/**
 * Segment a single player based on their economy data and context.
 * Returns an array of segment IDs the player belongs to.
 */
export function segmentPlayer(playerId: any, economy: any, context?: {}): string[];
/**
 * Segment all players from a map of playerId -> economy.
 * Returns { segments: Map<segmentId, Set<playerId>>, playerSegments: Map<playerId, Set<segmentId>> }.
 */
export function segmentAllPlayers(playerEconomies: any, context?: {}): {
    segments: Map<any, any>;
    playerSegments: Map<any, any>;
};
/**
 * Get players who are at risk of churning (inactive 7-14 days, previously active).
 */
export function getChurnRiskPlayers(playerEconomies: any, context?: {}): {
    playerId: any;
    daysInactive: number;
    streak: any;
    totalSpent: any;
    levelsCompleted: any;
    segment: string;
    priority: string;
}[];
/**
 * Get players who have churned (inactive 15+ days).
 */
export function getChurnedPlayers(playerEconomies: any, context?: {}): {
    playerId: any;
    daysInactive: number;
    totalSpent: any;
    levelsCompleted: any;
    streak: any;
}[];
/**
 * Get high-value players who are at risk (spenders with churn probability).
 */
export function getHighValueAtRiskPlayers(playerEconomies: any, context?: {}): {
    playerId: any;
    daysInactive: number;
    totalSpent: any;
    streak: any;
    churnRisk: string;
}[];
declare namespace _default {
    export { segmentPlayer };
    export { segmentAllPlayers };
    export { getChurnRiskPlayers };
    export { getChurnedPlayers };
    export { getHighValueAtRiskPlayers };
}
export default _default;
//# sourceMappingURL=player-segmentation-service.d.ts.map