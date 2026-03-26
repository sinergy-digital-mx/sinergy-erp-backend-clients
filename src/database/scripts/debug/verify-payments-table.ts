import { AppDataSource } from '../data-source';

async function verifyPaymentsTable() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected\n');

    // Check table structure
    const structure = await AppDataSource.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'payments'
      ORDER BY ORDINAL_POSITION
    `);

    console.log('=== PAYMENTS TABLE STRUCTURE ===');
    console.table(structure);

    // Check foreign keys
    const foreignKeys = await AppDataSource.query(`
      SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'payments'
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `);

    console.log('\n=== FOREIGN KEYS ===');
    console.table(foreignKeys);

    // Test a simple query
    const count = await AppDataSource.query('SELECT COUNT(*) as count FROM payments');
    console.log(`\n✅ Table is accessible. Current record count: ${count[0].count}`);

    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifyPaymentsTable();