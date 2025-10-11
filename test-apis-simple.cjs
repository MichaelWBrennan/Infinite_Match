#!/usr/bin/env node

/**
 * Simple API and Secrets Test Script
 * Tests environment variables and basic configuration
 */

const fs = require('fs');
const path = require('path');

// Test results
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Helper function to run test
function runTest(name, testFn) {
  testResults.total++;
  console.log(`Running test: ${name}`);
  
  try {
    const result = testFn();
    testResults.passed++;
    testResults.details.push({ name, status: 'PASS', result });
    console.log(`✅ ${name} - PASSED`);
    return result;
  } catch (error) {
    testResults.failed++;
    testResults.details.push({ name, status: 'FAIL', error: error.message });
    console.log(`❌ ${name} - FAILED: ${error.message}`);
    return null;
  }
}

// Test 1: Environment Variables and Secrets
function testEnvironmentVariables() {
  const requiredEnvVars = [
    'NODE_ENV',
    'DATABASE_URL',
    'REDIS_URL',
    'MONGODB_URI',
    'UNITY_PROJECT_ID',
    'UNITY_ENV_ID',
    'UNITY_ORG_ID',
    'UNITY_CLIENT_ID',
    'UNITY_CLIENT_SECRET',
    'UNITY_API_TOKEN',
    'JWT_SECRET',
    'ENCRYPTION_KEY'
  ];

  const missingVars = [];
  const presentVars = [];

  for (const varName of requiredEnvVars) {
    if (process.env[varName]) {
      presentVars.push(varName);
    } else {
      missingVars.push(varName);
    }
  }

  return {
    total: requiredEnvVars.length,
    present: presentVars.length,
    missing: missingVars.length,
    missingVars,
    presentVars
  };
}

