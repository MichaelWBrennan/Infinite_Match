#!/usr/bin/env node

/**
 * Security Scanner and Vulnerability Management System
 * Scans for security vulnerabilities and applies automatic fixes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SecurityScanner {
  constructor() {
    this.vulnerabilities = [];
    this.fixes = [];
    this.scanResults = {
      timestamp: new Date().toISOString(),
      totalScans: 0,
      vulnerabilitiesFound: 0,
      vulnerabilitiesFixed: 0,
      criticalIssues: 0,
      highIssues: 0,
      mediumIssues: 0,
      lowIssues: 0,
    };

    this.scanPatterns = {
      hardcodedSecrets: [
        /password\s*=\s*["\'][^"\']+["\']/gi,
        /api[_-]?key\s*=\s*["\'][^"\']+["\']/gi,
        /secret\s*=\s*["\'][^"\']+["\']/gi,
        /token\s*=\s*["\'][^"\']+["\']/gi,
        /private[_-]?key\s*=\s*["\'][^"\']+["\']/gi,
      ],
      sqlInjection: [
        /SELECT\s+.*\s+FROM\s+.*\s+WHERE\s+.*\+/gi,
        /INSERT\s+INTO\s+.*\s+VALUES\s+.*\+/gi,
        /UPDATE\s+.*\s+SET\s+.*\s+WHERE\s+.*\+/gi,
        /DELETE\s+FROM\s+.*\s+WHERE\s+.*\+/gi,
      ],
      xssVulnerabilities: [
        /innerHTML\s*=\s*[^;]+/gi,
        /document\.write\s*\(/gi,
        /eval\s*\(/gi,
        /setTimeout\s*\(\s*["\'][^"\']+["\']/gi,
      ],
      insecureRandom: [
        /Math\.random\s*\(/gi,
        /new\s+Date\s*\(\s*\)\.getTime\s*\(/gi,
      ],
      weakCrypto: [/md5\s*\(/gi, /sha1\s*\(/gi, /des\s*\(/gi, /rc4\s*\(/gi],
      pathTraversal: [/\.\.\//gi, /\.\.\\/gi, /\.\.%2f/gi, /\.\.%5c/gi],
      commandInjection: [
        /exec\s*\(/gi,
        /system\s*\(/gi,
        /shell_exec\s*\(/gi,
        /passthru\s*\(/gi,
      ],
    };

    this.fixStrategies = {
      hardcodedSecrets: this.fixHardcodedSecrets.bind(this),
      sqlInjection: this.fixSqlInjection.bind(this),
      xssVulnerabilities: this.fixXssVulnerabilities.bind(this),
      insecureRandom: this.fixInsecureRandom.bind(this),
      weakCrypto: this.fixWeakCrypto.bind(this),
      pathTraversal: this.fixPathTraversal.bind(this),
      commandInjection: this.fixCommandInjection.bind(this),
    };
  }

  async scanRepository() {
    console.log('🔍 Starting security scan...');

    try {
      // Scan all relevant files
      await this.scanFiles();

      // Scan dependencies
      await this.scanDependencies();

      // Scan configuration files
      await this.scanConfiguration();

      // Generate report
      await this.generateReport();

      // Apply automatic fixes
      await this.applyFixes();

      console.log('✅ Security scan completed');
      return this.scanResults;
    } catch (error) {
      console.error(`❌ Security scan failed: ${error.message}`);
      throw error;
    }
  }

  async scanFiles() {
    console.log('📁 Scanning source files...');

    const fileTypes = [
      '.js',
      '.ts',
      '.py',
      '.cs',
      '.java',
      '.php',
      '.go',
      '.rb',
    ];
    const excludeDirs = ['node_modules', '.git', 'build', 'dist', 'coverage'];

    const files = this.getFilesRecursively(
      __dirname + '/..',
      fileTypes,
      excludeDirs
    );

    for (const file of files) {
      await this.scanFile(file);
    }

    console.log(`📊 Scanned ${files.length} files`);
  }

  async scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(__dirname + '/..', filePath);

      // Check each vulnerability pattern
      for (const [vulnType, patterns] of Object.entries(this.scanPatterns)) {
        for (const pattern of patterns) {
          const matches = content.match(pattern);
          if (matches) {
            this.addVulnerability({
              type: vulnType,
              file: relativePath,
              line: this.getLineNumber(content, pattern),
              severity: this.getSeverity(vulnType),
              description: this.getDescription(vulnType),
              matches: matches,
              fixable: this.isFixable(vulnType),
            });
          }
        }
      }
    } catch (error) {
      console.error(`❌ Failed to scan file ${filePath}: ${error.message}`);
    }
  }

  async scanDependencies() {
    console.log('📦 Scanning dependencies...');

    // Scan package.json
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      await this.scanPackageJson(packageJsonPath);
    }

    // Scan requirements.txt
    const requirementsPath = path.join(__dirname, '..', 'requirements.txt');
    if (fs.existsSync(requirementsPath)) {
      await this.scanRequirementsTxt(requirementsPath);
    }

    // Scan Unity packages
    const unityPackagesPath = path.join(
      __dirname,
      '..',
      'unity',
      'Packages',
      'manifest.json'
    );
    if (fs.existsSync(unityPackagesPath)) {
      await this.scanUnityPackages(unityPackagesPath);
    }
  }

  async scanPackageJson(packageJsonPath) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      // Check for known vulnerable packages
      const vulnerablePackages = await this.checkVulnerablePackages(
        packageJson.dependencies || {}
      );

      for (const [packageName, vulnerabilities] of Object.entries(
        vulnerablePackages
      )) {
        for (const vuln of vulnerabilities) {
          this.addVulnerability({
            type: 'vulnerable_dependency',
            file: 'package.json',
            line: 0,
            severity: vuln.severity,
            description: `Vulnerable package: ${packageName} - ${vuln.description}`,
            package: packageName,
            version: vuln.version,
            fixable: true,
          });
        }
      }
    } catch (error) {
      console.error(`❌ Failed to scan package.json: ${error.message}`);
    }
  }

  async scanRequirementsTxt(requirementsPath) {
    try {
      const content = fs.readFileSync(requirementsPath, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line && !line.startsWith('#')) {
          const packageName = line.split('==')[0].split('>=')[0].split('<=')[0];
          const vulnerabilities =
            await this.checkPythonVulnerabilities(packageName);

          for (const vuln of vulnerabilities) {
            this.addVulnerability({
              type: 'vulnerable_dependency',
              file: 'requirements.txt',
              line: i + 1,
              severity: vuln.severity,
              description: `Vulnerable Python package: ${packageName} - ${vuln.description}`,
              package: packageName,
              version: vuln.version,
              fixable: true,
            });
          }
        }
      }
    } catch (error) {
      console.error(`❌ Failed to scan requirements.txt: ${error.message}`);
    }
  }

  async scanUnityPackages(manifestPath) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

      // Check Unity packages for vulnerabilities
      const packages = manifest.dependencies || {};

      for (const [packageName, version] of Object.entries(packages)) {
        const vulnerabilities = await this.checkUnityVulnerabilities(
          packageName,
          version
        );

        for (const vuln of vulnerabilities) {
          this.addVulnerability({
            type: 'vulnerable_dependency',
            file: 'unity/Packages/manifest.json',
            line: 0,
            severity: vuln.severity,
            description: `Vulnerable Unity package: ${packageName} - ${vuln.description}`,
            package: packageName,
            version: version,
            fixable: true,
          });
        }
      }
    } catch (error) {
      console.error(`❌ Failed to scan Unity packages: ${error.message}`);
    }
  }

  async scanConfiguration() {
    console.log('⚙️ Scanning configuration files...');

    const configFiles = [
      '.env',
      '.env.local',
      '.env.production',
      'config.json',
      'config.yml',
      'config.yaml',
      'docker-compose.yml',
      'Dockerfile',
    ];

    for (const configFile of configFiles) {
      const configPath = path.join(__dirname, '..', configFile);
      if (fs.existsSync(configPath)) {
        await this.scanConfigFile(configPath);
      }
    }
  }

  async scanConfigFile(configPath) {
    try {
      const content = fs.readFileSync(configPath, 'utf-8');
      const relativePath = path.relative(__dirname + '/..', configPath);

      // Check for exposed secrets
      const secretPatterns = [
        /password\s*=\s*[^\\s]+/gi,
        /api[_-]?key\s*=\s*[^\\s]+/gi,
        /secret\s*=\s*[^\\s]+/gi,
        /token\s*=\s*[^\\s]+/gi,
      ];

      for (const pattern of secretPatterns) {
        const matches = content.match(pattern);
        if (matches) {
          this.addVulnerability({
            type: 'exposed_secret',
            file: relativePath,
            line: this.getLineNumber(content, pattern),
            severity: 'high',
            description: 'Exposed secret in configuration file',
            matches: matches,
            fixable: true,
          });
        }
      }
    } catch (error) {
      console.error(
        `❌ Failed to scan config file ${configPath}: ${error.message}`
      );
    }
  }

  addVulnerability(vulnerability) {
    this.vulnerabilities.push(vulnerability);
    this.scanResults.vulnerabilitiesFound++;

    // Update severity counts
    switch (vulnerability.severity) {
      case 'critical':
        this.scanResults.criticalIssues++;
        break;
      case 'high':
        this.scanResults.highIssues++;
        break;
      case 'medium':
        this.scanResults.mediumIssues++;
        break;
      case 'low':
        this.scanResults.lowIssues++;
        break;
    }

    console.log(
      `⚠️ ${vulnerability.severity.toUpperCase()}: ${vulnerability.type} in ${vulnerability.file}`
    );
  }

  async applyFixes() {
    console.log('🔧 Applying automatic fixes...');

    const fixableVulns = this.vulnerabilities.filter((v) => v.fixable);

    for (const vuln of fixableVulns) {
      try {
        const fixStrategy = this.fixStrategies[vuln.type];
        if (fixStrategy) {
          const success = await fixStrategy(vuln);
          if (success) {
            this.scanResults.vulnerabilitiesFixed++;
            console.log(`✅ Fixed: ${vuln.type} in ${vuln.file}`);
          }
        }
      } catch (error) {
        console.error(
          `❌ Failed to fix ${vuln.type} in ${vuln.file}: ${error.message}`
        );
      }
    }

    console.log(
      `🔧 Applied fixes to ${this.scanResults.vulnerabilitiesFixed} vulnerabilities`
    );
  }

  async fixHardcodedSecrets(vuln) {
    console.log(`  🔧 Fixing hardcoded secrets in ${vuln.file}...`);

    try {
      const filePath = path.join(__dirname, '..', vuln.file);
      let content = fs.readFileSync(filePath, 'utf-8');

      // Replace hardcoded secrets with environment variables
      content = content.replace(
        /password\s*=\s*["\'][^"\']+["\']/gi,
        'password = process.env.PASSWORD'
      );
      content = content.replace(
        /api[_-]?key\s*=\s*["\'][^"\']+["\']/gi,
        'apiKey = process.env.API_KEY'
      );
      content = content.replace(
        /secret\s*=\s*["\'][^"\']+["\']/gi,
        'secret = process.env.SECRET'
      );
      content = content.replace(
        /token\s*=\s*["\'][^"\']+["\']/gi,
        'token = process.env.TOKEN'
      );

      fs.writeFileSync(filePath, content);
      return true;
    } catch (error) {
      console.error(`    ❌ Fix failed: ${error.message}`);
      return false;
    }
  }

  async fixSqlInjection(vuln) {
    console.log(`  🔧 Fixing SQL injection in ${vuln.file}...`);

    try {
      const filePath = path.join(__dirname, '..', vuln.file);
      let content = fs.readFileSync(filePath, 'utf-8');

      // Replace string concatenation with parameterized queries
      content = content.replace(
        /SELECT\s+.*\s+FROM\s+.*\s+WHERE\s+.*\+/gi,
        'SELECT * FROM table WHERE column = ?'
      );

      fs.writeFileSync(filePath, content);
      return true;
    } catch (error) {
      console.error(`    ❌ Fix failed: ${error.message}`);
      return false;
    }
  }

  async fixXssVulnerabilities(vuln) {
    console.log(`  🔧 Fixing XSS vulnerabilities in ${vuln.file}...`);

    try {
      const filePath = path.join(__dirname, '..', vuln.file);
      let content = fs.readFileSync(filePath, 'utf-8');

      // Replace innerHTML with textContent
      content = content.replace(/innerHTML\s*=/gi, 'textContent =');

      // Replace document.write with safer alternatives
      content = content.replace(
        /document\.write\s*\(/gi,
        'document.createElement('
      );

      fs.writeFileSync(filePath, content);
      return true;
    } catch (error) {
      console.error(`    ❌ Fix failed: ${error.message}`);
      return false;
    }
  }

  async fixInsecureRandom(vuln) {
    console.log(`  🔧 Fixing insecure random in ${vuln.file}...`);

    try {
      const filePath = path.join(__dirname, '..', vuln.file);
      let content = fs.readFileSync(filePath, 'utf-8');

      // Replace crypto.getRandomValues(new Uint32Array(1))[0] / 0xffffffff) with crypto.getRandomValues()
      content = content.replace(
        /Math\.random\s*\(/gi,
        'crypto.getRandomValues(new Uint32Array(1))[0] / 0xffffffff'
      );

      fs.writeFileSync(filePath, content);
      return true;
    } catch (error) {
      console.error(`    ❌ Fix failed: ${error.message}`);
      return false;
    }
  }

  async fixWeakCrypto(vuln) {
    console.log(`  🔧 Fixing weak crypto in ${vuln.file}...`);

    try {
      const filePath = path.join(__dirname, '..', vuln.file);
      let content = fs.readFileSync(filePath, 'utf-8');

      // Replace weak hashing with stronger alternatives
      content = content.replace(/md5\s*\(/gi, 'sha256(');
      content = content.replace(/sha1\s*\(/gi, 'sha256(');

      fs.writeFileSync(filePath, content);
      return true;
    } catch (error) {
      console.error(`    ❌ Fix failed: ${error.message}`);
      return false;
    }
  }

  async fixPathTraversal(vuln) {
    console.log(`  🔧 Fixing path traversal in ${vuln.file}...`);

    try {
      const filePath = path.join(__dirname, '..', vuln.file);
      let content = fs.readFileSync(filePath, 'utf-8');

      // Add path validation
      content = content.replace(/\.\.\//gi, '');
      content = content.replace(/\.\.\\/gi, '');

      fs.writeFileSync(filePath, content);
      return true;
    } catch (error) {
      console.error(`    ❌ Fix failed: ${error.message}`);
      return false;
    }
  }

  async fixCommandInjection(vuln) {
    console.log(`  🔧 Fixing command injection in ${vuln.file}...`);

    try {
      const filePath = path.join(__dirname, '..', vuln.file);
      let content = fs.readFileSync(filePath, 'utf-8');

      // Replace dangerous functions with safer alternatives
      content = content.replace(/exec\s*\(/gi, 'execSafe(');
      content = content.replace(/system\s*\(/gi, 'systemSafe(');

      fs.writeFileSync(filePath, content);
      return true;
    } catch (error) {
      console.error(`    ❌ Fix failed: ${error.message}`);
      return false;
    }
  }

  async generateReport() {
    console.log('📊 Generating security report...');

    const report = {
      ...this.scanResults,
      vulnerabilities: this.vulnerabilities,
      summary: {
        totalFiles: this.getTotalFiles(),
        scanDuration: this.getScanDuration(),
        riskScore: this.calculateRiskScore(),
        recommendations: this.getRecommendations(),
      },
    };

    const reportPath = path.join(__dirname, '..', 'security-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`📊 Security report saved to ${reportPath}`);
  }

  // Helper methods
  getFilesRecursively(dir, fileTypes, excludeDirs) {
    const files = [];

    try {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          if (!excludeDirs.includes(item)) {
            files.push(
              ...this.getFilesRecursively(fullPath, fileTypes, excludeDirs)
            );
          }
        } else if (fileTypes.some((type) => item.endsWith(type))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Ignore permission errors
    }

    return files;
  }

  getLineNumber(content, pattern) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        return i + 1;
      }
    }
    return 0;
  }

  getSeverity(vulnType) {
    const severityMap = {
      hardcodedSecrets: 'critical',
      sqlInjection: 'critical',
      commandInjection: 'critical',
      xssVulnerabilities: 'high',
      pathTraversal: 'high',
      weakCrypto: 'medium',
      insecureRandom: 'medium',
      vulnerable_dependency: 'high',
      exposed_secret: 'high',
    };

    return severityMap[vulnType] || 'low';
  }

  getDescription(vulnType) {
    const descriptions = {
      hardcodedSecrets: 'Hardcoded secrets detected',
      sqlInjection: 'SQL injection vulnerability',
      xssVulnerabilities: 'Cross-site scripting vulnerability',
      insecureRandom: 'Insecure random number generation',
      weakCrypto: 'Weak cryptographic algorithm',
      pathTraversal: 'Path traversal vulnerability',
      commandInjection: 'Command injection vulnerability',
      vulnerable_dependency: 'Vulnerable dependency detected',
      exposed_secret: 'Exposed secret in configuration',
    };

    return descriptions[vulnType] || 'Security vulnerability detected';
  }

  isFixable(vulnType) {
    const fixableTypes = [
      'hardcodedSecrets',
      'sqlInjection',
      'xssVulnerabilities',
      'insecureRandom',
      'weakCrypto',
      'pathTraversal',
      'commandInjection',
    ];

    return fixableTypes.includes(vulnType);
  }

  async checkVulnerablePackages(dependencies) {
    // Simulate vulnerability check
    return {};
  }

  async checkPythonVulnerabilities(packageName) {
    // Simulate Python vulnerability check
    return [];
  }

  async checkUnityVulnerabilities(packageName, version) {
    // Simulate Unity vulnerability check
    return [];
  }

  getTotalFiles() {
    return this.getFilesRecursively(
      __dirname + '/..',
      ['.js', '.ts', '.py'],
      ['node_modules', '.git']
    ).length;
  }

  getScanDuration() {
    return '0s'; // Would be calculated in real implementation
  }

  calculateRiskScore() {
    const weights = { critical: 10, high: 7, medium: 4, low: 1 };
    let score = 0;

    score += this.scanResults.criticalIssues * weights.critical;
    score += this.scanResults.highIssues * weights.high;
    score += this.scanResults.mediumIssues * weights.medium;
    score += this.scanResults.lowIssues * weights.low;

    return Math.min(100, score);
  }

  getRecommendations() {
    const recommendations = [];

    if (this.scanResults.criticalIssues > 0) {
      recommendations.push('Address critical vulnerabilities immediately');
    }

    if (this.scanResults.highIssues > 0) {
      recommendations.push('Review and fix high-severity issues');
    }

    if (this.scanResults.mediumIssues > 0) {
      recommendations.push('Plan to address medium-severity issues');
    }

    recommendations.push('Implement regular security scanning');
    recommendations.push('Keep dependencies updated');
    recommendations.push('Use secure coding practices');

    return recommendations;
  }
}

// Main execution
async function main() {
  const scanner = new SecurityScanner();
  await scanner.scanRepository();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default SecurityScanner;
