/**
 * AI Query Optimizer - Intelligent database query optimization system
 *
 * Features:
 * - AI-powered query analysis and optimization
 * - Automatic index recommendations
 * - Query performance prediction
 * - Real-time query optimization
 * - Query pattern recognition
 * - Performance monitoring and alerting
 */
export class AIQueryOptimizer extends EventEmitter<[never]> {
    constructor();
    logger: Logger;
    openai: any;
    queryMetrics: Map<any, any>;
    queryHistory: any[];
    optimizationHistory: any[];
    schemaInfo: Map<any, any>;
    indexInfo: Map<any, any>;
    queryPatterns: Map<any, any>;
    optimizationRules: Map<any, any>;
    performanceBaselines: {
        averageQueryTime: number;
        slowQueryThreshold: number;
        indexUsageThreshold: number;
        cacheHitThreshold: number;
    };
    optimizationStrategies: {
        index: string[];
        query: string[];
        cache: string[];
        schema: string[];
    };
    /**
     * Initialize query optimizer
     */
    initializeQueryOptimizer(): Promise<void>;
    /**
     * Main query optimization method
     */
    optimizeQuery(query: any, context?: {}): Promise<{
        query: any;
        performance: any;
        appliedOptimizations: {
            type: string;
            description: any;
        }[];
        indexStatements: string[];
        optimization: any;
    } | {
        success: boolean;
        originalQuery: any;
        optimizedQuery: any;
        optimization: {
            type: any;
            priority: any;
            description: any;
            implementation: any;
            expectedImprovement: any;
            risk: any;
            effort: any;
            indexes: any;
            queryRewrites: any;
            hints: any;
        };
        performance: any;
        recommendations: any;
        queryId: string;
        optimizationTime: number;
        error?: never;
    } | {
        success: boolean;
        originalQuery: any;
        optimizedQuery: any;
        error: any;
        queryId: string;
        optimizationTime: number;
        optimization?: never;
        performance?: never;
        recommendations?: never;
    }>;
    /**
     * AI-powered query analysis
     */
    analyzeQuery(query: any, context: any): Promise<any>;
    buildQueryAnalysisPrompt(query: any, context: any): string;
    ruleBasedQueryAnalysis(query: any, context: any): {
        complexity: string;
        performanceIssues: {
            type: string;
            description: string;
            severity: string;
            impact: string;
        }[];
        optimizationOpportunities: {
            type: string;
            description: string;
            priority: string;
            expectedImprovement: string;
        }[];
        estimatedCost: number;
        recommendedIndexes: any[];
        queryHints: never[];
    };
    calculateQueryComplexity(query: any): "high" | "medium" | "low";
    estimateQueryCost(query: any): number;
    /**
     * Generate optimization recommendations
     */
    generateOptimizationRecommendations(analysis: any, context: any): Promise<any>;
    buildOptimizationPrompt(analysis: any, context: any): string;
    ruleBasedOptimizationRecommendations(analysis: any, context: any): {
        optimizations: any[];
        indexes: any[];
        queryRewrites: any[];
        hints: any[];
    };
    /**
     * Select optimization strategy
     */
    selectOptimizationStrategy(recommendations: any, analysis: any, context: any): Promise<{
        type: any;
        priority: any;
        description: any;
        implementation: any;
        expectedImprovement: any;
        risk: any;
        effort: any;
        indexes: any;
        queryRewrites: any;
        hints: any;
    }>;
    /**
     * Apply optimization
     */
    applyOptimization(optimization: any, query: any, context: any): Promise<{
        query: any;
        performance: any;
        appliedOptimizations: {
            type: string;
            description: any;
        }[];
        indexStatements: string[];
        optimization: any;
    }>;
    addQueryHint(query: any, hint: any): string;
    getHintSyntax(hint: any): any;
    generateIndexStatement(index: any): string;
    predictQueryPerformance(query: any, context: any): Promise<any>;
    buildPerformancePredictionPrompt(query: any, context: any): string;
    ruleBasedPerformancePrediction(query: any, context: any): {
        estimatedExecutionTime: number;
        estimatedRows: number;
        estimatedCost: number;
        performanceRating: string;
        bottlenecks: string[];
        recommendations: string[];
    };
    /**
     * Background processes
     */
    startQueryAnalysis(): void;
    startPerformanceMonitoring(): void;
    startOptimizationLearning(): void;
    startIndexRecommendations(): void;
    analyzeQueryPatterns(): Promise<void>;
    monitorQueryPerformance(): Promise<void>;
    learnFromOptimizations(): Promise<void>;
    generateIndexRecommendations(): Promise<void>;
    /**
     * Utility methods
     */
    generateQueryId(): string;
    generateQueryKey(query: any): string;
    getExistingOptimization(query: any): Promise<any>;
    trackQueryOptimization(queryId: any, originalQuery: any, optimizedQuery: any, optimization: any, optimizationTime: any): void;
    /**
     * Public API methods
     */
    getOptimizationStats(): {
        total: number;
        recent: number;
        byType: {};
        averageOptimizationTime: number;
    };
    calculateAverageOptimizationTime(): number;
    getQueryMetrics(): {
        query: any;
        metrics: any;
    }[];
    clearOptimizationHistory(): Promise<void>;
}
export const aiQueryOptimizer: AIQueryOptimizer;
import { EventEmitter } from 'events';
import { Logger } from '../core/logger/index.js';
//# sourceMappingURL=ai-query-optimizer.d.ts.map