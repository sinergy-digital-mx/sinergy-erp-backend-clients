const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDates() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  const [payments] = await connection.query(`
    SELECT payment_number, due_date, DAY(due_date) as day_of_month
    FROM payments
    WHERE tenant_id = '54481b63-5516-458d-9bb3-d4e5cb028864'
    ORDER BY due_date
    LIMIT 20
  `);

  console.log('Raw dates from database:');
  payments.forEach(p => {
    console.log(`Payment ${p.payment_number}: ${p.due_date} (Day: ${p.day_of_month})`);
  });

  await connection.end();
}

checkDates().catch(console.error);
