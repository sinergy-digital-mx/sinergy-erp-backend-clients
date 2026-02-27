require('dotenv').config();
const mysql = require('mysql2/promise');

async function recalculateBalance() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  try {
    // Get contract
    const [contracts] = await connection.query(
      "SELECT id, contract_number, total_price, down_payment FROM contracts WHERE contract_number = 'CONT-3-10'"
    );

    if (contracts.length === 0) {
      console.log('Contract not found');
      return;
    }

    const contract = contracts[0];
    console.log(`\nContract: ${contract.contract_number}`);
    console.log(`Total: $${contract.total_price}`);
    console.log(`Enganche: $${contract.down_payment}`);

    // Get all payments
    const [payments] = await connection.query(
      'SELECT status, amount, amount_paid FROM payments WHERE contract_id = ?',
      [contract.id]
    );

    console.log(`\nPayments: ${payments.length}`);
    
    let totalPaid = 0;
    payments.forEach(p => {
      const paid = Number(p.amount_paid) || 0;
      totalPaid += paid;
      console.log(`  ${p.status}: amount=${p.amount}, paid=${paid}`);
    });

    const remainingBalance = Number(contract.total_price) - Number(contract.down_payment) - totalPaid;

    console.log(`\nTotal Pagado: $${totalPaid.toFixed(2)}`);
    console.log(`Saldo Restante: $${remainingBalance.toFixed(2)}`);

    // Update contract
    await connection.query(
      'UPDATE contracts SET remaining_balance = ? WHERE id = ?',
      [Math.max(0, remainingBalance), contract.id]
    );

    console.log('\n✅ Balance actualizado');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

recalculateBalance();
