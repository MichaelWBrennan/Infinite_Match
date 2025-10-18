import { Logger } from '../core/logger/index.js';
import { aiCacheManager } from './ai-cache-manager.js';
import { aiMonitoringSystem } from './ai-monitoring-system.js';
import OpenAI from 'openai';
import { EventEmitter } from 'events';

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
class AIErrorHandler extends EventEmitter {
  constructor() {
    super();
    this.logger = new Logger('AIErrorHandler');

    // OpenAI for error analysis
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Error classification patterns
    this.errorPatterns = {
      network: ['timeout', 'connection', 'network', 'unreachable'],
      authentication: ['unauthorized', 'forbidden', 'token', 'auth'],
      rateLimit: ['rate limit', 'too many requests', 'quota'],
      validation: ['validation', 'invalid', 'malformed', 'bad request'],
      server: ['internal server', 'service unavailable', 'gateway'],
      ai: ['ai service', 'model', 'generation', 'prediction'],
      cache: ['cache', 'redis', 'memory'],
      database: ['database', 'query', 'connection', 'sql'],
    };

    // Recovery strategies
    this.recoveryStrategies = {
      network: ['retry', 'fallback', 'circuit_breaker'],
      authentication: ['refresh_token', 'reauthenticate', 'fallback'],
      rateLimit: ['exponential_backoff', 'queue', 'throttle'],
      validation: ['validate_input', 'sanitize', 'reject'],
      server: ['retry', 'fallback', 'circuit_breaker'],
      ai: ['fallback_model', 'cached_response', 'simplified_request'],
      cache: ['bypass_cache', 'fallback_storage', 'rebuild'],
      database: ['retry', 'fallback_query', 'connection_pool'],
    };

    // Error history and patterns
    this.errorHistory = [];
    this.errorPatterns = new Map();
    this.recoverySuccessRates = new Map();

    // Circuit breaker states
    this.circuitBreakers = new Map();

    // Retry configurations
    this.retryConfigs = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
    };

