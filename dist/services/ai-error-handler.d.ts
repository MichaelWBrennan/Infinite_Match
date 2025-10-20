/**
 * AI Error Handler - Intelligent error handling and recovery system
 *
 * Features:
 * - AI-powered error analysis and classification
 * - Automatic error recovery strategies
 * - Intelligent retry mechanisms
 * - Error pattern recognition
 * - Predictive error prevention
 * - Context-aware error responses
 */
export class AIErrorHandler extends EventEmitter<[never]> {
    constructor();
    logger: Logger;
    openai: any;
    errorPatterns: Map<any, any>;
    recoveryStrategies: {
        network: string[];
        authentication: string[];
        rateLimit: string[];
        validation: string[];
        server: string[];
        ai: string[];
        cache: string[];
        database: string[];
    };
    errorHistory: any[];
    recoverySuccessRates: Map<any, any>;
    circuitBreakers: Map<any, any>;
    retryConfigs: {
        maxRetries: number;
        baseDelay: number;
        maxDelay: number;
        backoffMultiplier: number;
    };
    /**
     * Initialize error handler
     */
    initializeErrorHandler(): Promise<void>;
    /**
     * Main error handling method
     */
    handleError(error: any, context?: {}): Promise<{
        success: boolean;
        data: any;
        error: any;
        recovery: any;
        classification: any;
    } | {
        success: boolean;
        error: any;
        recovery: string;
        classification: string;
        data?: never;
    }>;
    /**
     * AI-powered error classification
     */
    classifyError(error: any, context: any): Promise<any>;
    buildErrorClassificationPrompt(error: any, context: any): string;
    ruleBasedClassification(error: any, context: any): {
        category: string;
        severity: any;
        recoverable: boolean;
        suggestedStrategies: any;
        confidence: number;
        description: string;
        rootCause: string;
        prevention: string;
    };
    determineSeverity(error: any, category: any): any;
    isRecoverable(category: any): boolean;
    /**
     * Error pattern analysis
     */
    analyzeErrorPatterns(error: any, context: any): Promise<{}>;
    analyzeErrorPatterns(): Promise<void>;
    findSimilarErrors(error: any, context: any): any[];
    calculateStringSimilarity(str1: any, str2: any): number;
    calculateContextSimilarity(context1: any, context2: any): number;
    levenshteinDistance(str1: any, str2: any): number | undefined;
    calculateErrorFrequency(similarErrors: any): {
        total: any;
        recent: any;
        rate: number;
    };
    analyzeTimePattern(similarErrors: any): {
        hourlyDistribution: any[];
        dailyDistribution: any[];
        peakHour: number;
        peakDay: number;
    };
    analyzeContextPattern(similarErrors: any): {};
    analyzeRecoveryPattern(similarErrors: any): {
        successRate: number;
        commonStrategies: {
            strategy: string;
            count: any;
        }[];
        averageRecoveryTime: number;
    };
    getCommonStrategies(similarErrors: any): {
        strategy: string;
        count: any;
    }[];
    calculateAverageRecoveryTime(similarErrors: any): number;
    /**
     * Recovery strategy determination
     */
    determineRecoveryStrategy(classification: any, patternAnalysis: any, context: any): Promise<any>;
    buildRecoveryStrategyPrompt(classification: any, patterns: any, context: any): string;
    ruleBasedStrategySelection(classification: any, patterns: any, context: any): {
        strategy: string;
        parameters: {
            maxRetries: number;
            delay: number;
            backoffMultiplier: number;
            timeout: number;
        };
        fallbackStrategy: string;
        confidence: number;
        reasoning: string;
    };
    /**
     * Recovery execution
     */
    executeRecovery(strategy: any, error: any, context: any): Promise<{
        success: boolean;
        data: any;
        error: any;
        recovery: any;
        recoveryTime: number;
        attempts: any;
    } | {
        success: boolean;
        error: any;
        recovery: any;
        recoveryTime: number;
        attempts: number;
        data?: never;
    }>;
    executeRetry(parameters: any, error: any, context: any): Promise<{
        success: boolean;
        data: {
            message: string;
        };
        attempts: number;
        error?: never;
    } | {
        success: boolean;
        error: any;
        attempts: any;
        data?: never;
    }>;
    executeExponentialBackoff(parameters: any, error: any, context: any): Promise<{
        success: boolean;
        data: {
            message: string;
        };
        attempts: number;
        error?: never;
    } | {
        success: boolean;
        error: any;
        attempts: any;
        data?: never;
    }>;
    executeCircuitBreaker(parameters: any, error: any, context: any): Promise<{
        success: boolean;
        data: {
            message: string;
        };
        attempts: number;
        error?: never;
    } | {
        success: boolean;
        error: any;
        attempts: number;
        data?: never;
    }>;
    executeFallback(parameters: any, error: any, context: any): Promise<{
        success: boolean;
        data: {
            message: string;
            fallback: boolean;
        };
        attempts: number;
        error?: never;
    } | {
        success: boolean;
        error: any;
        attempts: number;
        data?: never;
    }>;
    executeQueue(parameters: any, error: any, context: any): Promise<{
        success: boolean;
        data: {
            message: string;
            queueId: string;
        };
        attempts: number;
    }>;
    executeThrottle(parameters: any, error: any, context: any): Promise<{
        success: boolean;
        data: {
            message: string;
        };
        attempts: number;
    }>;
    executeReject(parameters: any, error: any, context: any): Promise<{
        success: boolean;
        error: string;
        attempts: number;
    }>;
    /**
     * Utility methods
     */
    simulateRetry(context: any): Promise<{
        success: boolean;
    }>;
    simulateFallback(context: any): Promise<{
        message: string;
        fallback: boolean;
    }>;
    delay(ms: any): Promise<any>;
    generateErrorId(): string;
    generateErrorKey(error: any, context: any): string;
    generateQueueId(): string;
    /**
     * Background processes
     */
    startErrorPatternAnalysis(): void;
    startCircuitBreakerMonitoring(): void;
    startErrorRecoveryOptimization(): void;
    monitorCircuitBreakers(): void;
    optimizeRecoveryStrategies(): Promise<void>;
    /**
     * Public API methods
     */
    getErrorStats(): {
        total: number;
        recent: number;
        byCategory: {};
        recoverySuccessRate: number;
    };
    calculateRecoverySuccessRate(): number;
    getCircuitBreakerStatus(): {};
    clearErrorHistory(): Promise<void>;
}
export const aiErrorHandler: AIErrorHandler;
import { EventEmitter } from 'events';
import { Logger } from '../core/logger/index.js';
//# sourceMappingURL=ai-error-handler.d.ts.map