// Test 2: Package.json Configuration
function testPackageJson() {
  const packagePath = path.join(__dirname, 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    throw new Error('package.json not found');
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  if (!packageJson.name || !packageJson.version) {
    throw new Error('package.json missing required fields');
  }
  
  return {
    name: packageJson.name,
    version: packageJson.version,
    dependencies: Object.keys(packageJson.dependencies || {}).length,
    scripts: Object.keys(packageJson.scripts || {}).length
  };
}

// Test 3: TypeScript Configuration
function testTypeScriptConfig() {
  const tsconfigPath = path.join(__dirname, 'tsconfig.json');
  
  if (!fs.existsSync(tsconfigPath)) {
    throw new Error('tsconfig.json not found');
  }
  
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
  
  if (!tsconfig.compilerOptions || !tsconfig.compilerOptions.target) {
    throw new Error('tsconfig.json missing required compiler options');
  }
  
  return {
    target: tsconfig.compilerOptions.target,
    module: tsconfig.compilerOptions.module,
    strict: tsconfig.compilerOptions.strict
  };
}

// Test 4: Docker Configuration
function testDockerConfig() {
  const dockerPath = path.join(__dirname, 'docker-compose.yml');
  
  if (!fs.existsSync(dockerPath)) {
    throw new Error('docker-compose.yml not found');
  }
  
  const dockerContent = fs.readFileSync(dockerPath, 'utf8');
  
  if (!dockerContent.includes('api-gateway') || !dockerContent.includes('game-service')) {
    throw new Error('docker-compose.yml missing required services');
  }
  
  return {
    hasApiGateway: dockerContent.includes('api-gateway'),
    hasGameService: dockerContent.includes('game-service'),
    hasEconomyService: dockerContent.includes('economy-service'),
    hasAnalyticsService: dockerContent.includes('analytics-service'),
    hasSecurityService: dockerContent.includes('security-service'),
    hasUnityService: dockerContent.includes('unity-service'),
    hasAIService: dockerContent.includes('ai-service')
  };
}

// Test 5: Source Code Structure
function testSourceCodeStructure() {
  const srcPath = path.join(__dirname, 'src');
  
  if (!fs.existsSync(srcPath)) {
    throw new Error('src directory not found');
  }
  
  const requiredDirs = ['core', 'routes', 'services', 'microservices'];
  const presentDirs = [];
  const missingDirs = [];
  
  for (const dir of requiredDirs) {
    const dirPath = path.join(srcPath, dir);
    if (fs.existsSync(dirPath)) {
      presentDirs.push(dir);
    } else {
      missingDirs.push(dir);
    }
  }
  
  return {
    total: requiredDirs.length,
    present: presentDirs.length,
    missing: missingDirs.length,
    presentDirs,
    missingDirs
  };
}

// Test 6: Unity Integration Files
function testUnityIntegration() {
  const unityPath = path.join(__dirname, 'unity');
  
  if (!fs.existsSync(unityPath)) {
    throw new Error('unity directory not found');
  }
  
  const requiredFiles = [
    'Assets/Scripts/CloudSave/CloudSaveManager.cs',
    'Assets/Scripts/Weather/AdvancedWeatherSystem.cs',
    'Assets/Scripts/CloudGaming/CloudGamingSystem.cs'
  ];
  
  const presentFiles = [];
  const missingFiles = [];
  
  for (const file of requiredFiles) {
    const filePath = path.join(unityPath, file);
    if (fs.existsSync(filePath)) {
      presentFiles.push(file);
    } else {
      missingFiles.push(file);
    }
  }
  
  return {
    total: requiredFiles.length,
    present: presentFiles.length,
    missing: missingFiles.length,
    presentFiles,
    missingFiles
  };
}

// Test 7: Security Configuration
function testSecurityConfiguration() {
  const securityPath = path.join(__dirname, 'src/core/security');
  
  if (!fs.existsSync(securityPath)) {
    throw new Error('security directory not found');
  }
  
  const requiredFiles = [
    'index.js',
    'mobile-game-security.js',
    'mfa.js',
    'rbac.js',
    'key-rotation.js',
    'https.js'
  ];
  
  const presentFiles = [];
  const missingFiles = [];
  
  for (const file of requiredFiles) {
    const filePath = path.join(securityPath, file);
    if (fs.existsSync(filePath)) {
      presentFiles.push(file);
    } else {
      missingFiles.push(file);
    }
  }
  
  return {
    total: requiredFiles.length,
    present: presentFiles.length,
    missing: missingFiles.length,
    presentFiles,
    missingFiles
  };
}

// Test 8: Monitoring Configuration
function testMonitoringConfiguration() {
  const monitoringPath = path.join(__dirname, 'monitoring');
  
  if (!fs.existsSync(monitoringPath)) {
    throw new Error('monitoring directory not found');
  }
  
  const requiredFiles = [
    'prometheus.yml',
    'grafana/datasources/prometheus.yml',
    'grafana/dashboards/game-dashboard.json'
  ];
  
  const presentFiles = [];
  const missingFiles = [];
  
  for (const file of requiredFiles) {
    const filePath = path.join(monitoringPath, file);
    if (fs.existsSync(filePath)) {
      presentFiles.push(file);
    } else {
      missingFiles.push(file);
    }
  }
  
  return {
    total: requiredFiles.length,
    present: presentFiles.length,
    missing: missingFiles.length,
    presentFiles,
    missingFiles
  };
}

// Test 9: CI/CD Configuration
function testCICDConfiguration() {
  const githubPath = path.join(__dirname, '.github/workflows');
  
  if (!fs.existsSync(githubPath)) {
    throw new Error('.github/workflows directory not found');
  }
  
  const workflowFiles = fs.readdirSync(githubPath).filter(file => file.endsWith('.yml'));
  
  if (workflowFiles.length === 0) {
    throw new Error('No GitHub Actions workflow files found');
  }
  
  return {
    workflowCount: workflowFiles.length,
    workflowFiles
  };
}

// Test 10: Environment File
function testEnvironmentFile() {
  const envPath = path.join(__dirname, '.env');
  const envExamplePath = path.join(__dirname, '.env.example');
  
  const hasEnv = fs.existsSync(envPath);
  const hasEnvExample = fs.existsSync(envExamplePath);
  
  if (!hasEnvExample) {
    throw new Error('.env.example file not found');
  }
  
  return {
    hasEnv,
    hasEnvExample,
    envExampleExists: hasEnvExample
  };
}

// Generate test report
function generateTestReport() {
  console.log('\n📊 Test Results Summary');
  console.log('======================');
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  console.log('\n📋 Detailed Results');
  console.log('==================');
  
  testResults.details.forEach(test => {
    const status = test.status === 'PASS' ? '✅' : '❌';
    console.log(`${status} ${test.name}`);
    if (test.status === 'FAIL') {
      console.log(`   Error: ${test.error}`);
    }
  });
  
  // Save results to file
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: (testResults.passed / testResults.total) * 100
    },
    details: testResults.details
  };
  
  fs.writeFileSync('api-test-results.json', JSON.stringify(report, null, 2));
  console.log('\n💾 Test results saved to api-test-results.json');
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Main test runner
function runAllTests() {
  console.log('🚀 Starting API and Secrets Test Suite');
  console.log('=====================================');
  
  // Run all tests
  runTest('Environment Variables', testEnvironmentVariables);
  runTest('Package.json Configuration', testPackageJson);
  runTest('TypeScript Configuration', testTypeScriptConfig);
  runTest('Docker Configuration', testDockerConfig);
  runTest('Source Code Structure', testSourceCodeStructure);
  runTest('Unity Integration', testUnityIntegration);
  runTest('Security Configuration', testSecurityConfiguration);
  runTest('Monitoring Configuration', testMonitoringConfiguration);
  runTest('CI/CD Configuration', testCICDConfiguration);
  runTest('Environment File', testEnvironmentFile);
  
  // Generate test report
  generateTestReport();
}

// Run the tests
runAllTests();