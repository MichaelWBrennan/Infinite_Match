import crypto from 'crypto';

/**
 * Advanced Anti-Cheat Validation System
 * Implements server-side validation for game data integrity
 */
export class AntiCheatValidator {
  constructor() {
    this.playerProfiles = new Map();
    this.cheatDetections = new Map();
    this.validationRules = new Map();
    this.statistics = {
      totalValidations: 0,
      cheatDetections: 0,
      falsePositives: 0,
      suspiciousActivities: 0,
    };

    this.initializeValidationRules();
  }

  /**
   * Initialize validation rules for different game actions
   * @returns {void}
   */
  initializeValidationRules() {
    // Score validation rules
    this.validationRules.set('score_update', {
      maxScorePerSecond: 1000,
      maxScorePerMinute: 10000,
      maxScorePerHour: 100000,
      maxConsecutiveIncreases: 50,
      minTimeBetweenUpdates: 100, // milliseconds
    });

    // Resource validation rules
    this.validationRules.set('resource_update', {
      maxCoinsPerSecond: 100,
      maxGemsPerSecond: 10,
      maxCoinsPerMinute: 1000,
      maxGemsPerMinute: 100,
      maxCoinsPerHour: 10000,
      maxGemsPerHour: 1000,
    });

    // Level progression rules
    this.validationRules.set('level_complete', {
      minTimePerLevel: 30000, // 30 seconds
      maxLevelsPerHour: 10,
      maxLevelsPerDay: 50,
      minMovesPerLevel: 5,
      maxMovesPerLevel: 100,
    });

    // Purchase validation rules
    this.validationRules.set('purchase', {
      maxPurchasesPerHour: 10,
      maxPurchasesPerDay: 50,
      maxPurchaseAmount: 1000,
      minTimeBetweenPurchases: 5000, // 5 seconds
    });

    // Action validation rules
    this.validationRules.set('game_action', {
      maxActionsPerSecond: 10,
      maxActionsPerMinute: 300,
      minTimeBetweenActions: 100, // milliseconds
      maxConsecutiveIdenticalActions: 20,
    });
  }

  /**
   * Validate game data for cheating
   */
  validateGameData(playerId, actionType, gameData) {
    this.statistics.totalValidations++;

    // Get or create player profile
    const playerProfile = this.getOrCreatePlayerProfile(playerId);

    // Update player activity
    this.updatePlayerActivity(playerProfile, actionType, gameData);

    // Run validation checks
    const validationResults = {
      isValid: true,
      violations: [],
      suspiciousActivities: [],
      riskScore: 0,
    };

    // Check for impossible values
    const impossibleValuesCheck = this.checkImpossibleValues(
      actionType,
      gameData
    );
    if (!impossibleValuesCheck.isValid) {
      validationResults.violations.push(...impossibleValuesCheck.violations);
      validationResults.isValid = false;
    }

    // Check for speed hacking
    const speedHackCheck = this.checkSpeedHacking(
      playerProfile,
      actionType,
      gameData
    );
    if (!speedHackCheck.isValid) {
      validationResults.violations.push(...speedHackCheck.violations);
      validationResults.isValid = false;
    }

    // Check for resource manipulation
    const resourceCheck = this.checkResourceManipulation(
      playerProfile,
      actionType,
      gameData
    );
    if (!resourceCheck.isValid) {
      validationResults.violations.push(...resourceCheck.violations);
      validationResults.isValid = false;
    }

    // Check for behavioral anomalies
    const behaviorCheck = this.checkBehavioralAnomalies(
      playerProfile,
      actionType,
      gameData
    );
    if (!behaviorCheck.isValid) {
      validationResults.suspiciousActivities.push(
        ...behaviorCheck.suspiciousActivities
      );
      validationResults.riskScore += behaviorCheck.riskScore;
    }

    // Check for pattern recognition
    const patternCheck = this.checkPatternRecognition(
      playerProfile,
      actionType,
      gameData
    );
    if (!patternCheck.isValid) {
      validationResults.suspiciousActivities.push(
        ...patternCheck.suspiciousActivities
      );
      validationResults.riskScore += patternCheck.riskScore;
    }

    // Calculate overall risk score
    validationResults.riskScore = this.calculateRiskScore(
      playerProfile,
      validationResults
    );

    // Update player profile with validation results
    this.updatePlayerProfileWithValidation(playerProfile, validationResults);

    // Log validation results
    this.logValidationResults(playerId, actionType, validationResults);

    return validationResults;
  }

