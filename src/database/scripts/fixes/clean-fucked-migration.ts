import { AppDataSource } from '../data-source';

async function cleanFuckedMigration() {
  try {
    console.log('🔄 Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    console.log('🔄 Removing the fucked migration from migrations table...');
    
    // Remove the problematic migration from migrations table
    await AppDataSource.query(`
      DELETE FROM migrations 
      WHERE name = 'RestoreContractPaymentsTable1772813100003'
    `);
    
    await AppDataSource.query(`
      DELETE FROM migrations 
      WHERE name = 'AddIsOverdueToPayments1771250000000'
    `);

    console.log('✅ Fucked migrations removed from database');
    console.log('🔄 Now the migration system is clean');

  } catch (error) {
    console.error('❌ Error cleaning migrations:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

cleanFuckedMigration();