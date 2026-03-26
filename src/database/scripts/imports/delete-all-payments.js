const mysql = require('mysql2/promise');
require('dotenv').config();

async function deletePayments() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  console.log('Deleting all payments...');
  const [result] = await connection.query('DELETE FROM payments');
  console.log(`✅ Deleted ${result.affectedRows} payments`);

  await connection.end();
}

deletePayments().catch(console.error);
