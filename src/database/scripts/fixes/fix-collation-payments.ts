import { AppDataSource } from '../data-source';

async function fixCollationPayments() {
  try {
    console.log('🔄 Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    console.log('🔄 Dropping foreign keys first...');
    
    // Drop foreign keys first
    await AppDataSource.query(`
      ALTER TABLE payments 
      DROP FOREIGN KEY payments_ibfk_1
    `);

    console.log('🔄 Fixing collation for payments table...');
    
    // Change the collation of the payments table to match contracts
    await AppDataSource.query(`
      ALTER TABLE payments 
      CONVERT TO CHARACTER SET utf8mb4 
      COLLATE utf8mb4_unicode_ci
    `);

    console.log('🔄 Re-adding foreign key...');
    
    // Re-add the foreign key
    await AppDataSource.query(`
      ALTER TABLE payments 
      ADD CONSTRAINT FK_payments_tenant_id 
      FOREIGN KEY (tenant_id) REFERENCES rbac_tenants(id) ON DELETE CASCADE
    `);

    console.log('✅ Collation fixed for payments table');

  } catch (error) {
    console.error('❌ Error fixing collation:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

fixCollationPayments();