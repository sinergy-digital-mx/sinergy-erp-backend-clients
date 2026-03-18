import { AppDataSource } from '../data-source';

async function addPaymentsForeignKeys() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected\n');

    // First, check existing foreign keys
    const existingFKs = await AppDataSource.query(`
      SELECT CONSTRAINT_NAME
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'payments'
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    `);

    console.log('Existing foreign keys:', existingFKs);

    // Drop existing foreign keys if any
    for (const fk of existingFKs) {
      console.log(`Dropping foreign key: ${fk.CONSTRAINT_NAME}`);
      await AppDataSource.query(`
        ALTER TABLE payments DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}
      `);
    }

    // Check column types
    console.log('\n=== Checking column types ===');
    
    const paymentsColumns = await AppDataSource.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE, COLLATION_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'payments'
      AND COLUMN_NAME IN ('tenant_id', 'contract_id')
    `);
    console.log('payments columns:', paymentsColumns);

    const tenantsId = await AppDataSource.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE, COLLATION_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'rbac_tenants'
      AND COLUMN_NAME = 'id'
    `);
    console.log('rbac_tenants.id:', tenantsId);

    const contractsId = await AppDataSource.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE, COLLATION_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'contracts'
      AND COLUMN_NAME = 'id'
    `);
    console.log('contracts.id:', contractsId);

    // Check if collations match
    const tenantCollationMatch = paymentsColumns.find(c => c.COLUMN_NAME === 'tenant_id')?.COLLATION_NAME === tenantsId[0]?.COLLATION_NAME;
    const contractCollationMatch = paymentsColumns.find(c => c.COLUMN_NAME === 'contract_id')?.COLLATION_NAME === contractsId[0]?.COLLATION_NAME;

    console.log('\nCollation match - tenant_id:', tenantCollationMatch);
    console.log('Collation match - contract_id:', contractCollationMatch);

    // If collations don't match, fix them
    if (!tenantCollationMatch && tenantsId[0]) {
      console.log('\n⚠️  Fixing tenant_id collation...');
      await AppDataSource.query(`
        ALTER TABLE payments 
        MODIFY COLUMN tenant_id ${tenantsId[0].COLUMN_TYPE} 
        COLLATE ${tenantsId[0].COLLATION_NAME} NOT NULL
      `);
      console.log('✅ tenant_id collation fixed');
    }

    if (!contractCollationMatch && contractsId[0]) {
      console.log('\n⚠️  Fixing contract_id collation...');
      await AppDataSource.query(`
        ALTER TABLE payments 
        MODIFY COLUMN contract_id ${contractsId[0].COLUMN_TYPE} 
        COLLATE ${contractsId[0].COLLATION_NAME} NOT NULL
      `);
      console.log('✅ contract_id collation fixed');
    }

    // Now try to add foreign keys
    console.log('\n=== Adding foreign keys ===');
    
    try {
      await AppDataSource.query(`
        ALTER TABLE payments 
        ADD CONSTRAINT FK_payments_tenant_id 
        FOREIGN KEY (tenant_id) REFERENCES rbac_tenants(id) ON DELETE CASCADE
      `);
      console.log('✅ Added FK_payments_tenant_id');
    } catch (error: any) {
      console.error('❌ Failed to add FK_payments_tenant_id:', error.message);
    }

    try {
      await AppDataSource.query(`
        ALTER TABLE payments 
        ADD CONSTRAINT FK_payments_contract_id 
        FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE RESTRICT
      `);
      console.log('✅ Added FK_payments_contract_id');
    } catch (error: any) {
      console.error('❌ Failed to add FK_payments_contract_id:', error.message);
    }

    console.log('\n✅ Process completed');
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addPaymentsForeignKeys();
