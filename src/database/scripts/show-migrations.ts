import 'reflect-metadata';
import 'dotenv/config';
import { AppDataSource } from '../data-source';

async function showMigrations() {
  try {
    console.log('🔄 Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    const executedMigrations = await AppDataSource.query(
      'SELECT * FROM migrations ORDER BY timestamp DESC',
    );

    console.log('📋 Executed Migrations:');
    if (executedMigrations.length === 0) {
      console.log('   No migrations have been executed yet');
    } else {
      executedMigrations.forEach((migration: any) => {
        const date = new Date(migration.timestamp);
        console.log(`   ✅ ${migration.name} (${date.toLocaleString()})`);
      });
    }

    console.log('\n📂 Available Migration Files:');
    const fs = require('fs');
    const path = require('path');
    const migrationsDir = path.join(__dirname, '../migrations');
    
    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir)
        .filter((file: string) => file.endsWith('.ts') || file.endsWith('.js'))
        .sort();
      
      if (files.length === 0) {
        console.log('   No migration files found');
      } else {
        files.forEach((file: string) => {
          const isExecuted = executedMigrations.some(
            (m: any) => m.name === file.replace(/\.(ts|js)$/, ''),
          );
          const status = isExecuted ? '✅' : '⏳';
          console.log(`   ${status} ${file}`);
        });
      }
    } else {
      console.log('   Migrations directory not found');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

showMigrations();
