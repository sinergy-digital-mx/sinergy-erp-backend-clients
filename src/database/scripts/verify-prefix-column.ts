import 'reflect-metadata';
import 'dotenv/config';
import { AppDataSource } from '../data-source';

async function verifyPrefixColumn() {
  try {
    console.log('🔄 Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    console.log('\n🔍 Checking warehouses table structure...');
    const result = await AppDataSource.query('DESCRIBE warehouses');
    
    console.log('\nWarehouses table columns:');
    console.table(result);

    const prefixColumn = result.find((col: any) => col.Field === 'prefix');
    
    if (prefixColumn) {
      console.log('\n✅ Prefix column found!');
      console.log('Column details:', prefixColumn);
    } else {
      console.log('\n❌ Prefix column not found!');
    }

    console.log('\n🔍 Checking indexes on warehouses table...');
    const indexes = await AppDataSource.query('SHOW INDEX FROM warehouses');
    const prefixIndex = indexes.find((idx: any) => idx.Key_name === 'idx_prefix');
    
    if (prefixIndex) {
      console.log('✅ Index idx_prefix found!');
      console.log('Index details:', prefixIndex);
    } else {
      console.log('❌ Index idx_prefix not found!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('\n🔌 Database connection closed');
    }
  }
}

verifyPrefixColumn();
