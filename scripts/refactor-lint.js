#!/usr/bin/env node

/**
 * Refactoring Lint and Format Script
 * Comprehensive code quality checks and fixes
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

const logger = {
  info: (msg) => console.log(chalk.blue(`ℹ ${msg}`)),
  success: (msg) => console.log(chalk.green(`✓ ${msg}`)),
  warn: (msg) => console.log(chalk.yellow(`⚠ ${msg}`)),
  error: (msg) => console.log(chalk.red(`✗ ${msg}`)),
};

class RefactorLinter {
  constructor() {
    this.issues = [];
    this.fixes = [];
  }

  async run() {
    logger.info('Starting comprehensive refactoring lint...');
    
    try {
      await this.checkTypeScript();
      await this.checkESLint();
      await this.checkPrettier();
      await this.checkConsoleLogs();
      await this.checkTODOs();
      await this.checkImports();
      await this.checkErrorHandling();
      await this.checkSecurity();
      
      this.generateReport();
    } catch (error) {
      logger.error(`Refactoring lint failed: ${error.message}`);
      process.exit(1);
    }
  }

  async checkTypeScript() {
    logger.info('Checking TypeScript compilation...');
    
    try {
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
      logger.success('TypeScript compilation passed');
    } catch (error) {
      logger.error('TypeScript compilation failed');
      this.issues.push({
        type: 'typescript',
        message: 'TypeScript compilation errors found',
        details: error.stdout?.toString() || error.message
      });
    }
  }

  async checkESLint() {
    logger.info('Running ESLint...');
    
    try {
      execSync('npx eslint src/ --ext .js,.ts --format=json', { stdio: 'pipe' });
      logger.success('ESLint passed');
    } catch (error) {
      logger.warn('ESLint found issues');
      try {
        const eslintOutput = JSON.parse(error.stdout?.toString() || '[]');
        eslintOutput.forEach(file => {
          file.messages.forEach(message => {
            this.issues.push({
              type: 'eslint',
              file: file.filePath,
              line: message.line,
              column: message.column,
              message: message.message,
              rule: message.ruleId,
              severity: message.severity
            });
          });
        });
      } catch (parseError) {
        this.issues.push({
          type: 'eslint',
          message: 'ESLint parsing failed',
          details: error.stdout?.toString()
        });
      }
    }
  }

  async checkPrettier() {
    logger.info('Checking Prettier formatting...');
    
    try {
      execSync('npx prettier --check "src/**/*.{js,ts,json}"', { stdio: 'pipe' });
      logger.success('Prettier formatting is correct');
    } catch (error) {
      logger.warn('Prettier formatting issues found');
      this.issues.push({
        type: 'prettier',
        message: 'Code formatting issues found',
        details: error.stdout?.toString()
      });
    }
  }

  async checkConsoleLogs() {
    logger.info('Checking for console.log statements...');
    
    try {
      const result = execSync('grep -r "console\\.log" src/ --include="*.js" --include="*.ts" || true', { 
        encoding: 'utf8' 
      });
      
      if (result.trim()) {
        const lines = result.trim().split('\n');
        lines.forEach(line => {
          const [file, ...rest] = line.split(':');
          const content = rest.join(':');
          this.issues.push({
            type: 'console',
            file,
            message: 'console.log statement found',
            details: content.trim()
          });
        });
        logger.warn(`Found ${lines.length} console.log statements`);
      } else {
        logger.success('No console.log statements found');
      }
    } catch (error) {
      logger.error(`Error checking console.log: ${error.message}`);
    }
  }

  async checkTODOs() {
    logger.info('Checking for TODO comments...');
    
    try {
      const result = execSync('grep -r "TODO\\|FIXME\\|HACK\\|XXX" src/ --include="*.js" --include="*.ts" || true', { 
        encoding: 'utf8' 
      });
      
      if (result.trim()) {
        const lines = result.trim().split('\n');
        lines.forEach(line => {
          const [file, ...rest] = line.split(':');
          const content = rest.join(':');
          this.issues.push({
            type: 'todo',
            file,
            message: 'TODO/FIXME comment found',
            details: content.trim()
          });
        });
        logger.warn(`Found ${lines.length} TODO/FIXME comments`);
      } else {
        logger.success('No TODO/FIXME comments found');
      }
    } catch (error) {
      logger.error(`Error checking TODOs: ${error.message}`);
    }
  }

  async checkImports() {
    logger.info('Checking import statements...');
    
    try {
      const result = execSync('find src/ -name "*.js" -o -name "*.ts" | head -20', { encoding: 'utf8' });
      const files = result.trim().split('\n').filter(f => f);
      
      files.forEach(file => {
        if (existsSync(file)) {
          const content = readFileSync(file, 'utf8');
          const lines = content.split('\n');
          
          lines.forEach((line, index) => {
            // Check for relative imports that could be absolute
            if (line.includes('import') && line.includes('../')) {
              this.issues.push({
                type: 'import',
                file,
                line: index + 1,
                message: 'Relative import found - consider using absolute imports',
                details: line.trim()
              });
            }
            
            // Check for unused imports
            if (line.includes('import') && line.includes('{')) {
              const importMatch = line.match(/import\s*{([^}]+)}\s*from/);
              if (importMatch) {
                const imports = importMatch[1].split(',').map(i => i.trim());
                imports.forEach(imp => {
                  const importName = imp.split(' as ')[0].trim();
                  if (!content.includes(importName) || content.indexOf(importName) === content.indexOf(line)) {
                    this.issues.push({
                      type: 'import',
                      file,
                      line: index + 1,
                      message: 'Potentially unused import',
                      details: `${importName} in ${line.trim()}`
                    });
                  }
                });
              }
            }
          });
        }
      });
    } catch (error) {
      logger.error(`Error checking imports: ${error.message}`);
    }
  }

  async checkErrorHandling() {
    logger.info('Checking error handling patterns...');
    
    try {
      const result = execSync('find src/ -name "*.js" -o -name "*.ts" | head -20', { encoding: 'utf8' });
      const files = result.trim().split('\n').filter(f => f);
      
      files.forEach(file => {
        if (existsSync(file)) {
          const content = readFileSync(file, 'utf8');
          const lines = content.split('\n');
          
          lines.forEach((line, index) => {
            // Check for try-catch without proper error handling
            if (line.includes('try {') && !content.includes('catch')) {
              this.issues.push({
                type: 'error-handling',
                file,
                line: index + 1,
                message: 'Try block without catch statement',
                details: line.trim()
              });
            }
            
            // Check for console.error instead of proper logging
            if (line.includes('console.error')) {
              this.issues.push({
                type: 'error-handling',
                file,
                line: index + 1,
                message: 'console.error found - use proper logger',
                details: line.trim()
              });
            }
            
            // Check for generic error handling
            if (line.includes('catch (error)') && !line.includes('ErrorHandler')) {
              this.issues.push({
                type: 'error-handling',
                file,
                line: index + 1,
                message: 'Generic error handling - consider using ErrorHandler',
                details: line.trim()
              });
            }
          });
        }
      });
    } catch (error) {
      logger.error(`Error checking error handling: ${error.message}`);
    }
  }

  async checkSecurity() {
    logger.info('Checking security patterns...');
    
    try {
      const result = execSync('find src/ -name "*.js" -o -name "*.ts" | head -20', { encoding: 'utf8' });
      const files = result.trim().split('\n').filter(f => f);
      
      files.forEach(file => {
        if (existsSync(file)) {
          const content = readFileSync(file, 'utf8');
          const lines = content.split('\n');
          
          lines.forEach((line, index) => {
            // Check for hardcoded secrets
            if (line.includes('password') || line.includes('secret') || line.includes('key')) {
              if (line.includes('=') && !line.includes('process.env')) {
                this.issues.push({
                  type: 'security',
                  file,
                  line: index + 1,
                  message: 'Potential hardcoded secret found',
                  details: line.trim()
                });
              }
            }
            
            // Check for eval usage
            if (line.includes('eval(')) {
              this.issues.push({
                type: 'security',
                file,
                line: index + 1,
                message: 'eval() usage found - security risk',
                details: line.trim()
              });
            }
            
            // Check for innerHTML usage
            if (line.includes('innerHTML')) {
              this.issues.push({
                type: 'security',
                file,
                line: index + 1,
                message: 'innerHTML usage found - potential XSS risk',
                details: line.trim()
              });
            }
          });
        }
      });
    } catch (error) {
      logger.error(`Error checking security: ${error.message}`);
    }
  }

  generateReport() {
    logger.info('Generating refactoring report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      totalIssues: this.issues.length,
      issuesByType: this.groupIssuesByType(),
      issues: this.issues,
      summary: this.generateSummary()
    };
    
    const reportPath = join(process.cwd(), 'refactoring-report.json');
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    logger.success(`Refactoring report generated: ${reportPath}`);
    this.printSummary();
  }

  groupIssuesByType() {
    const grouped = {};
    this.issues.forEach(issue => {
      if (!grouped[issue.type]) {
        grouped[issue.type] = [];
      }
      grouped[issue.type].push(issue);
    });
    return grouped;
  }

  generateSummary() {
    const summary = {
      critical: this.issues.filter(i => i.severity === 2).length,
      warnings: this.issues.filter(i => i.severity === 1).length,
      info: this.issues.filter(i => !i.severity).length,
      recommendations: []
    };
    
    if (summary.critical > 0) {
      summary.recommendations.push('Fix critical issues before deployment');
    }
    
    if (this.issues.filter(i => i.type === 'console').length > 0) {
      summary.recommendations.push('Replace console.log with proper logging');
    }
    
    if (this.issues.filter(i => i.type === 'todo').length > 0) {
      summary.recommendations.push('Address TODO/FIXME comments');
    }
    
    if (this.issues.filter(i => i.type === 'security').length > 0) {
      summary.recommendations.push('Review security issues');
    }
    
    return summary;
  }

  printSummary() {
    console.log('\n' + chalk.bold('Refactoring Summary:'));
    console.log(chalk.red(`Critical Issues: ${this.issues.filter(i => i.severity === 2).length}`));
    console.log(chalk.yellow(`Warnings: ${this.issues.filter(i => i.severity === 1).length}`));
    console.log(chalk.blue(`Info: ${this.issues.filter(i => !i.severity).length}`));
    console.log(chalk.green(`Total Issues: ${this.issues.length}`));
    
    if (this.issues.length === 0) {
      logger.success('No issues found! Code is ready for production.');
    } else {
      console.log('\n' + chalk.bold('Top Issues:'));
      const topIssues = this.issues.slice(0, 5);
      topIssues.forEach((issue, index) => {
        console.log(`${index + 1}. [${issue.type}] ${issue.message}`);
        if (issue.file) {
          console.log(`   File: ${issue.file}:${issue.line || 'N/A'}`);
        }
      });
    }
  }
}

// Run the refactoring linter
const linter = new RefactorLinter();
linter.run().catch(console.error);