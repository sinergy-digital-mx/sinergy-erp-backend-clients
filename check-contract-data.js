const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkContracts() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  const [contracts] = await connection.query(`
    SELECT 
      c.contract_number,
      p.code as property_code,
      c.down_payment,
      c.monthly_payment,
      c.payment_months,
      c.total_price,
      c.remaining_balance
    FROM contracts c
    INNER JOIN properties p ON c.property_id = p.id
    WHERE c.tenant_id = '54481b63-5516-458d-9bb3-d4e5cb028864'
    ORDER BY p.code
    LIMIT 10
  `);

  console.log('Sample contracts:');
  console.table(contracts);

  await connection.end();
}

checkContracts().catch(console.error);