  /**
   * Check for impossible values in game data
   */
  checkImpossibleValues(actionType, gameData) {
    const violations = [];
    const rules = this.validationRules.get(actionType);

    if (!rules) {
      return { isValid: true, violations: [] };
    }

    // Check score values
    if (gameData.score !== undefined) {
      if (gameData.score < 0) {
        violations.push({
          type: 'negative_score',
          message: 'Negative score detected',
          severity: 'high',
          value: gameData.score,
        });
      }
      if (gameData.score > 10000000) {
        violations.push({
          type: 'impossible_score',
          message: 'Impossibly high score detected',
          severity: 'critical',
          value: gameData.score,
        });
      }
    }

    // Check resource values
    if (gameData.coins !== undefined) {
      if (gameData.coins < 0) {
        violations.push({
          type: 'negative_coins',
          message: 'Negative coins detected',
          severity: 'high',
          value: gameData.coins,
        });
      }
      if (gameData.coins > 1000000) {
        violations.push({
          type: 'impossible_coins',
          message: 'Impossibly high coin count detected',
          severity: 'critical',
          value: gameData.coins,
        });
      }
    }

    if (gameData.gems !== undefined) {
      if (gameData.gems < 0) {
        violations.push({
          type: 'negative_gems',
          message: 'Negative gems detected',
          severity: 'high',
          value: gameData.gems,
        });
      }
      if (gameData.gems > 100000) {
        violations.push({
          type: 'impossible_gems',
          message: 'Impossibly high gem count detected',
          severity: 'critical',
          value: gameData.gems,
        });
      }
    }

    return {
      isValid: violations.length === 0,
      violations,
    };
  }

  /**
   * Check for speed hacking patterns
   */
  checkSpeedHacking(playerProfile, actionType, gameData) {
    const violations = [];
    const now = Date.now();
    const rules = this.validationRules.get(actionType);

    if (!rules) return { isValid: true, violations: [] };

    // Check actions per second
    const recentActions = playerProfile.actions.filter(
      (action) => now - action.timestamp < 1000
    );

    if (recentActions.length > rules.maxActionsPerSecond) {
      violations.push({
        type: 'speed_hack',
        message: `Too many actions per second: ${recentActions.length}`,
        severity: 'high',
        value: recentActions.length,
        limit: rules.maxActionsPerSecond,
      });
    }

    // Check for impossibly fast level completion
    if (actionType === 'level_complete' && gameData.completionTime) {
      if (gameData.completionTime < rules.minTimePerLevel) {
        violations.push({
          type: 'speed_hack_level',
          message: `Level completed too quickly: ${gameData.completionTime}ms`,
          severity: 'critical',
          value: gameData.completionTime,
          limit: rules.minTimePerLevel,
        });
      }
    }

    return {
      isValid: violations.length === 0,
      violations,
    };
  }

  /**
   * Check for resource manipulation
   */
  checkResourceManipulation(playerProfile, actionType, gameData) {
    const violations = [];
    const now = Date.now();
    const rules = this.validationRules.get(actionType);

    if (!rules) return { isValid: true, violations: [] };

    // Check resource gain rates
    if (actionType === 'resource_update') {
      const recentResourceUpdates = playerProfile.actions.filter(
        (action) =>
          action.type === 'resource_update' && now - action.timestamp < 1000
      );

      // Check coins per second
      const coinsGained = recentResourceUpdates.reduce((sum, action) => {
        return sum + (action.data.coinsGained || 0);
      }, 0);

      if (coinsGained > rules.maxCoinsPerSecond) {
        violations.push({
          type: 'resource_manipulation',
          message: `Too many coins gained per second: ${coinsGained}`,
          severity: 'high',
          value: coinsGained,
          limit: rules.maxCoinsPerSecond,
        });
      }

      // Check gems per second
      const gemsGained = recentResourceUpdates.reduce((sum, action) => {
        return sum + (action.data.gemsGained || 0);
      }, 0);

      if (gemsGained > rules.maxGemsPerSecond) {
        violations.push({
          type: 'resource_manipulation',
          message: `Too many gems gained per second: ${gemsGained}`,
          severity: 'high',
          value: gemsGained,
          limit: rules.maxGemsPerSecond,
        });
      }
    }

    return {
      isValid: violations.length === 0,
      violations,
    };
  }

