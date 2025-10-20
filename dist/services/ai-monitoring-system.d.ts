/**
 * AI Monitoring System - Comprehensive monitoring and alerting for all AI services
 *
 * Features:
 * - Real-time performance monitoring
 * - Intelligent alerting system
 * - Performance analytics and insights
 * - Automated optimization recommendations
 * - Health checks and diagnostics
 * - Resource usage tracking
 */
export class AIMonitoringSystem extends EventEmitter<[never]> {
    constructor();
    logger: Logger;
    redis: Redis;
    config: {
        monitoringInterval: number;
        alertCooldown: number;
        maxAlertsPerHour: number;
        performanceThresholds: {
            responseTime: number;
            errorRate: number;
            cacheHitRate: number;
            memoryUsage: number;
            cpuUsage: number;
        };
    };
    metrics: {
        totalRequests: number;
        totalErrors: number;
        averageResponseTime: number;
        cacheHitRate: number;
        memoryUsage: number;
        cpuUsage: number;
        activeConnections: number;
        lastUpdate: number;
    };
    alerts: Map<any, any>;
    alertHistory: any[];
    alertCooldowns: Map<any, any>;
    serviceHealth: {
        contentGenerator: string;
        personalizationEngine: string;
        analyticsEngine: string;
        cacheManager: string;
        redis: string;
    };
    baselines: {
        responseTime: number;
        errorRate: number;
        cacheHitRate: number;
        memoryUsage: number;
    };
    /**
     * Initialize monitoring system
     */
    initializeMonitoring(): Promise<void>;
    /**
     * Performance monitoring
     */
    startPerformanceMonitoring(): void;
    collectPerformanceMetrics(): Promise<void>;
    analyzePerformance(): Promise<void>;
    checkThresholds(): Promise<void>;
    /**
     * Health checks
     */
    startHealthChecks(): void;
    checkServiceHealth(): Promise<void>;
    checkAIServiceHealth(serviceName: any): Promise<"healthy" | "unhealthy">;
    /**
     * Alert processing
     */
    startAlertProcessing(): void;
    processAlert(alert: any): Promise<void>;
    sendAlertNotifications(alert: any): Promise<void>;
    sendToMonitoringSystem(alert: any): Promise<void>;
    sendEmailNotification(alert: any): Promise<void>;
    sendSlackNotification(alert: any): Promise<void>;
    processPendingAlerts(): Promise<void>;
    /**
     * Metrics collection
     */
    startMetricsCollection(): void;
    collectDetailedMetrics(): Promise<void>;
    /**
     * Optimization analysis
     */
    startOptimizationAnalysis(): void;
    analyzeOptimizationOpportunities(): Promise<void>;
    /**
     * Utility methods
     */
    getServiceStats(serviceName: any): {
        totalRequests: number;
        totalErrors: number;
        averageResponseTime: number;
    };
    calculateWeightedAverage(items: any): number;
    getMemoryUsage(): number;
    getCPUUsage(): number;
    getActiveConnections(): number;
    storeMetrics(): Promise<void>;
    analyzeTrends(): Promise<{
        responseTimeTrend: string;
        errorRateTrend: string;
        cacheHitRateTrend: string;
    }>;
    detectAnomalies(): Promise<never[]>;
    generateInsights(trends: any, anomalies: any): Promise<string[]>;
    /**
     * Public API methods
     */
    getMetrics(): {
        current: {
            totalRequests: number;
            totalErrors: number;
            averageResponseTime: number;
            cacheHitRate: number;
            memoryUsage: number;
            cpuUsage: number;
            activeConnections: number;
            lastUpdate: number;
        };
        health: {
            contentGenerator: string;
            personalizationEngine: string;
            analyticsEngine: string;
            cacheManager: string;
            redis: string;
        };
        alerts: any[];
        baselines: {
            responseTime: number;
            errorRate: number;
            cacheHitRate: number;
            memoryUsage: number;
        };
    };
    getAlertHistory(limit?: number): any[];
    getHistoricalMetrics(timeRange?: string): Promise<any[]>;
    clearAlerts(): Promise<void>;
    shutdown(): Promise<void>;
}
export const aiMonitoringSystem: AIMonitoringSystem;
import { EventEmitter } from 'events';
import { Logger } from '../core/logger/index.js';
import Redis from 'ioredis';
//# sourceMappingURL=ai-monitoring-system.d.ts.map