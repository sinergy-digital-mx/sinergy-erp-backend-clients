const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  console.log('=== rbac_tenants table ===');
  const [tenantColumns] = await connection.query(`
    SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = '${process.env.DB_NAME}'
    AND TABLE_NAME = 'rbac_tenants'
    AND COLUMN_NAME = 'id';
  `);
  console.table(tenantColumns);

  console.log('\n=== contracts table ===');
  const [contractColumns] = await connection.query(`
    SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = '${process.env.DB_NAME}'
    AND TABLE_NAME = 'contracts'
    AND COLUMN_NAME = 'id';
  `);
  console.table(contractColumns);

  await connection.end();
}

checkTable().catch(console.error);
