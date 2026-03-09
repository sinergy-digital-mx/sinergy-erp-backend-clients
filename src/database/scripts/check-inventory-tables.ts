import 'reflect-metadata';
import 'dotenv/config';
import { AppDataSource } from '../data-source';

async function checkTables() {
  try {
    console.log('🔄 Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    const tables = ['purchase_orders', 'inventory_items', 'inventory_movements', 'stock_reservations'];
    
    for (const table of tables) {
      const result = await AppDataSource.query(
        `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = ?`,
        [process.env.DB_NAME, table]
      );
      
      const exists = result[0].count > 0;
      console.log(`${exists ? '✅' : '❌'} ${table}: ${exists ? 'EXISTS' : 'DOES NOT EXIST'}`);
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

checkTables();
