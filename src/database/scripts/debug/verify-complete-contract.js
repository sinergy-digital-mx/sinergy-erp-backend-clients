const mysql = require('mysql2/promise');
require('dotenv').config();

async function verifyContract() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  // Get Francisco Javier Gonzalez Prado contract (LOT-3-01)
  const [contracts] = await connection.query(`
    SELECT c.*, p.code as property_code, cu.name, cu.lastname
    FROM contracts c
    INNER JOIN properties p ON c.property_id COLLATE utf8mb4_unicode_ci = p.id COLLATE utf8mb4_unicode_ci
    INNER JOIN customers cu ON c.customer_id = cu.id
    WHERE p.code = 'LOT-3-01'
  `);

  if (contracts.length === 0) {
    console.log('Contract not found');
    await connection.end();
    return;
  }

  const contract = contracts[0];
  console.log('\n=== CONTRACT DETAILS ===');
  console.log(`Customer: ${contract.name} ${contract.lastname}`);
  console.log(`Property: ${contract.property_code}`);
  console.log(`Contract Number: ${contract.contract_number}`);
  console.log(`Total Price: $${parseFloat(contract.total_price).toFixed(2)}`);
  console.log(`Down Payment: $${parseFloat(contract.down_payment).toFixed(2)}`);
  console.log(`Monthly Payment: $${parseFloat(contract.monthly_payment).toFixed(2)}`);
  console.log(`Payment Months: ${contract.payment_months}`);
  console.log(`Remaining Balance: $${parseFloat(contract.remaining_balance).toFixed(2)}`);
  console.log(`Interest Rate: ${parseFloat(contract.interest_rate || 0) * 100}%`);
  console.log(`Payment Due Day: ${contract.payment_due_day} days`);

  // Get payment stats
  const [stats] = await connection.query(`
    SELECT 
      COUNT(*) as total_payments,
      SUM(CASE WHEN status = 'pagado' THEN 1 ELSE 0 END) as paid_count,
      SUM(CASE WHEN status = 'pendiente' THEN 1 ELSE 0 END) as pending_count,
      SUM(CASE WHEN status = 'pagado' THEN amount ELSE 0 END) as total_paid
    FROM payments
    WHERE contract_id = ?
  `, [contract.id]);

  console.log('\n=== PAYMENT STATS ===');
  console.log(`Total Payments: ${stats[0].total_payments}`);
  console.log(`Paid: ${stats[0].paid_count}`);
  console.log(`Pending: ${stats[0].pending_count}`);
  console.log(`Total Paid: $${parseFloat(stats[0].total_paid).toFixed(2)}`);

  // Get first 5 payments
  const [payments] = await connection.query(`
    SELECT payment_number, amount, due_date, paid_date, status
    FROM payments
    WHERE contract_id = ?
    ORDER BY payment_number
    LIMIT 5
  `, [contract.id]);

  console.log('\n=== FIRST 5 PAYMENTS ===');
  console.table(payments.map(p => ({
    '#': p.payment_number,
    'Amount': `$${parseFloat(p.amount).toFixed(2)}`,
    'Due Date': p.due_date.toISOString().split('T')[0],
    'Paid Date': p.paid_date ? p.paid_date.toISOString().split('T')[0] : '-',
    'Status': p.status
  })));

  // Verify calculation
  const expectedRemaining = parseFloat(contract.total_price) - parseFloat(contract.down_payment) - parseFloat(stats[0].total_paid);
  console.log('\n=== VERIFICATION ===');
  console.log(`Total Price: $${parseFloat(contract.total_price).toFixed(2)}`);
  console.log(`- Down Payment: $${parseFloat(contract.down_payment).toFixed(2)}`);
  console.log(`- Total Paid: $${parseFloat(stats[0].total_paid).toFixed(2)}`);
  console.log(`= Expected Remaining: $${expectedRemaining.toFixed(2)}`);
  console.log(`Actual Remaining: $${parseFloat(contract.remaining_balance).toFixed(2)}`);
  console.log(`Match: ${Math.abs(expectedRemaining - parseFloat(contract.remaining_balance)) < 0.01 ? '✅ YES' : '❌ NO'}`);

  await connection.end();
}

verifyContract().catch(console.error);
