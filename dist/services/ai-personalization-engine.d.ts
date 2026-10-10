export const aiPersonalizationEngine: AIPersonalizationEngine;
/**
 * AI Personalization Engine - Advanced player personalization using ML and AI
 * Creates unique experiences for every player using behavioral analysis and predictive modeling
 *
 * OPTIMIZATIONS:
 * - Redis caching for player profiles and predictions
 * - Real-time personalization updates
 * - Machine learning model optimization
 * - Performance monitoring and analytics
 * - Intelligent recommendation algorithms
 * - Memory optimization and garbage collection
 */
export class AIPersonalizationEngine {
    logger: Logger;
    openai: (() => never) | import("openai").default;
    hf: (() => never) | {
        textGeneration({ model, inputs, parameters }?: {
            parameters?: {} | undefined;
        }): Promise<{
            generated_text: any;
        }>;
    };
    analytics: PostHogAnalyticsService;
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
    profileCache: LRUCache<{}, {}, unknown>;
    predictionCache: LRUCache<{}, {}, unknown>;
    realTimeUpdates: Map<any, any>;
    updateQueue: any[];
    isProcessingUpdates: boolean;
    performanceMetrics: {
        totalPersonalizations: number;
        cacheHits: number;
        cacheMisses: number;
        averagePersonalizationTime: number;
        predictionAccuracy: number;
        lastReset: number;
    };
    mlModels: Map<any, any>;
    modelTrainingQueue: any[];
    isTrainingModels: boolean;
    playerProfiles: Map<any, any>;
    behaviorModels: Map<any, any>;
    personalizationRules: Map<any, any>;
    predictionModels: Map<any, any>;
    /**
     * Create comprehensive player profile using AI
     */
    createPlayerProfile(playerId: any, initialData: any): Promise<{
        id: any;
        basicInfo: {};
        preferences: {};
        engagementPatterns: {};
        monetizationProfile: {};
        personalizationScore: number;
        lastUpdated: string;
        aiGenerated: boolean;
    }>;
    /**
     * Analyze player behavior using AI
     */
    analyzePlayerBehavior(playerId: any, data: any): Promise<{}>;
    /**
     * Predict player preferences using AI
     */
    predictPlayerPreferences(behaviorProfile: any): Promise<{}>;
    /**
     * Analyze engagement patterns
     */
    analyzeEngagementPatterns(behaviorProfile: any): Promise<{}>;
    /**
     * Predict monetization behavior
     */
    predictMonetizationBehavior(behaviorProfile: any): Promise<{}>;
    /**
     * Generate personalized content recommendations
     */
    generatePersonalizedRecommendations(playerId: any, contentType: any): Promise<any>;
    /**
     * Optimize game difficulty in real-time
     */
    optimizeDifficulty(playerId: any, currentLevel: any, performance: any): Promise<{
        levelId: any;
        playerId: any;
        originalDifficulty: any;
        adjustedDifficulty: any;
        adjustmentReason: string;
        confidence: number;
        timestamp: string;
    } | null>;
    /**
     * Predict player churn risk
     */
    predictChurnRisk(playerId: any): Promise<{
        playerId: any;
        churnProbability: number;
        riskLevel: string;
        factors: {};
        preventionActions: any[];
        predictedChurnDate: Date;
        timestamp: string;
    } | null>;
    /**
     * Generate personalized offers
     */
    generatePersonalizedOffers(playerId: any, offerType: any): Promise<any>;
    /**
     * Build behavior analysis prompt
     */
    buildBehaviorAnalysisPrompt(data: any): string;
    /**
     * Build preference prediction prompt
     */
    buildPreferencePredictionPrompt(behaviorProfile: any): string;
    /**
     * Build monetization prediction prompt
     */
    buildMonetizationPredictionPrompt(behaviorProfile: any): string;
    /**
     * Build recommendation prompt
     */
    buildRecommendationPrompt(profile: any, contentType: any): string;
    /**
     * Build offer generation prompt
     */
    buildOfferGenerationPrompt(profile: any, offerType: any, marketTrends: any): string;
    getPlayerProfile(playerId: any): Promise<any>;
    loadPlayerProfile(playerId: any): Promise<any>;
    storePlayerProfile(profile: any): Promise<void>;
    calculatePersonalizationScore(profile: any): number;
    getDefaultBehaviorProfile(): {};
    getDefaultPreferences(): {};
    getDefaultEngagementPatterns(): {};
    getDefaultMonetizationProfile(): {};
    calculatePeakPlayTimes(profile: any): string[];
    calculateOptimalSessionLength(profile: any): number;
    identifyEngagementTriggers(profile: any): string[];
    identifyRetentionFactors(profile: any): string[];
    identifyChurnSignals(profile: any): string[];
    identifyReEngagementOpportunities(profile: any): string[];
    calculateDifficultyAdjustment(profile: any, level: any, performance: any): number;
    getDifficultyAdjustmentReason(profile: any, performance: any): string;
    calculateAdjustmentConfidence(profile: any, performance: any): number;
    analyzeChurnFactors(profile: any, activity: any): {};
    calculateChurnProbability(factors: any): number;
    generateChurnPreventionActions(factors: any): never[];
    getRiskLevel(probability: any): string;
    predictChurnDate(probability: any, activity: any): Date;
    getMarketTrends(): Promise<{}>;
    enhanceOffersWithPredictions(offers: any, profile: any): Promise<any>;
    getRecentActivity(playerId: any): Promise<{}>;
    storeRecommendations(playerId: any, type: any, recommendations: any): Promise<void>;
    storeDifficultyOptimization(optimization: any): Promise<void>;
    storeChurnPrediction(prediction: any): Promise<void>;
    /**
     * Advanced caching system for player profiles and predictions
     */
    getCachedProfile(playerId: any): Promise<any>;
    setCachedProfile(playerId: any, profile: any, ttlSeconds?: number): Promise<void>;
    getCachedPrediction(predictionKey: any): Promise<any>;
    setCachedPrediction(predictionKey: any, prediction: any, ttlSeconds?: number): Promise<void>;
    /**
     * Real-time personalization updates
     */
    updatePlayerProfileRealTime(playerId: any, behaviorData: any): Promise<void>;
    processRealTimeUpdates(): Promise<void>;
    processSingleUpdate(update: any): Promise<void>;
    startRealTimeProcessor(): void;
    /**
     * Machine learning model optimization
     */
    /**
     * Fold a behavior event into a player profile, in place.
     *
     * `processSingleUpdate()` called this but it was never implemented, so
     * every queued real-time update threw "this.updateProfileFromBehavior is not
     * a function" and no profile was ever refreshed from live behavior.
     *
     * Mutates `profile` (the caller caches that same object afterwards) and is
     * deliberately defensive: profiles come from Supabase and behavior payloads
     * are free-form, so unknown keys are stored as last-seen values rather than
     * assumed to exist.
     */
    updateProfileFromBehavior(profile: any, behaviorData?: {}): any;
    queueModelUpdate(playerId: any, behaviorData: any): void;
    startModelTraining(): Promise<void>;
    trainPersonalizationModels(trainingData: any): Promise<void>;
    /**
     * Seed the default (untrained) personalization models.
     *
     * Every `trainXModel()` reads with `this.mlModels.get(id) || { weights: {},
     * accuracy: 0 }`, so registering the known ids up front means the engine
     * reports a stable model set before any training data has been seen.
     */
    initializePersonalizationModels(): void;
    trainContentRecommendationModel(trainingData: any): Promise<void>;
    trainDifficultyAdjustmentModel(trainingData: any): Promise<void>;
    trainChurnPredictionModel(trainingData: any): Promise<void>;
    trainOfferRecommendationModel(trainingData: any): Promise<void>;
    extractFeatures(trainingData: any, modelType: any): any;
    extractLabels(trainingData: any, modelType: any): any;
    updateModelWeights(weights: any, features: any, labels: any): any;
    predictWithWeights(weights: any, features: any): number;
    calculateModelAccuracy(features: any, labels: any, weights: any): number;
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
    storePersonalizedOffers(playerId: any, offers: any): Promise<void>;
}
import { Logger } from '../core/logger/index.js';
import { PostHogAnalyticsService } from './analytics/posthog-service.js';
import { LRUCache } from 'lru-cache';
//# sourceMappingURL=ai-personalization-engine.d.ts.map