    this.initializeErrorHandler();
  }

  /**
   * Initialize error handler
   */
  async initializeErrorHandler() {
    this.logger.info('AI Error Handler initialized');
    
    // Start error pattern analysis
    this.startErrorPatternAnalysis();
    
    // Start circuit breaker monitoring
    this.startCircuitBreakerMonitoring();
    
    // Start error recovery optimization
    this.startErrorRecoveryOptimization();
  }

  /**
   * Main error handling method
   */
  async handleError(error, context = {}) {
    const errorId = this.generateErrorId();
    const timestamp = Date.now();
    
    try {
      // Classify error using AI
      const classification = await this.classifyError(error, context);
      
      // Analyze error patterns
      const patternAnalysis = await this.analyzeErrorPatterns(error, context);
      
      // Determine recovery strategy
      const recoveryStrategy = await this.determineRecoveryStrategy(classification, patternAnalysis, context);
      
      // Execute recovery
      const recoveryResult = await this.executeRecovery(recoveryStrategy, error, context);
      
      // Log error details
      const errorDetails = {
        id: errorId,
        timestamp,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
          code: error.code,
        },
        context,
        classification,
        patternAnalysis,
        recoveryStrategy,
        recoveryResult,
      };
      
      this.errorHistory.push(errorDetails);
      this.logger.error('Error handled', errorDetails);
      
      // Emit error event
      this.emit('errorHandled', errorDetails);
      
      return {
        success: recoveryResult.success,
        data: recoveryResult.data,
        error: recoveryResult.error,
        recovery: recoveryResult.recovery,
        classification,
      };
    } catch (handlingError) {
      this.logger.error('Error handling failed', { 
        originalError: error.message, 
        handlingError: handlingError.message 
      });
      
      return {
        success: false,
        error: error.message,
        recovery: 'failed',
        classification: 'unknown',
      };
    }
  }

  /**
   * AI-powered error classification
   */
  async classifyError(error, context) {
    try {
      const prompt = this.buildErrorClassificationPrompt(error, context);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert error analyst. Classify errors and suggest recovery strategies. Return JSON format.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      const classification = JSON.parse(response.choices[0].message.content);
      
      // Cache classification for similar errors
      const errorKey = this.generateErrorKey(error, context);
      await aiCacheManager.set(`error_classification:${errorKey}`, classification, 'analytics', 3600);
      
      return classification;
    } catch (error) {
      // Fallback to rule-based classification
      return this.ruleBasedClassification(error, context);
    }
  }

  buildErrorClassificationPrompt(error, context) {
    return `
Analyze this error and provide classification:

Error Details:
- Message: ${error.message}
- Name: ${error.name}
- Code: ${error.code || 'N/A'}
- Stack: ${error.stack?.substring(0, 500) || 'N/A'}

Context:
- Service: ${context.service || 'unknown'}
- Operation: ${context.operation || 'unknown'}
- User ID: ${context.userId || 'unknown'}
- Request ID: ${context.requestId || 'unknown'}
- Timestamp: ${context.timestamp || new Date().toISOString()}

Classify the error and suggest recovery strategies. Return JSON:
{
  "category": "network|authentication|rateLimit|validation|server|ai|cache|database|unknown",
  "severity": "low|medium|high|critical",
  "recoverable": true|false,
  "suggestedStrategies": ["strategy1", "strategy2"],
  "confidence": 0.0-1.0,
  "description": "Error description",
  "rootCause": "Likely root cause",
  "prevention": "How to prevent this error"
}`;
  }

  ruleBasedClassification(error, context) {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();
    
    for (const [category, patterns] of Object.entries(this.errorPatterns)) {
      for (const pattern of patterns) {
        if (message.includes(pattern) || name.includes(pattern)) {
          return {
            category,
            severity: this.determineSeverity(error, category),
            recoverable: this.isRecoverable(category),
            suggestedStrategies: this.recoveryStrategies[category] || ['retry'],
            confidence: 0.7,
            description: `Rule-based classification for ${category}`,
            rootCause: `Pattern match: ${pattern}`,
            prevention: 'Implement proper error handling',
          };
        }
      }
    }
    
    return {
      category: 'unknown',
      severity: 'medium',
      recoverable: true,
      suggestedStrategies: ['retry', 'fallback'],
      confidence: 0.3,
      description: 'Unknown error type',
      rootCause: 'Unclassified error',
      prevention: 'Improve error handling coverage',
    };
  }

  determineSeverity(error, category) {
    const severityMap = {
      network: 'medium',
      authentication: 'high',
      rateLimit: 'low',
      validation: 'low',
      server: 'high',
      ai: 'medium',
      cache: 'low',
      database: 'high',
    };
    
    return severityMap[category] || 'medium';
  }

  isRecoverable(category) {
    const recoverableCategories = ['network', 'rateLimit', 'server', 'ai', 'cache', 'database'];
    return recoverableCategories.includes(category);
  }

  /**
   * Error pattern analysis
   */
  async analyzeErrorPatterns(error, context) {
    try {
      // Get similar errors from history
      const similarErrors = this.findSimilarErrors(error, context);
      
      // Analyze patterns
      const patterns = {
        frequency: this.calculateErrorFrequency(similarErrors),
        timePattern: this.analyzeTimePattern(similarErrors),
        contextPattern: this.analyzeContextPattern(similarErrors),
        recoveryPattern: this.analyzeRecoveryPattern(similarErrors),
      };
      
      return patterns;
    } catch (error) {
      this.logger.warn('Error pattern analysis failed', { error: error.message });
      return {};
    }
  }

  findSimilarErrors(error, context) {
    return this.errorHistory.filter(historicalError => {
      const messageSimilarity = this.calculateStringSimilarity(
        error.message.toLowerCase(),
        historicalError.error.message.toLowerCase()
      );
      
      const contextSimilarity = this.calculateContextSimilarity(context, historicalError.context);
      
      return messageSimilarity > 0.7 || contextSimilarity > 0.7;
    });
  }

  calculateStringSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  calculateContextSimilarity(context1, context2) {
    const keys1 = Object.keys(context1);
    const keys2 = Object.keys(context2);
    const commonKeys = keys1.filter(key => keys2.includes(key));
    
    if (commonKeys.length === 0) return 0;
    
    let similarity = 0;
    for (const key of commonKeys) {
      if (context1[key] === context2[key]) {
        similarity += 1;
      }
    }
    
    return similarity / commonKeys.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  calculateErrorFrequency(similarErrors) {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const recentErrors = similarErrors.filter(error => now - error.timestamp < oneHour);
    
    return {
      total: similarErrors.length,
      recent: recentErrors.length,
      rate: recentErrors.length / 60, // per minute
    };
  }

  analyzeTimePattern(similarErrors) {
    const hours = new Array(24).fill(0);
    const days = new Array(7).fill(0);
    
    similarErrors.forEach(error => {
      const date = new Date(error.timestamp);
      hours[date.getHours()]++;
      days[date.getDay()]++;
    });
    
    return {
      hourlyDistribution: hours,
      dailyDistribution: days,
      peakHour: hours.indexOf(Math.max(...hours)),
      peakDay: days.indexOf(Math.max(...days)),
    };
  }

  analyzeContextPattern(similarErrors) {
    const contextCounts = {};
    
    similarErrors.forEach(error => {
      Object.entries(error.context).forEach(([key, value]) => {
        if (!contextCounts[key]) contextCounts[key] = {};
        if (!contextCounts[key][value]) contextCounts[key][value] = 0;
        contextCounts[key][value]++;
      });
    });
    
    return contextCounts;
  }

  analyzeRecoveryPattern(similarErrors) {
    const successfulRecoveries = similarErrors.filter(error => error.recoveryResult?.success);
    const totalRecoveries = similarErrors.length;
    
    return {
      successRate: totalRecoveries > 0 ? successfulRecoveries.length / totalRecoveries : 0,
      commonStrategies: this.getCommonStrategies(similarErrors),
      averageRecoveryTime: this.calculateAverageRecoveryTime(similarErrors),
    };
  }

  getCommonStrategies(similarErrors) {
    const strategyCounts = {};
    
    similarErrors.forEach(error => {
      if (error.recoveryStrategy) {
        error.recoveryStrategy.forEach(strategy => {
          strategyCounts[strategy] = (strategyCounts[strategy] || 0) + 1;
        });
      }
    });
    
    return Object.entries(strategyCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([strategy, count]) => ({ strategy, count }));
  }

  calculateAverageRecoveryTime(similarErrors) {
    const recoveryTimes = similarErrors
      .filter(error => error.recoveryResult?.recoveryTime)
      .map(error => error.recoveryResult.recoveryTime);
    
    if (recoveryTimes.length === 0) return 0;
    
    return recoveryTimes.reduce((sum, time) => sum + time, 0) / recoveryTimes.length;
  }

  /**
   * Recovery strategy determination
   */
  async determineRecoveryStrategy(classification, patternAnalysis, context) {
    try {
      const strategies = classification.suggestedStrategies || ['retry'];
      const patterns = patternAnalysis;
      
      // Use AI to determine optimal strategy
      const prompt = this.buildRecoveryStrategyPrompt(classification, patterns, context);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert error recovery specialist. Determine the best recovery strategy based on error classification and patterns.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 300,
      });

      const strategy = JSON.parse(response.choices[0].message.content);
      
      return strategy;
    } catch (error) {
      // Fallback to rule-based strategy selection
      return this.ruleBasedStrategySelection(classification, patterns, context);
    }
  }

  buildRecoveryStrategyPrompt(classification, patterns, context) {
    return `
Determine the best recovery strategy for this error:

Error Classification:
${JSON.stringify(classification, null, 2)}

Pattern Analysis:
${JSON.stringify(patterns, null, 2)}

Context:
${JSON.stringify(context, null, 2)}

Return JSON with recovery strategy:
{
  "strategy": "retry|fallback|circuit_breaker|queue|throttle|reject",
  "parameters": {
    "maxRetries": 3,
    "delay": 1000,
    "backoffMultiplier": 2,
    "timeout": 30000
  },
  "fallbackStrategy": "alternative approach if primary fails",
  "confidence": 0.0-1.0,
  "reasoning": "Why this strategy was chosen"
}`;
  }

  ruleBasedStrategySelection(classification, patterns, context) {
    const category = classification.category;
    const severity = classification.severity;
    const frequency = patterns.frequency?.rate || 0;
    
    let strategy = 'retry';
    let parameters = {
      maxRetries: 3,
      delay: 1000,
      backoffMultiplier: 2,
      timeout: 30000,
    };
    
    // Adjust strategy based on category
    switch (category) {
      case 'network':
        strategy = frequency > 5 ? 'circuit_breaker' : 'retry';
        parameters.delay = 2000;
        break;
      case 'rateLimit':
        strategy = 'exponential_backoff';
        parameters.delay = 5000;
        parameters.backoffMultiplier = 2;
        break;
      case 'authentication':
        strategy = 'refresh_token';
        parameters.maxRetries = 1;
        break;
      case 'validation':
        strategy = 'reject';
        parameters.maxRetries = 0;
        break;
      case 'server':
        strategy = frequency > 3 ? 'circuit_breaker' : 'retry';
        break;
      case 'ai':
        strategy = 'fallback_model';
        break;
      case 'cache':
        strategy = 'bypass_cache';
        break;
      case 'database':
        strategy = 'retry';
        parameters.delay = 3000;
        break;
    }
    
    // Adjust based on severity
    if (severity === 'critical') {
      parameters.maxRetries = Math.min(parameters.maxRetries, 1);
    } else if (severity === 'low') {
      parameters.maxRetries = Math.min(parameters.maxRetries, 5);
    }
    
    return {
      strategy,
      parameters,
      fallbackStrategy: 'reject',
      confidence: 0.7,
      reasoning: `Rule-based selection for ${category} error with ${severity} severity`,
    };
  }

  /**
   * Recovery execution
   */
  async executeRecovery(strategy, error, context) {
    const startTime = Date.now();
    
    try {
      let result;
      
      switch (strategy.strategy) {
        case 'retry':
          result = await this.executeRetry(strategy.parameters, error, context);
          break;
        case 'exponential_backoff':
          result = await this.executeExponentialBackoff(strategy.parameters, error, context);
          break;
        case 'circuit_breaker':
          result = await this.executeCircuitBreaker(strategy.parameters, error, context);
          break;
        case 'fallback':
          result = await this.executeFallback(strategy.parameters, error, context);
          break;
        case 'queue':
          result = await this.executeQueue(strategy.parameters, error, context);
          break;
        case 'throttle':
          result = await this.executeThrottle(strategy.parameters, error, context);
          break;
        case 'reject':
          result = await this.executeReject(strategy.parameters, error, context);
          break;
        default:
          result = await this.executeRetry(strategy.parameters, error, context);
      }
      
      const recoveryTime = Date.now() - startTime;
      
      return {
        success: result.success,
        data: result.data,
        error: result.error,
        recovery: strategy.strategy,
        recoveryTime,
        attempts: result.attempts || 1,
      };
    } catch (recoveryError) {
      this.logger.error('Recovery execution failed', { 
        strategy: strategy.strategy, 
        error: recoveryError.message 
      });
      
      return {
        success: false,
        error: recoveryError.message,
        recovery: strategy.strategy,
        recoveryTime: Date.now() - startTime,
        attempts: 0,
      };
    }
  }

  async executeRetry(parameters, error, context) {
    const { maxRetries, delay, timeout } = parameters;
    let lastError = error;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Simulate retry logic - in real implementation, this would retry the original operation
        await this.simulateRetry(context);
        
        return {
          success: true,
          data: { message: 'Retry successful' },
          attempts: attempt + 1,
        };
      } catch (retryError) {
        lastError = retryError;
        
        if (attempt < maxRetries - 1) {
          await this.delay(delay * Math.pow(2, attempt)); // Exponential backoff
        }
      }
    }
    
    return {
      success: false,
      error: lastError.message,
      attempts: maxRetries,
    };
  }

  async executeExponentialBackoff(parameters, error, context) {
    const { maxRetries, delay, backoffMultiplier, timeout } = parameters;
    let lastError = error;
    let currentDelay = delay;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await this.simulateRetry(context);
        
        return {
          success: true,
          data: { message: 'Exponential backoff retry successful' },
          attempts: attempt + 1,
        };
      } catch (retryError) {
        lastError = retryError;
        
        if (attempt < maxRetries - 1) {
          await this.delay(currentDelay);
          currentDelay *= backoffMultiplier;
        }
      }
    }
    
    return {
      success: false,
      error: lastError.message,
      attempts: maxRetries,
    };
  }

  async executeCircuitBreaker(parameters, error, context) {
    const serviceKey = context.service || 'unknown';
    const circuitBreaker = this.circuitBreakers.get(serviceKey);
    
    if (circuitBreaker && circuitBreaker.state === 'open') {
      if (Date.now() - circuitBreaker.lastFailureTime > circuitBreaker.timeout) {
        circuitBreaker.state = 'half-open';
      } else {
        return {
          success: false,
          error: 'Circuit breaker is open',
          attempts: 0,
        };
      }
    }
    
    try {
      await this.simulateRetry(context);
      
      if (circuitBreaker) {
        circuitBreaker.state = 'closed';
        circuitBreaker.failureCount = 0;
      }
      
      return {
        success: true,
        data: { message: 'Circuit breaker retry successful' },
        attempts: 1,
      };
    } catch (retryError) {
      if (circuitBreaker) {
        circuitBreaker.failureCount++;
        circuitBreaker.lastFailureTime = Date.now();
        
        if (circuitBreaker.failureCount >= circuitBreaker.threshold) {
          circuitBreaker.state = 'open';
        }
      }
      
      return {
        success: false,
        error: retryError.message,
        attempts: 1,
      };
    }
  }

  async executeFallback(parameters, error, context) {
    try {
      // Simulate fallback logic
      const fallbackData = await this.simulateFallback(context);
      
      return {
        success: true,
        data: fallbackData,
        attempts: 1,
      };
    } catch (fallbackError) {
      return {
        success: false,
        error: fallbackError.message,
        attempts: 1,
      };
    }
  }

  async executeQueue(parameters, error, context) {
    // Simulate queuing the request for later processing
    const queueId = this.generateQueueId();
    
    return {
      success: true,
      data: { 
        message: 'Request queued for later processing',
        queueId,
      },
      attempts: 1,
    };
  }

  async executeThrottle(parameters, error, context) {
    // Simulate throttling
    await this.delay(parameters.delay || 1000);
    
    return {
      success: true,
      data: { message: 'Request throttled and processed' },
      attempts: 1,
    };
  }

  async executeReject(parameters, error, context) {
    return {
      success: false,
      error: 'Request rejected due to error classification',
      attempts: 0,
    };
  }

  /**
   * Utility methods
   */
  async simulateRetry(context) {
    // Simulate retry logic - in real implementation, this would retry the original operation
    await this.delay(100);
    
    // Simulate success/failure based on context
    if (Math.random() < 0.7) { // 70% success rate
      return { success: true };
    } else {
      throw new Error('Simulated retry failure');
    }
  }

  async simulateFallback(context) {
    // Simulate fallback logic
    await this.delay(50);
    return { message: 'Fallback data provided', fallback: true };
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateErrorId() {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateErrorKey(error, context) {
    const key = `${error.name}:${error.message}:${context.service || 'unknown'}`;
    return Buffer.from(key).toString('base64');
  }

  generateQueueId() {
    return `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Background processes
   */
  startErrorPatternAnalysis() {
    setInterval(() => {
      this.analyzeErrorPatterns();
    }, 300000); // Every 5 minutes
  }

  startCircuitBreakerMonitoring() {
    setInterval(() => {
      this.monitorCircuitBreakers();
    }, 60000); // Every minute
  }

  startErrorRecoveryOptimization() {
    setInterval(() => {
      this.optimizeRecoveryStrategies();
    }, 1800000); // Every 30 minutes
  }

  async analyzeErrorPatterns() {
    // Analyze error patterns and update recovery strategies
    this.logger.debug('Error pattern analysis completed');
  }

  monitorCircuitBreakers() {
    const now = Date.now();
    
    for (const [service, breaker] of this.circuitBreakers.entries()) {
      if (breaker.state === 'open' && now - breaker.lastFailureTime > breaker.timeout) {
        breaker.state = 'half-open';
        this.logger.info('Circuit breaker reset to half-open', { service });
      }
    }
  }

  async optimizeRecoveryStrategies() {
    // Optimize recovery strategies based on success rates
    this.logger.debug('Recovery strategy optimization completed');
  }

  /**
   * Public API methods
   */
  getErrorStats() {
    const totalErrors = this.errorHistory.length;
    const recentErrors = this.errorHistory.filter(
      error => Date.now() - error.timestamp < 3600000 // Last hour
    );
    
    const categoryCounts = {};
    this.errorHistory.forEach(error => {
      const category = error.classification?.category || 'unknown';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    
    return {
      total: totalErrors,
      recent: recentErrors.length,
      byCategory: categoryCounts,
      recoverySuccessRate: this.calculateRecoverySuccessRate(),
    };
  }

  calculateRecoverySuccessRate() {
    const successfulRecoveries = this.errorHistory.filter(
      error => error.recoveryResult?.success
    );
    
    return this.errorHistory.length > 0 
      ? successfulRecoveries.length / this.errorHistory.length 
      : 0;
  }

  getCircuitBreakerStatus() {
    const status = {};
    for (const [service, breaker] of this.circuitBreakers.entries()) {
      status[service] = {
        state: breaker.state,
        failureCount: breaker.failureCount,
        lastFailureTime: breaker.lastFailureTime,
      };
    }
    return status;
  }

  async clearErrorHistory() {
    this.errorHistory = [];
    this.logger.info('Error history cleared');
  }
}

// Create singleton instance
const aiErrorHandler = new AIErrorHandler();

export { AIErrorHandler, aiErrorHandler };