declare const _default: OpenSourceCloudServicesManager;
export default _default;
/**
 * Open Source Cloud Services Manager
 * Replaces AWS, Google Cloud, and Azure with self-hosted alternatives
 */
declare class OpenSourceCloudServicesManager {
    logger: Logger;
    minio: MinioClient | null;
    postgres: Sequelize | null;
    emailTransporter: import("nodemailer").Mail<import("nodemailer").SMTPSentMessageInfo, import("nodemailer").SMTPTransportOptions> | null;
    redis: any;
    isInitialized: boolean;
    healthChecks: Map<any, any>;
    serviceStatus: Map<any, any>;
    metrics: {
        requests: number;
        errors: number;
        latency: never[];
    };
    /**
     * Initialize all open source cloud services
     */
    initialize(): Promise<void>;
    initializeMinIO(): Promise<void>;
    initializePostgreSQL(): Promise<void>;
    initializeEmailService(): Promise<void>;
    initializeRedis(): Promise<void>;
    initializeJobQueue(): Promise<void>;
    jobQueue: Queue<any, any, string, any, any, string, import("bullmq").RedisQueueBackend, import("bullmq").ConnectionOptions> | undefined;
    setupHealthChecks(): void;
    checkMinIOHealth(): Promise<{
        status: string;
        service: string;
        error?: never;
    } | {
        status: string;
        service: string;
        error: any;
    }>;
    checkPostgreSQLHealth(): Promise<{
        status: string;
        service: string;
        error?: never;
    } | {
        status: string;
        service: string;
        error: any;
    }>;
    checkEmailHealth(): Promise<{
        status: string;
        service: string;
        error?: never;
    } | {
        status: string;
        service: string;
        error: any;
    }>;
    checkRedisHealth(): Promise<{
        status: string;
        service: string;
        error?: never;
    } | {
        status: string;
        service: string;
        error: any;
    }>;
    saveGameState(userId: any, gameState: any): Promise<{
        success: boolean;
        degraded: boolean;
        userId: any;
        gameState: any;
        error?: never;
    } | {
        success: boolean;
        userId: any;
        gameState: any;
        degraded?: never;
        error?: never;
    } | {
        success: boolean;
        degraded: boolean;
        userId: any;
        error: any;
        gameState?: never;
    }>;
    getGameState(userId: any): Promise<any>;
    uploadAsset(bucketName: any, key: any, data: any, contentType?: string): Promise<{
        success: boolean;
        url: string;
    }>;
    deleteAsset(bucketName: any, key: any): Promise<{
        success: boolean;
    }>;
    sendEmail(to: any, subject: any, body: any, isHtml?: boolean): Promise<{
        success: boolean;
    }>;
    sendGameEventNotification(eventType: any, userId: any, eventData: any): Promise<{
        success: boolean;
        degraded: boolean;
        messageId: `${string}-${string}-${string}-${string}-${string}`;
        error?: never;
    } | {
        success: boolean;
        messageId: `${string}-${string}-${string}-${string}-${string}`;
        degraded?: never;
        error?: never;
    } | {
        success: boolean;
        degraded: boolean;
        error: any;
        messageId?: never;
    }>;
    /**
     * Create the `player_data` table on first use (idempotent).
     */
    ensurePlayerDataTable(): Promise<void>;
    /**
     * Persist a player's progression record.
     *
     * The legacy name is kept because the game routes call it; the backing
     * store is PostgreSQL (not DynamoDB).
     */
    savePlayerDataToDynamoDB(tableName: any, playerData: any): Promise<{
        success: boolean;
        degraded: boolean;
        error?: never;
    } | {
        success: boolean;
        degraded?: never;
        error?: never;
    } | {
        success: boolean;
        degraded: boolean;
        error: any;
    }>;
    /**
     * Read a player's progression record. Returns null when the store is
     * unavailable so GET /api/game/progress degrades instead of 500-ing.
     */
    getPlayerProgress(playerId: any): Promise<{
        playerId: any;
        level: number;
        score: number;
        gameData: any;
        lastUpdated: string | null;
    } | null>;
    /**
     * Read a player's achievements. Returns [] when the store is unavailable.
     */
    getPlayerAchievements(playerId: any): Promise<any>;
    /**
     * Read a leaderboard page. Returns [] when the store is unavailable.
     */
    getLeaderboard(type?: string, limit?: number): Promise<{
        playerId: any;
        level: number;
        score: number;
        rank: number;
        type: string;
    }[]>;
    recordLatency(latency: any): void;
    getServiceStatus(): {
        initialized: boolean;
        metrics: {
            averageLatency: number;
            errorRate: number;
            requests: number;
            errors: number;
            latency: never[];
        };
        services: {
            minio: any;
            postgres: any;
            email: any;
            redis: any;
            jobQueue: any;
        };
    };
    getHealthStatus(): Promise<{
        overall: string;
        services: any[];
        timestamp: string;
    }>;
    shutdown(): Promise<void>;
}
import { Logger } from '../core/logger/index.js';
import { Client as MinioClient } from 'minio';
import { Sequelize } from 'sequelize';
import { Queue } from 'bullmq';
//# sourceMappingURL=open-source-cloud-services.d.ts.map