  /**
   * Check for behavioral anomalies
   */
  checkBehavioralAnomalies(playerProfile, actionType, gameData) {
    const suspiciousActivities = [];
    let riskScore = 0;

    // Check for inhuman input patterns
    const inputPattern = this.analyzeInputPattern(playerProfile);
    if (inputPattern.isSuspicious) {
      suspiciousActivities.push({
        type: 'inhuman_input',
        message: 'Input pattern appears inhuman',
        severity: 'medium',
        confidence: inputPattern.confidence,
      });
      riskScore += inputPattern.confidence * 0.3;
    }

    // Check for perfect timing patterns
    const timingPattern = this.analyzeTimingPattern(playerProfile);
    if (timingPattern.isSuspicious) {
      suspiciousActivities.push({
        type: 'perfect_timing',
        message: 'Timing pattern appears too perfect',
        severity: 'medium',
        confidence: timingPattern.confidence,
      });
      riskScore += timingPattern.confidence * 0.2;
    }

    // Check for progression anomalies
    const progressionPattern = this.analyzeProgressionPattern(playerProfile);
    if (progressionPattern.isSuspicious) {
      suspiciousActivities.push({
        type: 'progression_anomaly',
        message: 'Progression pattern appears suspicious',
        severity: 'high',
        confidence: progressionPattern.confidence,
      });
      riskScore += progressionPattern.confidence * 0.4;
    }

    return {
      isValid: suspiciousActivities.length === 0,
      suspiciousActivities,
      riskScore,
    };
  }

  /**
   * Check for pattern recognition
   */
  checkPatternRecognition(playerProfile, actionType, gameData) {
    const suspiciousActivities = [];
    let riskScore = 0;

    // Check for repetitive patterns
    const repetitivePattern = this.checkRepetitivePatterns(playerProfile);
    if (repetitivePattern.isSuspicious) {
      suspiciousActivities.push({
        type: 'repetitive_pattern',
        message: 'Repetitive action pattern detected',
        severity: 'medium',
        confidence: repetitivePattern.confidence,
      });
      riskScore += repetitivePattern.confidence * 0.2;
    }

    // Check for bot-like behavior
    const botPattern = this.checkBotPatterns(playerProfile);
    if (botPattern.isSuspicious) {
      suspiciousActivities.push({
        type: 'bot_behavior',
        message: 'Bot-like behavior detected',
        severity: 'high',
        confidence: botPattern.confidence,
      });
      riskScore += botPattern.confidence * 0.5;
    }

    return {
      isValid: suspiciousActivities.length === 0,
      suspiciousActivities,
      riskScore,
    };
  }

  /**
   * Analyze input patterns for suspicious behavior
   */
  analyzeInputPattern(playerProfile) {
    const recentActions = playerProfile.actions.slice(-100); // Last 100 actions
    if (recentActions.length < 10) {
      return { isSuspicious: false, confidence: 0 };
    }

    // Check for inhumanly consistent timing
    const timings = [];
    for (let i = 1; i < recentActions.length; i++) {
      timings.push(recentActions[i].timestamp - recentActions[i - 1].timestamp);
    }

    const avgTiming =
      timings.reduce((sum, timing) => sum + timing, 0) / timings.length;
    const variance =
      timings.reduce(
        (sum, timing) => sum + Math.pow(timing - avgTiming, 2),
        0
      ) / timings.length;
    const standardDeviation = Math.sqrt(variance);

    // If timing is too consistent (low standard deviation), it might be a bot
    const consistencyThreshold = 50; // milliseconds
    const isSuspicious = standardDeviation < consistencyThreshold;
    const confidence = isSuspicious
      ? Math.min(
          1,
          (consistencyThreshold - standardDeviation) / consistencyThreshold
        )
      : 0;

    return { isSuspicious, confidence };
  }

