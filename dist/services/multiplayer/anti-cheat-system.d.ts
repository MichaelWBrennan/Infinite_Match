/**
 * Anti-Cheat System
 * Detects and prevents cheating in multiplayer games
 */
export class AntiCheatSystem {
    logger: Logger;
    playerProfiles: Map<any, any>;
    suspiciousActivities: Map<any, any>;
    banList: Set<any>;
    thresholds: {
        maxMovesPerSecond: number;
        maxScorePerSecond: number;
        maxConsecutivePerfectMoves: number;
        maxImpossibleMoves: number;
        maxSuspiciousPatterns: number;
    };
    patterns: {
        botBehavior: {
            name: string;
            detect: (profile: any, move: any) => boolean;
            confidence: number;
        }[];
        impossibleMoves: {
            name: string;
            detect: (move: any, gameState: any) => boolean;
        }[];
        scoreManipulation: {
            name: string;
            detect: (profile: any, move: any, gameState: any) => boolean;
            expectedScore: number;
            actualScore: number;
        }[];
    };
    /**
     * Initialize anti-cheat system
     */
    initializeAntiCheatSystem(): void;
    /**
     * Validate a move for cheating
     */
    validateMove(playerId: any, move: any, gameState: any, sessionData: any): {
        valid: boolean;
        suspicious: boolean;
        warnings: (string | undefined)[];
    };
    /**
     * Check move frequency
     */
    checkMoveFrequency(profile: any, now: any): {
        suspicious: boolean;
        warning: string;
        details: {
            movesPerSecond: any;
            threshold: number;
        };
    } | {
        suspicious: boolean;
        warning?: never;
        details?: never;
    };
    /**
     * Check for impossible moves
     */
    checkImpossibleMoves(move: any, gameState: any): {
        suspicious: boolean;
        warning: string;
        details: {
            pattern: string;
            move: any;
        };
    } | {
        suspicious: boolean;
        warning?: never;
        details?: never;
    };
    /**
     * Check for bot behavior
     */
    checkBotBehavior(profile: any, move: any): {
        suspicious: boolean;
        warning: string;
        details: {
            pattern: string;
            confidence: number;
        };
    } | {
        suspicious: boolean;
        warning?: never;
        details?: never;
    };
    /**
     * Check for score manipulation
     */
    checkScoreManipulation(profile: any, move: any, gameState: any): {
        suspicious: boolean;
        warning: string;
        details: {
            pattern: string;
            expectedScore: number;
            actualScore: number;
        };
    } | {
        suspicious: boolean;
        warning?: never;
        details?: never;
    };
    /**
     * Check for pattern repetition
     */
    checkPatternRepetition(profile: any, move: any): {
        suspicious: boolean;
        warning?: never;
        details?: never;
    } | {
        suspicious: boolean;
        warning: string;
        details: {
            maxRepetition: number;
            patterns: {};
        };
    };
    /**
     * Check for timing anomalies
     */
    checkTimingAnomalies(profile: any, now: any): {
        suspicious: boolean;
        warning?: never;
        details?: never;
    } | {
        suspicious: boolean;
        warning: string;
        details: {
            standardDeviation: number;
            avgInterval: number;
            minInterval?: never;
        };
    } | {
        suspicious: boolean;
        warning: string;
        details: {
            minInterval: number;
            standardDeviation?: never;
            avgInterval?: never;
        };
    };
    /**
     * Get player profile
     */
    getPlayerProfile(playerId: any): any;
    /**
     * Update player activity
     */
    updatePlayerActivity(profile: any, move: any, timestamp: any): void;
    /**
     * Record suspicious activity
     */
    recordSuspiciousActivity(playerId: any, suspiciousChecks: any, move: any): void;
    /**
     * Calculate severity of suspicious activity
     */
    calculateSeverity(suspiciousChecks: any): number;
    /**
     * Flag player for review
     */
    flagPlayerForReview(playerId: any, suspiciousChecks: any): void;
    /**
     * Ban a player
     */
    banPlayer(playerId: any, reason: any): void;
    /**
     * Unban a player
     */
    unbanPlayer(playerId: any): void;
    /**
     * Notify about player ban
     */
    notifyPlayerBan(playerId: any, reason: any): void;
    /**
     * Extract move patterns
     */
    extractMovePatterns(moves: any): {
        from1: any;
        to1: any;
        from2: any;
        to2: any;
        pattern: string;
    }[];
    /**
     * Create move pattern
     */
    createMovePattern(move1: any, move2: any): {
        from1: any;
        to1: any;
        from2: any;
        to2: any;
        pattern: string;
    };
    /**
     * Get bot behavior patterns
     */
    getBotBehaviorPatterns(): {
        name: string;
        detect: (profile: any, move: any) => boolean;
        confidence: number;
    }[];
    /**
     * Get impossible move patterns
     */
    getImpossibleMovePatterns(): {
        name: string;
        detect: (move: any, gameState: any) => boolean;
    }[];
    /**
     * Get score manipulation patterns
     */
    getScoreManipulationPatterns(): {
        name: string;
        detect: (profile: any, move: any, gameState: any) => boolean;
        expectedScore: number;
        actualScore: number;
    }[];
    /**
     * Calculate expected score for a move
     */
    calculateExpectedScore(move: any, gameState: any): number;
    /**
     * Cleanup old data
     */
    cleanupOldData(): void;
    /**
     * Analyze suspicious activities
     */
    analyzeSuspiciousActivities(): void;
    /**
     * Get player statistics
     */
    getPlayerStatistics(playerId: any): {
        playerId: any;
        totalMoves: any;
        suspiciousActivities: any;
        averageMoveTime: any;
        isBanned: boolean;
        lastActivity: any;
    };
    /**
     * Get system statistics
     */
    getSystemStatistics(): {
        totalPlayers: number;
        bannedPlayers: number;
        suspiciousPlayers: number;
        totalSuspiciousActivities: any;
    };
}
import { Logger } from '../../core/logger/index.js';
//# sourceMappingURL=anti-cheat-system.d.ts.map