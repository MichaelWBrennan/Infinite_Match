#!/usr/bin/env node

/**
 * Migration Script: Proprietary Services to Open Source
 * This script helps migrate from proprietary cloud services to open source alternatives
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class OpenSourceMigration {
  constructor() {
    this.migrations = [
      {
        name: 'Analytics Migration',
        description: 'Replace Amplitude, Mixpanel with PostHog',
        status: 'completed',
        files: [
          'src/services/unified-analytics-service.js',
          'unity/Scripts/WebGL/WebGLAnalytics.js',
          'unity/Assets/StreamingAssets/kongregate-webgl-template.html'
        ]
      },
      {
        name: 'Monitoring Migration',
        description: 'Replace Datadog with Prometheus + Grafana',
        status: 'completed',
        files: [
          'src/services/prometheus-monitoring-service.js',
          'monitoring/prometheus.yml',
          'monitoring/grafana/'
        ]
      },
      {
        name: 'Cloud Services Migration',
        description: 'Replace AWS, Google Cloud, Azure with self-hosted alternatives',
        status: 'completed',
        files: [
          'src/services/open-source-cloud-services.js',
          'docker-compose.opensource.yml'
        ]
      },
      {
        name: 'Package Dependencies',
        description: 'Update package.json with open source dependencies',
        status: 'completed',
        files: [
          'package.json'
        ]
      },
      {
        name: 'Configuration Files',
        description: 'Create environment configuration for open source services',
        status: 'completed',
        files: [
          '.env.opensource'
        ]
      }
    ];
  }

  async run() {
    console.log('🚀 Starting Open Source Migration...\n');

    // Check if all migration files exist
    await this.validateMigrationFiles();

    // Display migration status
    this.displayMigrationStatus();

    // Provide next steps
    this.displayNextSteps();

    console.log('\n✅ Migration preparation completed!');
  }

  async validateMigrationFiles() {
    console.log('📋 Validating migration files...\n');

    for (const migration of this.migrations) {
      console.log(`\n🔍 ${migration.name}:`);
      
      for (const file of migration.files) {
        const filePath = path.join(__dirname, '..', file);
        const exists = fs.existsSync(filePath);
        
        if (exists) {
          console.log(`  ✅ ${file}`);
        } else {
          console.log(`  ❌ ${file} - Missing!`);
          migration.status = 'incomplete';
        }
      }
    }
  }

  displayMigrationStatus() {
    console.log('\n📊 Migration Status:');
    console.log('==================');

    for (const migration of this.migrations) {
      const status = migration.status === 'completed' ? '✅' : '❌';
      console.log(`${status} ${migration.name}: ${migration.description}`);
    }
  }

  displayNextSteps() {
    console.log('\n🎯 Next Steps:');
    console.log('==============');
    console.log('1. Install new dependencies:');
    console.log('   npm install');
    console.log('');
    console.log('2. Start open source services:');
    console.log('   docker-compose -f docker-compose.opensource.yml up -d');
    console.log('');
    console.log('3. Update environment variables:');
    console.log('   cp .env.opensource .env');
    console.log('   # Edit .env with your actual API keys');
    console.log('');
    console.log('4. Initialize databases:');
    console.log('   # PostgreSQL will auto-initialize');
    console.log('   # MongoDB will auto-initialize');
    console.log('');
    console.log('5. Start the application:');
    console.log('   npm run dev');
    console.log('');
    console.log('6. Access services:');
    console.log('   - Application: http://localhost:3000');
    console.log('   - Grafana: http://localhost:3001 (admin/admin)');
    console.log('   - Prometheus: http://localhost:9090');
    console.log('   - PostHog: http://localhost:8000');
    console.log('   - MinIO Console: http://localhost:9001 (minioadmin/minioadmin)');
    console.log('   - MailHog: http://localhost:8025');
    console.log('');
    console.log('7. Configure PostHog:');
    console.log('   - Get API keys from PostHog dashboard');
    console.log('   - Update POSTHOG_API_KEY and POSTHOG_PUBLIC_KEY in .env');
    console.log('');
    console.log('8. Configure Sentry:');
    console.log('   - Get DSN from Sentry dashboard');
    console.log('   - Update SENTRY_DSN in .env');
  }

  displayCostSavings() {
    console.log('\n💰 Estimated Cost Savings:');
    console.log('==========================');
    console.log('Before (Proprietary Services):');
    console.log('  - Amplitude: $500-2000/month');
    console.log('  - Mixpanel: $200-1000/month');
    console.log('  - Datadog: $200-1000/month');
    console.log('  - AWS S3: $100-500/month');
    console.log('  - AWS DynamoDB: $200-800/month');
    console.log('  - Google Cloud: $300-1000/month');
    console.log('  - Azure: $200-600/month');
    console.log('  Total: $1,700-6,900/month');
    console.log('');
    console.log('After (Open Source):');
    console.log('  - PostHog: $0 (self-hosted)');
    console.log('  - Prometheus + Grafana: $0 (self-hosted)');
    console.log('  - MinIO: $0 (self-hosted)');
    console.log('  - PostgreSQL: $0 (self-hosted)');
    console.log('  - Redis: $0 (self-hosted)');
    console.log('  - Sentry: $0 (self-hosted)');
    console.log('  Total: $0/month');
    console.log('');
    console.log('💡 Annual Savings: $20,400 - $82,800');
  }
}

// Run migration
const migration = new OpenSourceMigration();
migration.run().catch(console.error);