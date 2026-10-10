declare const _default: PrometheusMonitoringService;
export default _default;
/**
 * Prometheus Monitoring Service
 * Replaces Datadog with self-hosted Prometheus monitoring
 */
declare class PrometheusMonitoringService {
    logger: Logger;
    gameEventsTotal: Counter<"platform" | "event_type" | "player_cohort">;
    gameSessionsTotal: Counter<"platform" | "session_duration_bucket">;
    playerLevels: Gauge<"player_id" | "cohort">;
    gamePerformance: Histogram<"level" | "platform" | "metric_name">;
    apiRequests: Counter<"method" | "endpoint" | "status_code">;
    apiDuration: Histogram<"method" | "endpoint">;
    databaseConnections: Gauge<string>;
    redisConnections: Gauge<string>;
    isInitialized: boolean;
    metrics: {
        requests: number;
        errors: number;
        latency: never[];
    };
    /**
     * Initialize monitoring service
     */
    initialize(): Promise<void>;
    /**
     * Track game events (replaces Datadog events)
     */
    trackGameEvent(eventType: any, playerCohort?: string, platform?: string): void;
    /**
     * Track game sessions
     */
    trackGameSession(platform?: string, sessionDuration?: number): void;
    /**
     * Track player level
     */
    trackPlayerLevel(playerId: any, level: any, cohort?: string): void;
    /**
     * Track performance metrics
     */
    trackPerformance(metricName: any, value: any, level?: string, platform?: string): void;
    /**
     * Track API requests
     */
    trackApiRequest(method: any, endpoint: any, statusCode: any): void;
    /**
     * Track API duration
     */
    trackApiDuration(method: any, endpoint: any, duration: any): void;
    /**
     * Track database connections
     */
    trackDatabaseConnections(count: any): void;
    /**
     * Track Redis connections
     */
    trackRedisConnections(count: any): void;
    /**
     * Get duration bucket for histogram
     */
    getDurationBucket(duration: any): "0-60s" | "1-5m" | "5-15m" | "15-30m" | "30-60m" | "60m+";
    /**
     * Get metrics in Prometheus format
     */
    getMetrics(): Promise<string>;
    /**
     * Get health status
     */
    getHealthStatus(): {
        status: string;
        metrics: {
            requests: number;
            errors: number;
            averageLatency: number;
            errorRate: number;
        };
        timestamp: string;
    };
    /**
     * Record latency
     */
    recordLatency(latency: any): void;
    /**
     * Record error
     */
    recordError(): void;
    /**
     * Get monitoring dashboard data
     */
    getDashboardData(): Promise<{
        metrics: string;
        health: {
            status: string;
            metrics: {
                requests: number;
                errors: number;
                averageLatency: number;
                errorRate: number;
            };
            timestamp: string;
        };
        generatedAt: string;
    }>;
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
}
import { Logger } from '../core/logger/index.js';
import { Counter } from 'prom-client';
import { Gauge } from 'prom-client';
import { Histogram } from 'prom-client';
//# sourceMappingURL=prometheus-monitoring-service.d.ts.map