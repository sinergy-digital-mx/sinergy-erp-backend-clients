const mysql = require('mysql2/promise');
require('dotenv').config();

async function recalculateBalances() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  console.log('Recalculating remaining balances...\n');

  // Get all contracts with payments
  const [contracts] = await connection.query(`
    SELECT DISTINCT c.id, c.contract_number, c.total_price, c.down_payment
    FROM contracts c
    INNER JOIN payments p ON c.id COLLATE utf8mb4_unicode_ci = p.contract_id COLLATE utf8mb4_unicode_ci
    WHERE c.tenant_id = '54481b63-5516-458d-9bb3-d4e5cb028864'
  `);

  console.log(`Found ${contracts.length} contracts with payments\n`);

  for (const contract of contracts) {
    // Calculate total paid
    const [paidPayments] = await connection.query(`
      SELECT SUM(amount) as total_paid
      FROM payments
      WHERE contract_id = ? AND status = 'pagado'
    `, [contract.id]);

    const totalPaid = parseFloat(paidPayments[0].total_paid || 0);
    const remainingBalance = parseFloat(contract.total_price) - parseFloat(contract.down_payment) - totalPaid;

    // Update contract
    await connection.query(`
      UPDATE contracts
      SET remaining_balance = ?
      WHERE id = ?
    `, [Math.max(0, remainingBalance), contract.id]);

    console.log(`✅ ${contract.contract_number}: Total: $${contract.total_price}, Enganche: $${contract.down_payment}, Pagado: $${totalPaid.toFixed(2)}, Restante: $${remainingBalance.toFixed(2)}`);
  }

  console.log('\n✅ All balances recalculated');

  await connection.end();
}

recalculateBalances().catch(console.error);
