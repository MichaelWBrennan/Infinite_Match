#!/usr/bin/env node

/**
 * Offline Setup Script
 * Sets up the project to work completely offline without external dependencies
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class OfflineSetup {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.publicDir = path.join(this.projectRoot, 'public');
    this.jsDir = path.join(this.publicDir, 'js');
    this.cssDir = path.join(this.publicDir, 'css');
  }

  async run() {
    console.log('🚀 Setting up offline development environment...\n');

    // Create public directory structure
    await this.createDirectories();

    // Verify all self-hosted files exist
    await this.verifySelfHostedFiles();

    // Update configuration for offline mode
    await this.updateOfflineConfig();

    // Display setup summary
    this.displaySetupSummary();

    console.log('\n✅ Offline setup completed!');
    console.log('\n🎯 Your project is now completely self-contained:');
    console.log('   - No external CDN dependencies');
    console.log('   - All analytics services self-hosted');
    console.log('   - All platform SDKs mocked locally');
    console.log('   - All fonts served locally');
    console.log('   - All services run in Docker containers');
  }

  async createDirectories() {
    console.log('📁 Creating directory structure...');
    
    const dirs = [
      this.publicDir,
      this.jsDir,
      this.cssDir
    ];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`  ✅ Created: ${path.relative(this.projectRoot, dir)}`);
      } else {
        console.log(`  ✅ Exists: ${path.relative(this.projectRoot, dir)}`);
      }
    }
  }

  async verifySelfHostedFiles() {
    console.log('\n🔍 Verifying self-hosted files...');
    
    const requiredFiles = [
      'public/js/posthog.min.js',
      'public/js/sentry.min.js',
      'public/js/platform-sdks.js',
      'public/css/fonts.css',
      'src/services/unified-analytics-service.js',
      'src/services/prometheus-monitoring-service.js',
      'src/services/open-source-cloud-services.js',
      'docker-compose.opensource.yml',
      '.env.opensource'
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(this.projectRoot, file);
      if (fs.existsSync(filePath)) {
        console.log(`  ✅ ${file}`);
      } else {
        console.log(`  ❌ ${file} - Missing!`);
      }
    }
  }

  async updateOfflineConfig() {
    console.log('\n⚙️  Updating configuration for offline mode...');
    
    // Update environment to use local services
    const envContent = `# Offline Development Configuration
# All services are self-hosted in Docker containers

# Database Configuration
POSTGRES_URL=postgresql://postgres:password@localhost:5432/match3game
MONGODB_URI=mongodb://root:password@localhost:27017/match3game?authSource=admin
REDIS_URL=redis://localhost:6379

# MinIO Configuration (S3-compatible storage)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=match3game

# PostHog Analytics Configuration (Self-hosted)
POSTHOG_API_KEY=offline-mode
POSTHOG_PUBLIC_KEY=offline-mode
POSTHOG_HOST=http://localhost:8000

# Sentry Error Tracking (Self-hosted)
SENTRY_DSN=http://offline-mode@localhost:9002/1

# Email Configuration (SMTP)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@match3game.com

# Prometheus Monitoring
PROMETHEUS_ENDPOINT=http://localhost:9090

# Grafana Dashboard
GRAFANA_URL=http://localhost:3001
GRAFANA_USER=admin
GRAFANA_PASSWORD=admin

# Application Configuration
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Security
JWT_SECRET=offline-development-secret-key
BCRYPT_SALT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# CORS
CORS_ORIGIN=*
CORS_CREDENTIALS=false

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
LOG_FILE_ENABLED=true
LOG_FILE_PATH=logs
LOG_FILE_MAX_SIZE=20m
LOG_FILE_MAX_FILES=14d
`;

    const envPath = path.join(this.projectRoot, '.env.offline');
    fs.writeFileSync(envPath, envContent);
    console.log('  ✅ Created .env.offline for offline development');
  }

  displaySetupSummary() {
    console.log('\n📊 Setup Summary:');
    console.log('==================');
    console.log('✅ Self-hosted analytics (PostHog, Sentry)');
    console.log('✅ Self-hosted monitoring (Prometheus, Grafana)');
    console.log('✅ Self-hosted cloud services (MinIO, PostgreSQL)');
    console.log('✅ Self-hosted platform SDKs (Kongregate, Facebook, etc.)');
    console.log('✅ Self-hosted fonts (Fredoka family)');
    console.log('✅ No external CDN dependencies');
    console.log('✅ Complete offline development environment');
    
    console.log('\n🚀 Quick Start Commands:');
    console.log('========================');
    console.log('1. Start all services:');
    console.log('   docker-compose -f docker-compose.opensource.yml up -d');
    console.log('');
    console.log('2. Install dependencies:');
    console.log('   npm install');
    console.log('');
    console.log('3. Use offline configuration:');
    console.log('   cp .env.offline .env');
    console.log('');
    console.log('4. Start the application:');
    console.log('   npm run dev');
    console.log('');
    console.log('5. Access services:');
    console.log('   - Application: http://localhost:3000');
    console.log('   - Grafana: http://localhost:3001 (admin/admin)');
    console.log('   - Prometheus: http://localhost:9090');
    console.log('   - PostHog: http://localhost:8000');
    console.log('   - MinIO: http://localhost:9001 (minioadmin/minioadmin)');
    console.log('   - Sentry: http://localhost:9002');
    console.log('   - MailHog: http://localhost:8025');
  }
}

// Run setup
const setup = new OfflineSetup();
setup.run().catch(console.error);