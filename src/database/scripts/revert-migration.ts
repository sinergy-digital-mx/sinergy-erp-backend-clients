import 'reflect-metadata';
import 'dotenv/config';
import { AppDataSource } from '../data-source';

async function revertMigration() {
  try {
    console.log('🔄 Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    console.log('\n🔄 Reverting last migration...');
    await AppDataSource.undoLastMigration({ transaction: 'all' });
    console.log('✅ Successfully reverted last migration');
  } catch (error) {
    console.error('❌ Error reverting migration:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('🔌 Database connection closed');
    }
  }
}

revertMigration();