  /**
   * Analyze timing patterns
   */
  analyzeTimingPattern(playerProfile) {
    const recentActions = playerProfile.actions.slice(-50);
    if (recentActions.length < 10) {
      return { isSuspicious: false, confidence: 0 };
    }

    // Check for perfect intervals
    const intervals = [];
    for (let i = 1; i < recentActions.length; i++) {
      intervals.push(
        recentActions[i].timestamp - recentActions[i - 1].timestamp
      );
    }

    // Check if intervals are too regular (indicating automation)
    const perfectIntervals = intervals.filter(
      (interval) => Math.abs(interval - 1000) < 10 // Within 10ms of 1 second
    ).length;

    const perfectRatio = perfectIntervals / intervals.length;
    const isSuspicious = perfectRatio > 0.8; // More than 80% perfect intervals
    const confidence = isSuspicious ? perfectRatio : 0;

    return { isSuspicious, confidence };
  }

  /**
   * Analyze progression patterns
   */
  analyzeProgressionPattern(playerProfile) {
    const levelCompletions = playerProfile.actions.filter(
      (action) => action.type === 'level_complete'
    );
    if (levelCompletions.length < 5) {
      return { isSuspicious: false, confidence: 0 };
    }

    // Check for impossibly fast progression
    const completionTimes = levelCompletions.map(
      (action) => action.data.completionTime || 0
    );
    const avgCompletionTime =
      completionTimes.reduce((sum, time) => sum + time, 0) /
      completionTimes.length;

    const minExpectedTime = 30000; // 30 seconds minimum
    const isSuspicious = avgCompletionTime < minExpectedTime;
    const confidence = isSuspicious
      ? Math.min(1, (minExpectedTime - avgCompletionTime) / minExpectedTime)
      : 0;

    return { isSuspicious, confidence };
  }

  /**
   * Check for repetitive patterns
   */
  checkRepetitivePatterns(playerProfile) {
    const recentActions = playerProfile.actions.slice(-20);
    if (recentActions.length < 10) {
      return { isSuspicious: false, confidence: 0 };
    }

    // Check for identical action sequences
    const actionTypes = recentActions.map((action) => action.type);
    const uniqueActions = new Set(actionTypes).size;
    const totalActions = actionTypes.length;

    // If there are very few unique actions, it might be repetitive
    const diversityRatio = uniqueActions / totalActions;
    const isSuspicious = diversityRatio < 0.3; // Less than 30% diversity
    const confidence = isSuspicious ? 1 - diversityRatio : 0;

    return { isSuspicious, confidence };
  }

  /**
   * Check for bot patterns
   */
  checkBotPatterns(playerProfile) {
    const recentActions = playerProfile.actions.slice(-100);
    if (recentActions.length < 20) {
      return { isSuspicious: false, confidence: 0 };
    }

    let botScore = 0;

    // Check for 24/7 activity (bots don't sleep)
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const actionsInLastDay = recentActions.filter(
      (action) => now - action.timestamp < oneDay
    );

    if (actionsInLastDay.length > 1000) {
      // More than 1000 actions in a day
      botScore += 0.3;
    }

    // Check for lack of human-like pauses
    const timings = [];
    for (let i = 1; i < recentActions.length; i++) {
      timings.push(recentActions[i].timestamp - recentActions[i - 1].timestamp);
    }

    const longPauses = timings.filter(
      (timing) => timing > 5 * 60 * 1000
    ).length; // 5+ minute pauses
    const pauseRatio = longPauses / timings.length;

    if (pauseRatio < 0.1) {
      // Less than 10% long pauses
      botScore += 0.4;
    }

    // Check for consistent response times
    const responseTimes = recentActions.map(
      (action) => action.data.responseTime || 0
    );
    const avgResponseTime =
      responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const responseVariance =
      responseTimes.reduce(
        (sum, time) => sum + Math.pow(time - avgResponseTime, 2),
        0
      ) / responseTimes.length;

    if (responseVariance < 100) {
      // Very low variance in response times
      botScore += 0.3;
    }

    const isSuspicious = botScore > 0.6;
    return { isSuspicious, confidence: botScore };
  }

