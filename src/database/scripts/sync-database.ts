import { DataSource } from 'typeorm';
import { typeOrmOptions } from '../typeorm.options';

async function syncDatabase() {
  const dataSource = new DataSource(typeOrmOptions);
  
  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    console.log('\n🔄 Synchronizing database schema...');
    await dataSource.synchronize();
    console.log('✅ Database schema synchronized successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await dataSource.destroy();
  }
}

syncDatabase();