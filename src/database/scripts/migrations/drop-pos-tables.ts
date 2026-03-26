import 'reflect-metadata';
import 'dotenv/config';
import { AppDataSource } from '../data-source';

async function dropPosTables() {
  try {
    console.log('🔄 Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    console.log('\n🔄 Dropping POS tables...');
    
    // Disable foreign key checks temporarily
    await AppDataSource.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Drop tables in reverse order of dependencies
    const tables = [
      'pos_tables',
      'pos_payments',
      'cash_shifts',
      'pos_order_lines',
      'pos_orders'
    ];

    for (const table of tables) {
      try {
        await AppDataSource.query(`DROP TABLE IF EXISTS ${table}`);
        console.log(`✅ Dropped table: ${table}`);
      } catch (error) {
        console.log(`⚠️  Table ${table} does not exist or already dropped`);
      }
    }
    
    // Re-enable foreign key checks
    await AppDataSource.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('\n✅ All POS tables dropped successfully');
  } catch (error) {
    console.error('❌ Error dropping tables:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('🔌 Database connection closed');
    }
  }
}

dropPosTables();
