import { AppDataSource } from '../data-source';

async function checkPaymentsStructure() {
  try {
    console.log('🔄 Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    console.log('🔄 Checking payments table structure...');
    
    const columns = await AppDataSource.query(`
      DESCRIBE payments
    `);

    console.log('📋 Payments table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(not null)'} ${col.Default ? `default: ${col.Default}` : ''}`);
    });

    console.log('\n🔄 Checking sample data...');
    const sampleData = await AppDataSource.query(`
      SELECT * FROM contract_payments LIMIT 3
    `);

    console.log('📊 Sample payments data:');
    console.log(sampleData);

  } catch (error) {
    console.error('❌ Error checking structure:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

checkPaymentsStructure();