const mysql = require('mysql2/promise');
require('dotenv').config();

async function verifyDates() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  console.log('Checking payment dates...\n');

  // Get sample payments
  const [payments] = await connection.query(`
    SELECT payment_number, due_date, status
    FROM payments
    WHERE tenant_id = '54481b63-5516-458d-9bb3-d4e5cb028864'
    ORDER BY due_date
    LIMIT 12
  `);

  console.log('First 12 payments by due date:');
  console.table(payments.map(p => ({
    'Payment #': p.payment_number,
    'Due Date': p.due_date.toISOString().split('T')[0],
    'Day': p.due_date.getDate(),
    'Status': p.status
  })));

  // Check if all payments are on day 5
  const [allPayments] = await connection.query(`
    SELECT DAY(due_date) as day, COUNT(*) as count
    FROM payments
    WHERE tenant_id = '54481b63-5516-458d-9bb3-d4e5cb028864'
    GROUP BY DAY(due_date)
  `);

  console.log('\nPayments by day of month:');
  console.table(allPayments);

  // Total count
  const [total] = await connection.query(`
    SELECT COUNT(*) as total
    FROM payments
    WHERE tenant_id = '54481b63-5516-458d-9bb3-d4e5cb028864'
  `);

  console.log(`\nTotal payments: ${total[0].total}`);

  await connection.end();
}

verifyDates().catch(console.error);