  /**
   * Calculate overall risk score
   */
  calculateRiskScore(playerProfile, validationResults) {
    let riskScore = validationResults.riskScore;

    // Add risk based on violation history
    const recentViolations = playerProfile.violations.filter(
      (violation) => Date.now() - violation.timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
    );
    riskScore += recentViolations.length * 0.1;

    // Add risk based on suspicious activity history
    const recentSuspiciousActivities =
      playerProfile.suspiciousActivities.filter(
        (activity) => Date.now() - activity.timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
      );
    riskScore += recentSuspiciousActivities.length * 0.05;

    // Add risk based on account age (newer accounts are riskier)
    const accountAge = Date.now() - playerProfile.createdAt;
    const accountAgeInDays = accountAge / (24 * 60 * 60 * 1000);
    if (accountAgeInDays < 1) {
      riskScore += 0.2;
    } else if (accountAgeInDays < 7) {
      riskScore += 0.1;
    }

    return Math.min(1, riskScore); // Cap at 1.0
  }

  /**
   * Get or create player profile
   */
  getOrCreatePlayerProfile(playerId) {
    if (!this.playerProfiles.has(playerId)) {
      this.playerProfiles.set(playerId, {
        playerId,
        createdAt: Date.now(),
        actions: [],
        violations: [],
        suspiciousActivities: [],
        riskScore: 0,
        isBanned: false,
        lastActivity: Date.now(),
      });
    }
    return this.playerProfiles.get(playerId);
  }

  /**
   * Update player activity
   */
  updatePlayerActivity(playerProfile, actionType, gameData) {
    const action = {
      type: actionType,
      data: gameData,
      timestamp: Date.now(),
    };

    playerProfile.actions.push(action);
    playerProfile.lastActivity = Date.now();

    // Keep only last 1000 actions
    if (playerProfile.actions.length > 1000) {
      playerProfile.actions = playerProfile.actions.slice(-1000);
    }
  }

  /**
   * Update player profile with validation results
   */
  updatePlayerProfileWithValidation(playerProfile, validationResults) {
    // Add violations
    validationResults.violations.forEach((violation) => {
      playerProfile.violations.push({
        ...violation,
        timestamp: Date.now(),
      });
    });

    // Add suspicious activities
    validationResults.suspiciousActivities.forEach((activity) => {
      playerProfile.suspiciousActivities.push({
        ...activity,
        timestamp: Date.now(),
      });
    });

    // Update risk score
    playerProfile.riskScore = validationResults.riskScore;

    // Check if player should be banned
    if (validationResults.riskScore > 0.8) {
      playerProfile.isBanned = true;
      this.logSecurityEvent('player_banned', {
        playerId: playerProfile.playerId,
        reason: 'High risk score',
        riskScore: validationResults.riskScore,
      });
    }
  }

  /**
   * Log validation results
   */
  logValidationResults(playerId, actionType, validationResults) {
    if (
      !validationResults.isValid ||
      validationResults.suspiciousActivities.length > 0
    ) {
      this.logSecurityEvent('cheat_detection', {
        playerId,
        actionType,
        violations: validationResults.violations,
        suspiciousActivities: validationResults.suspiciousActivities,
        riskScore: validationResults.riskScore,
      });
    }
  }

  /**
   * Log security event
   */
  logSecurityEvent(eventType, details) {
    const event = {
      eventId: crypto.randomUUID(),
      eventType,
      details,
      timestamp: Date.now(),
    };

    this.cheatDetections.set(event.eventId, event);
    this.statistics.cheatDetections++;

    console.log(`[ANTI-CHEAT] ${eventType}:`, details);
  }

  /**
   * Get player profile
   */
  getPlayerProfile(playerId) {
    return this.playerProfiles.get(playerId);
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      ...this.statistics,
      activePlayers: this.playerProfiles.size,
      bannedPlayers: Array.from(this.playerProfiles.values()).filter(
        (p) => p.isBanned
      ).length,
      highRiskPlayers: Array.from(this.playerProfiles.values()).filter(
        (p) => p.riskScore > 0.7
      ).length,
    };
  }

  /**
   * Clean up old data
   */
  cleanupOldData() {
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;

    // Clean up old cheat detections
    for (const [eventId, event] of this.cheatDetections.entries()) {
      if (now - event.timestamp > oneWeek) {
        this.cheatDetections.delete(eventId);
      }
    }

    // Clean up old player data
    for (const [playerId, profile] of this.playerProfiles.entries()) {
      if (now - profile.lastActivity > oneWeek) {
        this.playerProfiles.delete(playerId);
      }
    }
  }
}

export default AntiCheatValidator;
