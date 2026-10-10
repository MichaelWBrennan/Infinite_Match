declare const _default: PlayerInterventionSystem;
export default _default;
export class PlayerInterventionSystem {
    isInitialized: boolean;
    interventionRules: Map<any, any>;
    triggerConditions: Map<any, any>;
    interventionHistory: Map<any, any>;
    playerStates: Map<any, any>;
    playerBehaviors: Map<any, any>;
    playerInteractions: Map<any, any>;
    interventionActions: Map<any, any>;
    actionTemplates: Map<any, any>;
    interventionSuccess: Map<any, any>;
    retentionMetrics: Map<any, any>;
    activeInterventions: Map<any, any>;
    interventionQueue: any[];
    metrics: {
        interventionsTriggered: number;
        interventionsSuccessful: number;
        playersRescued: number;
        churnPrevented: number;
        revenueRecovered: number;
        averageResponseTime: number;
    };
    initialize(): Promise<void>;
    initializeInterventionRules(): void;
    initializeActionTemplates(): void;
    setupTriggerConditions(): void;
    analyzePlayerState(playerId: any): Promise<{
        playerId: any;
        timestamp: number;
        churnAnalysis: {
            playerId: any;
            risk: number;
            level: string;
            factors: {
                hoursInactive: number;
                daysWithoutProgress: any;
                hasSpent: boolean;
            };
            timestamp: number;
        } | {
            playerId: any;
            risk: number;
            level: string;
            timestamp: number;
            factors?: never;
        };
        progressionAnalysis: {
            playerId: any;
            risk: number;
            level: string;
            currentLevel: any;
            daysWithoutProgress: any;
            timestamp: number;
        } | {
            playerId: any;
            risk: number;
            timestamp: number;
            level?: never;
            currentLevel?: never;
            daysWithoutProgress?: never;
        };
        socialAnalysis: {
            playerId: any;
            risk: number;
            friendCount: any;
            level: string;
            timestamp: number;
        } | {
            playerId: any;
            risk: number;
            timestamp: number;
            friendCount?: never;
            level?: never;
        };
        engagementAnalysis: {
            playerId: any;
            score: number;
            risk: number;
            sessionCount: any;
            engagementDrop: any;
            timestamp: number;
        } | {
            playerId: any;
            score: number;
            risk: number;
            timestamp: number;
            sessionCount?: never;
            engagementDrop?: never;
        };
        overallRisk: number;
        recommendedInterventions: string[];
    } | null>;
    checkInterventionTriggers(playerId: any): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        playerId: any;
        ruleName: any;
        rule: any;
        playerState: {
            playerId: any;
            timestamp: number;
            churnAnalysis: {
                playerId: any;
                risk: number;
                level: string;
                factors: {
                    hoursInactive: number;
                    daysWithoutProgress: any;
                    hasSpent: boolean;
                };
                timestamp: number;
            } | {
                playerId: any;
                risk: number;
                level: string;
                timestamp: number;
                factors?: never;
            };
            progressionAnalysis: {
                playerId: any;
                risk: number;
                level: string;
                currentLevel: any;
                daysWithoutProgress: any;
                timestamp: number;
            } | {
                playerId: any;
                risk: number;
                timestamp: number;
                level?: never;
                currentLevel?: never;
                daysWithoutProgress?: never;
            };
            socialAnalysis: {
                playerId: any;
                risk: number;
                friendCount: any;
                level: string;
                timestamp: number;
            } | {
                playerId: any;
                risk: number;
                timestamp: number;
                friendCount?: never;
                level?: never;
            };
            engagementAnalysis: {
                playerId: any;
                score: number;
                risk: number;
                sessionCount: any;
                engagementDrop: any;
                timestamp: number;
            } | {
                playerId: any;
                score: number;
                risk: number;
                timestamp: number;
                sessionCount?: never;
                engagementDrop?: never;
            };
            overallRisk: number;
            recommendedInterventions: string[];
        };
        priority: any;
        timestamp: number;
        status: string;
    }[]>;
    executeIntervention(intervention: any): Promise<any>;
    executeAction(playerId: any, action: any, intervention: any): Promise<void>;
    checkInterventionSuccess(intervention: any): Promise<void>;
    giveReward(playerId: any, action: any): Promise<void>;
    createPersonalizedReward(playerId: any, action: any): Promise<any>;
    triggerSocialEvent(playerId: any, action: any): Promise<void>;
    /**
     * Estimate churn risk (0..1).
     *
     * `analyzePlayerState()` called this but it was never implemented, so
     * building a player state threw "this.analyzeChurnRisk is not a function"
     * and no intervention could ever be triggered.
     */
    analyzeChurnRisk(playerId: any, playerData?: {}): Promise<{
        playerId: any;
        risk: number;
        level: string;
        factors: {
            hoursInactive: number;
            daysWithoutProgress: any;
            hasSpent: boolean;
        };
        timestamp: number;
    } | {
        playerId: any;
        risk: number;
        level: string;
        timestamp: number;
        factors?: never;
    }>;
    /** Measure progression stall risk (0..1) from days without progress. */
    analyzeProgression(playerId: any, playerData?: {}): Promise<{
        playerId: any;
        risk: number;
        level: string;
        currentLevel: any;
        daysWithoutProgress: any;
        timestamp: number;
    } | {
        playerId: any;
        risk: number;
        timestamp: number;
        level?: never;
        currentLevel?: never;
        daysWithoutProgress?: never;
    }>;
    /** Measure social-disengagement risk (0..1); no friends means maximum risk. */
    analyzeSocialEngagement(playerId: any, playerData?: {}): Promise<{
        playerId: any;
        risk: number;
        friendCount: any;
        level: string;
        timestamp: number;
    } | {
        playerId: any;
        risk: number;
        timestamp: number;
        friendCount?: never;
        level?: never;
    }>;
    /**
     * Measure engagement. Exposes BOTH `score` (used by the success evaluation)
     * and `risk` (used by calculateOverallRisk).
     */
    analyzeEngagement(playerId: any, playerData?: {}): Promise<{
        playerId: any;
        score: number;
        risk: number;
        sessionCount: any;
        engagementDrop: any;
        timestamp: number;
    } | {
        playerId: any;
        score: number;
        risk: number;
        timestamp: number;
        sessionCount?: never;
        engagementDrop?: never;
    }>;
    /** Build hint content for a hint action. */
    generateHint(playerId: any, action?: {}): Promise<{
        type: any;
        text: any;
        playerId: any;
        timestamp: number;
    } | {
        type: string;
        text: string;
        playerId: any;
        timestamp?: never;
    }>;
    /** Build a personalised offer for an offer action. */
    generatePersonalizedOffer(playerId: any, action?: {}, playerData?: {}): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        type: any;
        title: string;
        price: number;
        currency: any;
        contents: {
            coins: number;
            gems: number;
        };
        playerId: any;
        timestamp: number;
    } | null>;
    /** Build a content recommendation for a recommendation action. */
    generateContentRecommendation(playerId: any, action?: {}): Promise<{
        type: any;
        text: any;
        playerId: any;
        timestamp: number;
    } | null>;
    provideHint(playerId: any, action: any): Promise<void>;
    givePowerUp(playerId: any, action: any): Promise<void>;
    adjustDifficulty(playerId: any, action: any): Promise<void>;
    createPersonalizedOffer(playerId: any, action: any): Promise<void>;
    providePrioritySupport(playerId: any, action: any): Promise<void>;
    provideSocialRecognition(playerId: any, action: any): Promise<void>;
    recommendContent(playerId: any, action: any): Promise<void>;
    getPlayerData(playerId: any): Promise<any>;
    getPlayerBehavior(playerId: any): Promise<any>;
    getPlayerInteractions(playerId: any): Promise<any>;
    evaluateInterventionRule(playerId: any, rule: any, playerState: any): Promise<boolean>;
    evaluateInterventionSuccess(intervention: any, updatedPlayerState: any): Promise<boolean>;
    calculateStateImprovement(oldState: any, newState: any): number;
    calculateOverallRisk(churnAnalysis: any, progressionAnalysis: any, socialAnalysis: any, engagementAnalysis: any): number;
    getRecommendedInterventions(playerId: any, analysis: any): Promise<string[]>;
    startPlayerMonitoring(): void;
    startInterventionProcessor(): void;
    startSuccessTracking(): void;
    startMetricsUpdater(): void;
    monitorPlayers(): Promise<void>;
    processInterventionQueue(): Promise<void>;
    trackInterventionSuccess(): Promise<void>;
    updateMetrics(): Promise<void>;
    getActivePlayers(): Promise<string[]>;
    trackActionExecution(playerId: any, action: any, intervention: any): Promise<void>;
    getInterventionMetrics(): Promise<{
        activeInterventions: number;
        totalInterventions: number;
        successRate: number;
        interventionsTriggered: number;
        interventionsSuccessful: number;
        playersRescued: number;
        churnPrevented: number;
        revenueRecovered: number;
        averageResponseTime: number;
    }>;
    getPlayerInterventions(playerId: any): Promise<any[]>;
    getActiveInterventions(): Promise<any[]>;
    getInterventionRules(): Promise<[any, any][]>;
    getActionTemplates(): Promise<[any, any][]>;
}
//# sourceMappingURL=player-intervention-system.d.ts.map