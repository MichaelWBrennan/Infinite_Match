#!/usr/bin/env node

/**
 * Database Migration Automation System
 * Handles automatic database migrations and schema updates
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DatabaseMigration {
  constructor() {
    this.migrationsDir = path.join(__dirname, '..', 'migrations');
    this.backupDir = path.join(__dirname, '..', 'backups', 'database');
    this.config = {
      database: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        name: process.env.DB_NAME || 'evergreen_match3',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
      },
      backup: {
        enabled: true,
        retention: 30, // days
        compression: true,
      },
      rollback: {
        enabled: true,
        maxSteps: 5,
      },
    };

    this.migrationHistory = [];
    this.loadMigrationHistory();
  }

  async initialize() {
    // Create migrations directory
    if (!fs.existsSync(this.migrationsDir)) {
      fs.mkdirSync(this.migrationsDir, { recursive: true });
    }

    // Create backup directory
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }

    console.log('🗄️ Database Migration System initialized');
  }

  async createMigration(name, description) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const migrationName = `${timestamp}_${name}`;
    const migrationDir = path.join(this.migrationsDir, migrationName);

    try {
      fs.mkdirSync(migrationDir, { recursive: true });

      // Create migration files
      const upMigration = `-- Migration: ${name}
-- Description: ${description}
-- Created: ${new Date().toISOString()}

-- Add your migration SQL here
-- Example:
-- CREATE TABLE IF NOT EXISTS new_table (
--     id SERIAL PRIMARY KEY,
--     name VARCHAR(255) NOT NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- ALTER TABLE existing_table ADD COLUMN new_column VARCHAR(255);

-- INSERT INTO new_table (name) VALUES ('migration_test');
`;

      const downMigration = `-- Rollback Migration: ${name}
-- Description: ${description}
-- Created: ${new Date().toISOString()}

-- Add your rollback SQL here
-- Example:
-- DROP TABLE IF EXISTS new_table;

-- ALTER TABLE existing_table DROP COLUMN IF EXISTS new_column;

-- DELETE FROM new_table WHERE name = 'migration_test';
`;

      fs.writeFileSync(path.join(migrationDir, 'up.sql'), upMigration);
      fs.writeFileSync(path.join(migrationDir, 'down.sql'), downMigration);

      // Create migration metadata
      const metadata = {
        name: migrationName,
        description: description,
        created: new Date().toISOString(),
        status: 'pending',
        checksum: this.calculateChecksum(upMigration + downMigration),
      };

      fs.writeFileSync(
        path.join(migrationDir, 'metadata.json'),
        JSON.stringify(metadata, null, 2)
      );

      console.log(`✅ Migration created: ${migrationName}`);
      console.log(`   Directory: ${migrationDir}`);
      console.log('   Files: up.sql, down.sql, metadata.json');

      return migrationName;
    } catch (error) {
      console.error(`❌ Failed to create migration: ${error.message}`);
      throw error;
    }
  }

  async runMigrations() {
    console.log('🚀 Running database migrations...');

    try {
      // Create backup before migration
      if (this.config.backup.enabled) {
        await this.createBackup('pre_migration');
      }

      // Get pending migrations
      const pendingMigrations = await this.getPendingMigrations();

      if (pendingMigrations.length === 0) {
        console.log('✅ No pending migrations');
        return;
      }

      console.log(`📋 Found ${pendingMigrations.length} pending migrations`);

      // Run each migration
      for (const migration of pendingMigrations) {
        await this.runMigration(migration);
      }

      console.log('✅ All migrations completed successfully');
    } catch (error) {
      console.error(`❌ Migration failed: ${error.message}`);

      // Attempt rollback
      if (this.config.rollback.enabled) {
        console.log('🔄 Attempting rollback...');
        await this.rollbackMigrations(1);
      }

      throw error;
    }
  }

  async runMigration(migration) {
    console.log(`🔄 Running migration: ${migration.name}`);

    try {
      const upSqlPath = path.join(this.migrationsDir, migration.name, 'up.sql');
      const upSql = fs.readFileSync(upSqlPath, 'utf-8');

      // Execute migration SQL
      await this.executeSql(upSql);

      // Update migration status
      migration.status = 'completed';
      migration.completed = new Date().toISOString();

      // Save migration history
      this.migrationHistory.push(migration);
      await this.saveMigrationHistory();

      console.log(`✅ Migration completed: ${migration.name}`);
    } catch (error) {
      console.error(`❌ Migration failed: ${migration.name}`);
      console.error(`   Error: ${error.message}`);

      migration.status = 'failed';
      migration.error = error.message;
      migration.failed = new Date().toISOString();

      await this.saveMigrationHistory();
      throw error;
    }
  }

  async rollbackMigrations(steps = 1) {
    console.log(`🔄 Rolling back ${steps} migration(s)...`);

    try {
      // Get completed migrations (most recent first)
      const completedMigrations = this.migrationHistory
        .filter((m) => m.status === 'completed')
        .sort((a, b) => new Date(b.completed) - new Date(a.completed))
        .slice(0, steps);

      if (completedMigrations.length === 0) {
        console.log('⚠️ No completed migrations to rollback');
        return;
      }

      console.log(`📋 Rolling back ${completedMigrations.length} migration(s)`);

      // Rollback each migration
      for (const migration of completedMigrations) {
        await this.rollbackMigration(migration);
      }

      console.log('✅ Rollback completed successfully');
    } catch (error) {
      console.error(`❌ Rollback failed: ${error.message}`);
      throw error;
    }
  }

  async rollbackMigration(migration) {
    console.log(`🔄 Rolling back migration: ${migration.name}`);

    try {
      const downSqlPath = path.join(
        this.migrationsDir,
        migration.name,
        'down.sql'
      );
      const downSql = fs.readFileSync(downSqlPath, 'utf-8');

      // Execute rollback SQL
      await this.executeSql(downSql);

      // Update migration status
      migration.status = 'rolled_back';
      migration.rolledBack = new Date().toISOString();

      // Save migration history
      await this.saveMigrationHistory();

      console.log(`✅ Migration rolled back: ${migration.name}`);
    } catch (error) {
      console.error(`❌ Rollback failed: ${migration.name}`);
      console.error(`   Error: ${error.message}`);
      throw error;
    }
  }

  async getPendingMigrations() {
    const migrations = [];

    try {
      const migrationDirs = fs
        .readdirSync(this.migrationsDir)
        .filter((name) =>
          fs.statSync(path.join(this.migrationsDir, name)).isDirectory()
        )
        .sort();

      for (const dirName of migrationDirs) {
        const metadataPath = path.join(
          this.migrationsDir,
          dirName,
          'metadata.json'
        );

        if (fs.existsSync(metadataPath)) {
          const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

          // Check if migration is not completed
          const isCompleted = this.migrationHistory.some(
            (m) => m.name === metadata.name && m.status === 'completed'
          );

          if (!isCompleted) {
            migrations.push(metadata);
          }
        }
      }
    } catch (error) {
      console.error(`❌ Failed to get pending migrations: ${error.message}`);
    }

    return migrations;
  }

  async createBackup(type = 'manual') {
    if (!this.config.backup.enabled) {
      return;
    }

    console.log(`💾 Creating database backup (${type})...`);

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `${type}_${timestamp}`;
      const backupPath = path.join(this.backupDir, backupName);

      fs.mkdirSync(backupPath, { recursive: true });

      // Create backup using pg_dump (PostgreSQL)
      const backupFile = path.join(backupPath, 'database.sql');
      const command = `pg_dump -h ${this.config.database.host} -p ${this.config.database.port} -U ${this.config.database.user} -d ${this.config.database.name} > ${backupFile}`;

      // In a real implementation, you would execute this command
      console.log(`   Command: ${command}`);

      // Create backup metadata
      const metadata = {
        name: backupName,
        type: type,
        created: new Date().toISOString(),
        database: this.config.database.name,
        size: '0 MB', // Would be calculated
        compressed: this.config.backup.compression,
      };

      fs.writeFileSync(
        path.join(backupPath, 'metadata.json'),
        JSON.stringify(metadata, null, 2)
      );

      console.log(`✅ Backup created: ${backupName}`);

      // Clean up old backups
      await this.cleanupOldBackups();
    } catch (error) {
      console.error(`❌ Backup creation failed: ${error.message}`);
      throw error;
    }
  }

  async cleanupOldBackups() {
    try {
      const backups = fs
        .readdirSync(this.backupDir)
        .filter((name) =>
          fs.statSync(path.join(this.backupDir, name)).isDirectory()
        )
        .sort()
        .reverse();

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.backup.retention);

      for (const backup of backups) {
        const backupPath = path.join(this.backupDir, backup);
        const stats = fs.statSync(backupPath);

        if (stats.mtime < cutoffDate) {
          fs.rmSync(backupPath, { recursive: true });
          console.log(`🗑️ Cleaned up old backup: ${backup}`);
        }
      }
    } catch (error) {
      console.error(`❌ Backup cleanup failed: ${error.message}`);
    }
  }

  async executeSql(sql) {
    // In a real implementation, you would execute SQL against the database
    console.log('📝 Executing SQL:');
    console.log(sql);

    // Simulate SQL execution
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log('✅ SQL executed successfully');
  }

  async validateMigration(migrationName) {
    console.log(`🔍 Validating migration: ${migrationName}`);

    try {
      const migrationDir = path.join(this.migrationsDir, migrationName);
      const upSqlPath = path.join(migrationDir, 'up.sql');
      const downSqlPath = path.join(migrationDir, 'down.sql');
      const metadataPath = path.join(migrationDir, 'metadata.json');

      // Check if all required files exist
      if (!fs.existsSync(upSqlPath)) {
        throw new Error('up.sql file missing');
      }

      if (!fs.existsSync(downSqlPath)) {
        throw new Error('down.sql file missing');
      }

      if (!fs.existsSync(metadataPath)) {
        throw new Error('metadata.json file missing');
      }

      // Validate SQL syntax (basic check)
      const upSql = fs.readFileSync(upSqlPath, 'utf-8');
      const downSql = fs.readFileSync(downSqlPath, 'utf-8');

      if (upSql.trim() === '') {
        throw new Error('up.sql is empty');
      }

      if (downSql.trim() === '') {
        throw new Error('down.sql is empty');
      }

      // Validate metadata
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

      if (!metadata.name || !metadata.description) {
        throw new Error('Invalid metadata');
      }

      console.log(`✅ Migration validation passed: ${migrationName}`);
      return true;
    } catch (error) {
      console.error(`❌ Migration validation failed: ${migrationName}`);
      console.error(`   Error: ${error.message}`);
      return false;
    }
  }

  async getMigrationStatus() {
    const status = {
      total: 0,
      completed: 0,
      pending: 0,
      failed: 0,
      rolled_back: 0,
    };

    // Count migrations in history
    for (const migration of this.migrationHistory) {
      status.total++;
      status[migration.status]++;
    }

    // Count pending migrations
    const pendingMigrations = await this.getPendingMigrations();
    status.pending = pendingMigrations.length;

    return status;
  }

  loadMigrationHistory() {
    try {
      const historyPath = path.join(__dirname, '..', 'migration-history.json');

      if (fs.existsSync(historyPath)) {
        this.migrationHistory = JSON.parse(
          fs.readFileSync(historyPath, 'utf-8')
        );
      }
    } catch (error) {
      console.error(`❌ Failed to load migration history: ${error.message}`);
      this.migrationHistory = [];
    }
  }

  async saveMigrationHistory() {
    try {
      const historyPath = path.join(__dirname, '..', 'migration-history.json');
      fs.writeFileSync(
        historyPath,
        JSON.stringify(this.migrationHistory, null, 2)
      );
    } catch (error) {
      console.error(`❌ Failed to save migration history: ${error.message}`);
    }
  }

  calculateChecksum(content) {
    // Simple checksum calculation
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  async generateMigrationReport() {
    const status = await this.getMigrationStatus();
    const report = {
      timestamp: new Date().toISOString(),
      status: status,
      migrations: this.migrationHistory,
      config: this.config,
    };

    const reportPath = path.join(__dirname, '..', 'migration-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`📊 Migration report generated: ${reportPath}`);
    return report;
  }
}

// Main execution
async function main() {
  const migration = new DatabaseMigration();
  await migration.initialize();

  // Example usage
  console.log('🗄️ Database Migration System');
  console.log('Available commands:');
  console.log('  create <name> <description> - Create a new migration');
  console.log('  run - Run pending migrations');
  console.log('  rollback [steps] - Rollback migrations');
  console.log('  status - Show migration status');
  console.log('  validate <name> - Validate a migration');
  console.log('  backup - Create a backup');
  console.log('  report - Generate migration report');

  // Example: Create a test migration
  if (process.argv[2] === 'create') {
    const name = process.argv[3] || 'test_migration';
    const description = process.argv[4] || 'Test migration';
    await migration.createMigration(name, description);
  } else if (process.argv[2] === 'run') {
    await migration.runMigrations();
  } else if (process.argv[2] === 'status') {
    const status = await migration.getMigrationStatus();
    console.log('📊 Migration Status:', status);
  } else if (process.argv[2] === 'backup') {
    await migration.createBackup();
  } else if (process.argv[2] === 'report') {
    await migration.generateMigrationReport();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default DatabaseMigration;
