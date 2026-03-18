import { AppDataSource } from '../data-source';

async function checkColumnTypes() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected\n');

    // Check rbac_tenants.id type
    const tenantsIdType = await AppDataSource.query(`
      SELECT COLUMN_TYPE, CHARACTER_SET_NAME, COLLATION_NAME, DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'rbac_tenants'
      AND COLUMN_NAME = 'id'
    `);

    console.log('=== rbac_tenants.id ===');
    console.log(tenantsIdType[0]);

    // Check contracts.id type
    const contractsIdType = await AppDataSource.query(`
      SELECT COLUMN_TYPE, CHARACTER_SET_NAME, COLLATION_NAME, DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'contracts'
      AND COLUMN_NAME = 'id'
    `);

    console.log('\n=== contracts.id ===');
    console.log(contractsIdType[0]);

    // Check if payments table exists and show its structure
    const paymentsExists = await AppDataSource.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'payments'
    `);

    if (paymentsExists[0].count > 0) {
      console.log('\n=== payments table structure ===');
      const paymentsStructure = await AppDataSource.query(`
        SELECT COLUMN_NAME, COLUMN_TYPE, CHARACTER_SET_NAME, COLLATION_NAME, DATA_TYPE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'payments'
        ORDER BY ORDINAL_POSITION
      `);
      console.table(paymentsStructure);
    } else {
      console.log('\n⚠️  payments table does not exist');
    }

    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkColumnTypes();
