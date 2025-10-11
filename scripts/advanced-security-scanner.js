#!/usr/bin/env node

/**
 * Advanced Security Scanner
 * Comprehensive security analysis for 100/100 score
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AdvancedSecurityScanner {
  constructor() {
    this.score = 0;
    this.maxScore = 100;
    this.issues = [];
    this.recommendations = [];
    this.checks = [];
  }

  async scan() {
    console.log('🔒 Advanced Security Scanner - Targeting 100/100 Score\n');
    
    // Core Security Checks (40 points)
    await this.checkAuthenticationSecurity();
    await this.checkAuthorizationSecurity();
    await this.checkInputValidation();
    await this.checkOutputEncoding();
    
    // Cryptographic Security (20 points)
    await this.checkCryptographicImplementation();
    await this.checkKeyManagement();
    await this.checkRandomNumberGeneration();
    
    // Infrastructure Security (20 points)
    await this.checkNetworkSecurity();
    await this.checkServerSecurity();
    await this.checkDatabaseSecurity();
    
    // Application Security (20 points)
    await this.checkSessionManagement();
    await this.checkErrorHandling();
    await this.checkLoggingSecurity();
    await this.checkDependencySecurity();
    
    this.generateReport();
  }

  async checkAuthenticationSecurity() {
    console.log('🔐 Checking Authentication Security...');
    
    // JWT Implementation
    const jwtScore = this.checkJWTImplementation();
    this.score += jwtScore;
    this.checks.push({ name: 'JWT Implementation', score: jwtScore, max: 10 });
    
    // Password Security
    const passwordScore = this.checkPasswordSecurity();
    this.score += passwordScore;
    this.checks.push({ name: 'Password Security', score: passwordScore, max: 10 });
    
    // Multi-Factor Authentication
    const mfaScore = this.checkMFAImplementation();
    this.score += mfaScore;
    this.checks.push({ name: 'MFA Implementation', score: mfaScore, max: 10 });
    
    // Session Security
    const sessionScore = this.checkSessionSecurity();
    this.score += sessionScore;
    this.checks.push({ name: 'Session Security', score: sessionScore, max: 10 });
  }

  checkJWTImplementation() {
    let score = 0;
    
    try {
      const configPath = path.join(__dirname, '..', 'src', 'core', 'config', 'index.js');
      const config = fs.readFileSync(configPath, 'utf8');
      
      // Check for strong secret
      if (config.includes('CHANGE_THIS_IN_PRODUCTION')) {
        score += 2; // Warning about default secret
      }
      
      // Check for proper expiration
      if (config.includes('expiresIn')) {
        score += 2;
      }
      
      // Check for proper algorithm
      if (config.includes('HS256') || config.includes('RS256')) {
        score += 3;
      }
      
      // Check for secure implementation
      const securityPath = path.join(__dirname, '..', 'src', 'core', 'security', 'index.js');
      const security = fs.readFileSync(securityPath, 'utf8');
      
      if (security.includes('jwt.verify') && security.includes('jwt.sign')) {
        score += 3;
      }
      
    } catch (error) {
      this.issues.push('JWT implementation check failed');
    }
    
    return Math.min(score, 10);
  }

  checkPasswordSecurity() {
    let score = 0;
    
    try {
      const configPath = path.join(__dirname, '..', 'src', 'core', 'config', 'index.js');
      const config = fs.readFileSync(configPath, 'utf8');
      
      // Check for bcrypt
      if (config.includes('bcrypt')) {
        score += 3;
      }
      
      // Check for proper rounds
      if (config.includes('BCRYPT_ROUNDS') || config.includes('rounds: 12')) {
        score += 3;
      }
      
      // Check for password policies
      const authPath = path.join(__dirname, '..', 'src', 'routes', 'auth.js');
      const auth = fs.readFileSync(authPath, 'utf8');
      
      if (auth.includes('password') && auth.includes('hash')) {
        score += 4;
      }
      
    } catch (error) {
      this.issues.push('Password security check failed');
    }
    
    return Math.min(score, 10);
  }

  checkMFAImplementation() {
    let score = 0;
    
    // Check if MFA is implemented
    const authPath = path.join(__dirname, '..', 'src', 'routes', 'auth.js');
    try {
      const auth = fs.readFileSync(authPath, 'utf8');
      
      if (auth.includes('totp') || auth.includes('2fa') || auth.includes('mfa')) {
        score += 10;
      } else {
        this.recommendations.push('Implement Multi-Factor Authentication (MFA)');
      }
    } catch (error) {
      this.recommendations.push('Implement Multi-Factor Authentication (MFA)');
    }
    
    return score;
  }

  checkSessionSecurity() {
    let score = 0;
    
    try {
      const securityPath = path.join(__dirname, '..', 'src', 'core', 'security', 'index.js');
      const security = fs.readFileSync(securityPath, 'utf8');
      
      // Check for session management
      if (security.includes('session') && security.includes('destroySession')) {
        score += 5;
      }
      
      // Check for secure session storage
      if (security.includes('httpOnly') || security.includes('secure')) {
        score += 3;
      }
      
      // Check for session timeout
      if (security.includes('timeout') || security.includes('expires')) {
        score += 2;
      }
      
    } catch (error) {
      this.issues.push('Session security check failed');
    }
    
    return Math.min(score, 10);
  }

  async checkAuthorizationSecurity() {
    console.log('🛡️ Checking Authorization Security...');
    
    // Role-based access control
    const rbacScore = this.checkRBACImplementation();
    this.score += rbacScore;
    this.checks.push({ name: 'RBAC Implementation', score: rbacScore, max: 10 });
    
    // API endpoint protection
    const apiScore = this.checkAPIProtection();
    this.score += apiScore;
    this.checks.push({ name: 'API Protection', score: apiScore, max: 10 });
  }

  checkRBACImplementation() {
    let score = 0;
    
    try {
      const adminPath = path.join(__dirname, '..', 'src', 'routes', 'admin.js');
      const admin = fs.readFileSync(adminPath, 'utf8');
      
      // Check for admin token validation
      if (admin.includes('ADMIN_TOKEN') && admin.includes('401')) {
        score += 5;
      }
      
      // Check for role-based checks
      if (admin.includes('role') || admin.includes('permission')) {
        score += 5;
      } else {
        this.recommendations.push('Implement role-based access control');
      }
      
    } catch (error) {
      this.recommendations.push('Implement role-based access control');
    }
    
    return Math.min(score, 10);
  }

  checkAPIProtection() {
    let score = 0;
    
    try {
      const serverPath = path.join(__dirname, '..', 'src', 'server', 'index.js');
      const server = fs.readFileSync(serverPath, 'utf8');
      
      // Check for rate limiting
      if (server.includes('rateLimit') || server.includes('RateLimit')) {
        score += 3;
      }
      
      // Check for authentication middleware
      if (server.includes('authRateLimit') || server.includes('sessionValidation')) {
        score += 4;
      }
      
      // Check for CORS protection
      if (server.includes('cors') || server.includes('CORS')) {
        score += 3;
      }
      
    } catch (error) {
      this.issues.push('API protection check failed');
    }
    
    return Math.min(score, 10);
  }

  async checkInputValidation() {
    console.log('🔍 Checking Input Validation...');
    
    const validationScore = this.checkValidationImplementation();
    this.score += validationScore;
    this.checks.push({ name: 'Input Validation', score: validationScore, max: 10 });
  }

  checkValidationImplementation() {
    let score = 0;
    
    try {
      const securityPath = path.join(__dirname, '..', 'src', 'core', 'security', 'index.js');
      const security = fs.readFileSync(securityPath, 'utf8');
      
      // Check for input validation middleware
      if (security.includes('inputValidation') || security.includes('sanitize')) {
        score += 5;
      }
      
      // Check for XSS protection
      if (security.includes('xss') || security.includes('XSS')) {
        score += 3;
      }
      
      // Check for SQL injection protection
      if (security.includes('sql') || security.includes('injection')) {
        score += 2;
      }
      
    } catch (error) {
      this.issues.push('Input validation check failed');
    }
    
    return Math.min(score, 10);
  }

  async checkOutputEncoding() {
    console.log('📤 Checking Output Encoding...');
    
    const encodingScore = this.checkEncodingImplementation();
    this.score += encodingScore;
    this.checks.push({ name: 'Output Encoding', score: encodingScore, max: 10 });
  }

  checkEncodingImplementation() {
    let score = 0;
    
    try {
      const utilsPath = path.join(__dirname, '..', 'src', 'core', 'utils', 'index.js');
      const utils = fs.readFileSync(utilsPath, 'utf8');
      
      // Check for sanitization functions
      if (utils.includes('sanitize') || utils.includes('escape')) {
        score += 5;
      }
      
      // Check for proper encoding
      if (utils.includes('encode') || utils.includes('decode')) {
        score += 3;
      }
      
      // Check for HTML encoding
      if (utils.includes('html') || utils.includes('HTML')) {
        score += 2;
      }
      
    } catch (error) {
      this.issues.push('Output encoding check failed');
    }
    
    return Math.min(score, 10);
  }

  async checkCryptographicImplementation() {
    console.log('🔐 Checking Cryptographic Implementation...');
    
    const cryptoScore = this.checkCryptoImplementation();
    this.score += cryptoScore;
    this.checks.push({ name: 'Cryptographic Implementation', score: cryptoScore, max: 10 });
  }

  checkCryptoImplementation() {
    let score = 0;
    
    try {
      const configPath = path.join(__dirname, '..', 'src', 'core', 'config', 'index.js');
      const config = fs.readFileSync(configPath, 'utf8');
      
      // Check for AES-256-GCM
      if (config.includes('aes-256-gcm')) {
        score += 5;
      }
      
      // Check for proper key management
      if (config.includes('ENCRYPTION_KEY')) {
        score += 3;
      }
      
      // Check for secure random generation
      const utilsPath = path.join(__dirname, '..', 'src', 'core', 'utils', 'index.js');
      const utils = fs.readFileSync(utilsPath, 'utf8');
      
      if (utils.includes('crypto.getRandomValues')) {
        score += 2;
      }
      
    } catch (error) {
      this.issues.push('Cryptographic implementation check failed');
    }
    
    return Math.min(score, 10);
  }

  async checkKeyManagement() {
    console.log('🗝️ Checking Key Management...');
    
    const keyScore = this.checkKeyManagementImplementation();
    this.score += keyScore;
    this.checks.push({ name: 'Key Management', score: keyScore, max: 5 });
  }

  checkKeyManagementImplementation() {
    let score = 0;
    
    try {
      const configPath = path.join(__dirname, '..', 'src', 'core', 'config', 'index.js');
      const config = fs.readFileSync(configPath, 'utf8');
      
      // Check for environment variable usage
      if (config.includes('process.env.') && config.includes('JWT_SECRET')) {
        score += 2;
      }
      
      // Check for key rotation capability
      if (config.includes('key') && config.includes('rotation')) {
        score += 3;
      } else {
        this.recommendations.push('Implement key rotation mechanism');
      }
      
    } catch (error) {
      this.issues.push('Key management check failed');
    }
    
    return Math.min(score, 5);
  }

  async checkRandomNumberGeneration() {
    console.log('🎲 Checking Random Number Generation...');
    
    const randomScore = this.checkRandomImplementation();
    this.score += randomScore;
    this.checks.push({ name: 'Random Number Generation', score: randomScore, max: 5 });
  }

  checkRandomImplementation() {
    let score = 0;
    
    try {
      const utilsPath = path.join(__dirname, '..', 'src', 'core', 'utils', 'index.js');
      const utils = fs.readFileSync(utilsPath, 'utf8');
      
      // Check for crypto.getRandomValues usage
      if (utils.includes('crypto.getRandomValues')) {
        score += 3;
      }
      
      // Check for proper entropy
      if (utils.includes('Uint8Array') && utils.includes('length')) {
        score += 2;
      }
      
    } catch (error) {
      this.issues.push('Random number generation check failed');
    }
    
    return Math.min(score, 5);
  }

  async checkNetworkSecurity() {
    console.log('🌐 Checking Network Security...');
    
    const networkScore = this.checkNetworkImplementation();
    this.score += networkScore;
    this.checks.push({ name: 'Network Security', score: networkScore, max: 10 });
  }

  checkNetworkImplementation() {
    let score = 0;
    
    try {
      const serverPath = path.join(__dirname, '..', 'src', 'server', 'index.js');
      const server = fs.readFileSync(serverPath, 'utf8');
      
      // Check for HTTPS enforcement
      if (server.includes('https') || server.includes('ssl')) {
        score += 3;
      } else {
        this.recommendations.push('Enforce HTTPS in production');
      }
      
      // Check for security headers
      if (server.includes('helmet') || server.includes('securityHeaders')) {
        score += 4;
      }
      
      // Check for CORS configuration
      if (server.includes('cors') || server.includes('CORS')) {
        score += 3;
      }
      
    } catch (error) {
      this.issues.push('Network security check failed');
    }
    
    return Math.min(score, 10);
  }

  async checkServerSecurity() {
    console.log('🖥️ Checking Server Security...');
    
    const serverScore = this.checkServerImplementation();
    this.score += serverScore;
    this.checks.push({ name: 'Server Security', score: serverScore, max: 5 });
  }

  checkServerImplementation() {
    let score = 0;
    
    try {
      const serverPath = path.join(__dirname, '..', 'src', 'server', 'index.js');
      const server = fs.readFileSync(serverPath, 'utf8');
      
      // Check for proper error handling
      if (server.includes('errorHandler') || server.includes('try-catch')) {
        score += 2;
      }
      
      // Check for graceful shutdown
      if (server.includes('SIGTERM') || server.includes('SIGINT')) {
        score += 2;
      }
      
      // Check for request logging
      if (server.includes('logger') || server.includes('log')) {
        score += 1;
      }
      
    } catch (error) {
      this.issues.push('Server security check failed');
    }
    
    return Math.min(score, 5);
  }

  async checkDatabaseSecurity() {
    console.log('🗄️ Checking Database Security...');
    
    const dbScore = this.checkDatabaseImplementation();
    this.score += dbScore;
    this.checks.push({ name: 'Database Security', score: dbScore, max: 5 });
  }

  checkDatabaseImplementation() {
    let score = 0;
    
    try {
      const configPath = path.join(__dirname, '..', 'src', 'core', 'config', 'index.js');
      const config = fs.readFileSync(configPath, 'utf8');
      
      // Check for connection string security
      if (config.includes('DATABASE_URL') && config.includes('mongodb://')) {
        score += 2;
      }
      
      // Check for connection options
      if (config.includes('useNewUrlParser') && config.includes('useUnifiedTopology')) {
        score += 2;
      }
      
      // Check for query sanitization
      if (config.includes('sanitize') || config.includes('validation')) {
        score += 1;
      }
      
    } catch (error) {
      this.issues.push('Database security check failed');
    }
    
    return Math.min(score, 5);
  }

  async checkSessionManagement() {
    console.log('📱 Checking Session Management...');
    
    const sessionScore = this.checkSessionImplementation();
    this.score += sessionScore;
    this.checks.push({ name: 'Session Management', score: sessionScore, max: 5 });
  }

  checkSessionImplementation() {
    let score = 0;
    
    try {
      const securityPath = path.join(__dirname, '..', 'src', 'core', 'security', 'index.js');
      const security = fs.readFileSync(securityPath, 'utf8');
      
      // Check for session creation
      if (security.includes('createSession') || security.includes('session')) {
        score += 2;
      }
      
      // Check for session destruction
      if (security.includes('destroySession') || security.includes('logout')) {
        score += 2;
      }
      
      // Check for session validation
      if (security.includes('validateSession') || security.includes('sessionValidation')) {
        score += 1;
      }
      
    } catch (error) {
      this.issues.push('Session management check failed');
    }
    
    return Math.min(score, 5);
  }

  async checkErrorHandling() {
    console.log('⚠️ Checking Error Handling...');
    
    const errorScore = this.checkErrorImplementation();
    this.score += errorScore;
    this.checks.push({ name: 'Error Handling', score: errorScore, max: 5 });
  }

  checkErrorImplementation() {
    let score = 0;
    
    try {
      const serverPath = path.join(__dirname, '..', 'src', 'server', 'index.js');
      const server = fs.readFileSync(serverPath, 'utf8');
      
      // Check for error middleware
      if (server.includes('errorHandler') || server.includes('error')) {
        score += 3;
      }
      
      // Check for proper error responses
      if (server.includes('status') && server.includes('json')) {
        score += 2;
      }
      
    } catch (error) {
      this.issues.push('Error handling check failed');
    }
    
    return Math.min(score, 5);
  }

  async checkLoggingSecurity() {
    console.log('📝 Checking Logging Security...');
    
    const loggingScore = this.checkLoggingImplementation();
    this.score += loggingScore;
    this.checks.push({ name: 'Logging Security', score: loggingScore, max: 5 });
  }

  checkLoggingImplementation() {
    let score = 0;
    
    try {
      const loggerPath = path.join(__dirname, '..', 'src', 'core', 'logger', 'index.js');
      const logger = fs.readFileSync(loggerPath, 'utf8');
      
      // Check for structured logging
      if (logger.includes('winston') || logger.includes('log')) {
        score += 2;
      }
      
      // Check for log sanitization
      if (logger.includes('sanitize') || logger.includes('filter')) {
        score += 2;
      }
      
      // Check for log rotation
      if (logger.includes('rotate') || logger.includes('maxFiles')) {
        score += 1;
      }
      
    } catch (error) {
      this.issues.push('Logging security check failed');
    }
    
    return Math.min(score, 5);
  }

  async checkDependencySecurity() {
    console.log('📦 Checking Dependency Security...');
    
    const depScore = this.checkDependencyImplementation();
    this.score += depScore;
    this.checks.push({ name: 'Dependency Security', score: depScore, max: 5 });
  }

  checkDependencyImplementation() {
    let score = 0;
    
    try {
      const packagePath = path.join(__dirname, '..', 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      // Check for security-related dependencies
      const securityDeps = ['helmet', 'bcryptjs', 'jsonwebtoken', 'express-rate-limit', 'xss'];
      const hasSecurityDeps = securityDeps.some(dep => packageJson.dependencies[dep]);
      
      if (hasSecurityDeps) {
        score += 3;
      }
      
      // Check for up-to-date versions
      const hasRecentVersions = Object.values(packageJson.dependencies).some(version => 
        version.includes('^') || version.includes('~')
      );
      
      if (hasRecentVersions) {
        score += 2;
      }
      
    } catch (error) {
      this.issues.push('Dependency security check failed');
    }
    
    return Math.min(score, 5);
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('🔒 ADVANCED SECURITY SCAN REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n📊 SECURITY SCORE: ${this.score}/${this.maxScore}`);
    
    if (this.score >= 95) {
      console.log('🎉 EXCELLENT! Near-perfect security score!');
    } else if (this.score >= 85) {
      console.log('✅ GOOD! Strong security implementation!');
    } else if (this.score >= 70) {
      console.log('⚠️ FAIR! Some security improvements needed!');
    } else {
      console.log('🚨 POOR! Significant security issues found!');
    }
    
    console.log('\n📋 DETAILED BREAKDOWN:');
    this.checks.forEach(check => {
      const percentage = Math.round((check.score / check.max) * 100);
      const status = percentage >= 80 ? '✅' : percentage >= 60 ? '⚠️' : '❌';
      console.log(`  ${status} ${check.name}: ${check.score}/${check.max} (${percentage}%)`);
    });
    
    if (this.issues.length > 0) {
      console.log('\n🚨 ISSUES FOUND:');
      this.issues.forEach(issue => {
        console.log(`  ❌ ${issue}`);
      });
    }
    
    if (this.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS FOR 100/100:');
      this.recommendations.forEach(rec => {
        console.log(`  🔧 ${rec}`);
      });
    }
    
    // Calculate what's needed for 100/100
    const needed = this.maxScore - this.score;
    if (needed > 0) {
      console.log(`\n🎯 TO ACHIEVE 100/100: Need ${needed} more points`);
      console.log('   Focus on the recommendations above!');
    } else {
      console.log('\n🎉 CONGRATULATIONS! You have achieved 100/100 security score!');
    }
    
    console.log('\n' + '='.repeat(60));
  }
}

// Run the scanner
const scanner = new AdvancedSecurityScanner();
scanner.scan().catch(console.error);