export const aiAnalyticsEngine: AIAnalyticsEngine;
/**
 * AI Analytics Engine - Advanced analytics with AI-powered insights and predictions
 * Provides real-time analysis, predictive modeling, and automated optimization recommendations
 *
 * OPTIMIZATIONS:
 * - Redis caching for analytics data and predictions
 * - Real-time data processing pipeline
 * - Machine learning model optimization
 * - Performance monitoring and alerting
 * - Intelligent data aggregation
 * - Memory optimization and garbage collection
 */
export class AIAnalyticsEngine {
    logger: Logger;
    openai: (() => never) | import("openai").default;
    hf: (() => never) | {
        textGeneration({ model, inputs, parameters }?: {
            parameters?: {} | undefined;
        }): Promise<{
            generated_text: any;
        }>;
    };
    posthog: PostHogAnalyticsService;
    supabase: {
        from(table: any): {
            select(columns: any): {
                select(columns?: string): /*elided*/ any;
                eq: (column: any, value: any) => /*elided*/ any;
                neq: (column: any, value: any) => /*elided*/ any;
                gt: (column: any, value: any) => /*elided*/ any;
                gte: (column: any, value: any) => /*elided*/ any;
                lt: (column: any, value: any) => /*elided*/ any;
                lte: (column: any, value: any) => /*elided*/ any;
                in(column: any, values: any): /*elided*/ any;
                match(filterObject: any): /*elided*/ any;
                order(column: any, options?: {}): /*elided*/ any;
                limit(count: any): /*elided*/ any;
                single(): /*elided*/ any;
                then(onFulfilled: any, onRejected: any): Promise<{
                    data: null;
                    error: {
                        message: any;
                        code: any;
                        details: any;
                    };
                } | {
                    data: any;
                    error: null;
                }>;
                catch(onRejected: any): Promise<{
                    data: null;
                    error: {
                        message: any;
                        code: any;
                        details: any;
                    };
                } | {
                    data: any;
                    error: null;
                }>;
            };
            insert(rows: any): {
                select(columns?: string): /*elided*/ any;
                eq: (column: any, value: any) => /*elided*/ any;
                neq: (column: any, value: any) => /*elided*/ any;
                gt: (column: any, value: any) => /*elided*/ any;
                gte: (column: any, value: any) => /*elided*/ any;
                lt: (column: any, value: any) => /*elided*/ any;
                lte: (column: any, value: any) => /*elided*/ any;
                in(column: any, values: any): /*elided*/ any;
                match(filterObject: any): /*elided*/ any;
                order(column: any, options?: {}): /*elided*/ any;
                limit(count: any): /*elided*/ any;
                single(): /*elided*/ any;
                then(onFulfilled: any, onRejected: any): Promise<{
                    data: null;
                    error: {
                        message: any;
                        code: any;
                        details: any;
                    };
                } | {
                    data: any;
                    error: null;
                }>;
                catch(onRejected: any): Promise<{
                    data: null;
                    error: {
                        message: any;
                        code: any;
                        details: any;
                    };
                } | {
                    data: any;
                    error: null;
                }>;
            };
            upsert(rows: any, options?: {}): {
                select(columns?: string): /*elided*/ any;
                eq: (column: any, value: any) => /*elided*/ any;
                neq: (column: any, value: any) => /*elided*/ any;
                gt: (column: any, value: any) => /*elided*/ any;
                gte: (column: any, value: any) => /*elided*/ any;
                lt: (column: any, value: any) => /*elided*/ any;
                lte: (column: any, value: any) => /*elided*/ any;
                in(column: any, values: any): /*elided*/ any;
                match(filterObject: any): /*elided*/ any;
                order(column: any, options?: {}): /*elided*/ any;
                limit(count: any): /*elided*/ any;
                single(): /*elided*/ any;
                then(onFulfilled: any, onRejected: any): Promise<{
                    data: null;
                    error: {
                        message: any;
                        code: any;
                        details: any;
                    };
                } | {
                    data: any;
                    error: null;
                }>;
                catch(onRejected: any): Promise<{
                    data: null;
                    error: {
                        message: any;
                        code: any;
                        details: any;
                    };
                } | {
                    data: any;
                    error: null;
                }>;
            };
            update(patch: any): {
                select(columns?: string): /*elided*/ any;
                eq: (column: any, value: any) => /*elided*/ any;
                neq: (column: any, value: any) => /*elided*/ any;
                gt: (column: any, value: any) => /*elided*/ any;
                gte: (column: any, value: any) => /*elided*/ any;
                lt: (column: any, value: any) => /*elided*/ any;
                lte: (column: any, value: any) => /*elided*/ any;
                in(column: any, values: any): /*elided*/ any;
                match(filterObject: any): /*elided*/ any;
                order(column: any, options?: {}): /*elided*/ any;
                limit(count: any): /*elided*/ any;
                single(): /*elided*/ any;
                then(onFulfilled: any, onRejected: any): Promise<{
                    data: null;
                    error: {
                        message: any;
                        code: any;
                        details: any;
                    };
                } | {
                    data: any;
                    error: null;
                }>;
                catch(onRejected: any): Promise<{
                    data: null;
                    error: {
                        message: any;
                        code: any;
                        details: any;
                    };
                } | {
                    data: any;
                    error: null;
                }>;
            };
            delete(): {
                select(columns?: string): /*elided*/ any;
                eq: (column: any, value: any) => /*elided*/ any;
                neq: (column: any, value: any) => /*elided*/ any;
                gt: (column: any, value: any) => /*elided*/ any;
                gte: (column: any, value: any) => /*elided*/ any;
                lt: (column: any, value: any) => /*elided*/ any;
                lte: (column: any, value: any) => /*elided*/ any;
                in(column: any, values: any): /*elided*/ any;
                match(filterObject: any): /*elided*/ any;
                order(column: any, options?: {}): /*elided*/ any;
                limit(count: any): /*elided*/ any;
                single(): /*elided*/ any;
                then(onFulfilled: any, onRejected: any): Promise<{
                    data: null;
                    error: {
                        message: any;
                        code: any;
                        details: any;
                    };
                } | {
                    data: any;
                    error: null;
                }>;
                catch(onRejected: any): Promise<{
                    data: null;
                    error: {
                        message: any;
                        code: any;
                        details: any;
                    };
                } | {
                    data: any;
                    error: null;
                }>;
            };
        };
    } | (() => never);
    redis: any;
    analyticsCache: LRUCache<{}, {}, unknown>;
    predictionCache: LRUCache<{}, {}, unknown>;
    dataProcessingQueue: any[];
    isProcessingData: boolean;
    realTimeMetrics: Map<any, any>;
    performanceMetrics: {
        totalAnalyses: number;
        cacheHits: number;
        cacheMisses: number;
        averageAnalysisTime: number;
        predictionAccuracy: number;
        realTimeUpdates: number;
        lastReset: number;
    };
    mlModels: Map<any, any>;
    modelTrainingQueue: any[];
    isTrainingModels: boolean;
    alertThresholds: Map<any, any>;
    activeAlerts: Map<any, any>;
    analyticsData: Map<any, any>;
    predictions: Map<any, any>;
    insights: Map<any, any>;
    optimizationRecommendations: Map<any, any>;
    /**
     * Analyze player behavior with AI insights
     */
    analyzePlayerBehavior(playerId: any, timeRange?: string): Promise<any>;
    /**
     * Predict player lifetime value (LTV)
     */
    predictPlayerLTV(playerId: any): Promise<any>;
    /**
     * Predict churn risk with AI
     */
    predictChurnRisk(playerId: any): Promise<any>;
    /**
     * Analyze content performance with AI
     */
    analyzeContentPerformance(contentId: any, contentType: any): Promise<any>;
    /**
     * Generate optimization recommendations
     */
    generateOptimizationRecommendations(gameArea: any): Promise<any>;
    /**
     * Analyze market trends with AI
     */
    analyzeMarketTrends(): Promise<any>;
    /**
     * Predict revenue with AI
     */
    predictRevenue(timeRange?: string): Promise<any>;
    /**
     * Generate real-time insights
     */
    generateRealTimeInsights(): Promise<any>;
    /**
     * Build behavior analysis prompt
     */
    buildBehaviorAnalysisPrompt(playerData: any): string;
    /**
     * Build LTV prediction prompt
     */
    buildLTVPredictionPrompt(playerData: any, marketData: any): string;
    /**
     * Build churn prediction prompt
     */
    buildChurnPredictionPrompt(playerData: any): string;
    /**
     * Build content analysis prompt
     */
    buildContentAnalysisPrompt(contentData: any): string;
    /**
     * Build optimization prompt
     */
    buildOptimizationPrompt(gameData: any, marketData: any, gameArea: any): string;
    /**
     * Build market analysis prompt
     */
    buildMarketAnalysisPrompt(marketData: any, competitorData: any): string;
    /**
     * Build revenue prediction prompt
     */
    buildRevenuePredictionPrompt(historicalData: any, marketData: any): string;
    /**
     * Build real-time insights prompt
     */
    buildRealTimeInsightsPrompt(realTimeData: any): string;
    getPlayerData(playerId: any, timeRange: any): Promise<{
        sessions: never[];
        purchases: never[];
        progress: {};
        social: {};
        engagement: {};
    }>;
    getMarketData(): Promise<{}>;
    getCompetitorData(): Promise<{}>;
    getContentData(contentId: any, contentType: any): Promise<{}>;
    getGameData(gameArea: any): Promise<{}>;
    getHistoricalRevenueData(timeRange: any): Promise<{}>;
    getRealTimeData(): Promise<{}>;
    storeBehaviorAnalysis(playerId: any, analysis: any): Promise<void>;
    storeLTVPrediction(playerId: any, prediction: any): Promise<void>;
    storeChurnPrediction(playerId: any, prediction: any): Promise<void>;
    storeContentAnalysis(contentId: any, analysis: any): Promise<void>;
    storeOptimizationRecommendations(gameArea: any, recommendations: any): Promise<void>;
    storeMarketAnalysis(analysis: any): Promise<void>;
    storeRevenuePrediction(prediction: any): Promise<void>;
    storeRealTimeInsights(insights: any): Promise<void>;
    /**
     * Advanced caching system for analytics data and predictions
     */
    getCachedAnalytics(key: any): Promise<any>;
    setCachedAnalytics(key: any, data: any, ttlSeconds?: number): Promise<void>;
    getCachedPrediction(predictionKey: any): Promise<any>;
    setCachedPrediction(predictionKey: any, prediction: any, ttlSeconds?: number): Promise<void>;
    /**
     * Real-time data processing pipeline
     */
    processRealTimeData(data: any): Promise<void>;
    startDataProcessor(): Promise<void>;
    processSingleDataItem(item: any): Promise<void>;
    processPlayerBehaviorData(data: any): Promise<void>;
    processGameMetricsData(data: any): Promise<void>;
    processRevenueData(data: any): Promise<void>;
    processEngagementData(data: any): Promise<void>;
    calculateMovingAverage(current: any, newValue: any, sampleCount: any): any;
    calculateDailyRevenue(currentDaily: any, newRevenue: any, timestamp: any): any;
    /**
     * Machine learning model optimization
     */
    /**
     * Drain the model training queue on a timer.
     *
     * `modelTrainingQueue` receives batches from the data pipeline; when it is
     * empty the interval simply idles so no model work is scheduled on start-up.
     */
    startModelTraining(): void;
    /**
     * Update the aggregate real-time counters for a processed data item.
     */
    updateRealTimeMetrics(type: any, data: any): void;
    /**
     * Flag players whose behaviour deviates sharply from their own baseline.
     */
    checkBehavioralAnomalies(playerId: any, behavior: any): Promise<void>;
    /**
     * Raise an alert when a tracked metric crosses its configured threshold.
     */
    checkMetricThresholds(metric: any, value: any): Promise<void>;
    trainAnalyticsModels(trainingData: any): Promise<void>;
    trainLTVPredictionModel(trainingData: any): Promise<void>;
    trainChurnPredictionModel(trainingData: any): Promise<void>;
    trainRevenuePredictionModel(trainingData: any): Promise<void>;
    trainEngagementPredictionModel(trainingData: any): Promise<void>;
    extractLTVFeatures(trainingData: any): any;
    extractLTVLabels(trainingData: any): any;
    extractChurnFeatures(trainingData: any): any;
    extractChurnLabels(trainingData: any): any;
    extractRevenueFeatures(trainingData: any): any;
    extractRevenueLabels(trainingData: any): any;
    extractEngagementFeatures(trainingData: any): any;
    extractEngagementLabels(trainingData: any): any;
    updateModelWeights(weights: any, features: any, labels: any): any;
    predictWithWeights(weights: any, features: any): number;
    calculateModelAccuracy(features: any, labels: any, weights: any): number;
    /**
     * Alerting system
     */
    startAlertingSystem(): void;
    checkAlerts(): Promise<void>;
    checkRevenueAlerts(): Promise<void>;
    checkEngagementAlerts(): Promise<void>;
    checkChurnAlerts(): Promise<void>;
    checkPerformanceAlerts(): Promise<void>;
    triggerAlert(type: any, data: any): Promise<void>;
    getAlertSeverity(type: any): any;
    sendAlert(alert: any): Promise<void>;
    /**
     * Performance monitoring
     */
    startPerformanceMonitor(): void;
    logPerformanceMetrics(): void;
    resetPerformanceMetrics(): void;
    /**
     * Memory optimization
     */
    optimizeMemory(): void;
    initializeAnalytics(): void;
}
import { Logger } from '../core/logger/index.js';
import { PostHogAnalyticsService } from './analytics/posthog-service.js';
import { LRUCache } from 'lru-cache';
//# sourceMappingURL=ai-analytics-engine.d.ts.map