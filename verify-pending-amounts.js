require('dotenv').config();
const mysql = require('mysql2/promise');

async function verifyAmounts() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  try {
    const [contracts] = await connection.query(
      "SELECT id FROM contracts WHERE contract_number = 'CONT-3-10'"
    );

    const contractId = contracts[0].id;

    // Get all pending payments
    const [pendingPayments] = await connection.query(
      'SELECT payment_number, amount, amount_pending, status FROM payments WHERE contract_id = ? AND (status = "pendiente" OR status = "vencido") ORDER BY payment_number',
      [contractId]
    );

    console.log('\n📊 PAGOS PENDIENTES:');
    console.log('='.repeat(80));
    
    let totalPending = 0;
    pendingPayments.forEach(p => {
      const amount = Number(p.amount);
      totalPending += amount;
      console.log(`Pago #${p.payment_number}: $${amount.toFixed(2)}`);
    });

    console.log('='.repeat(80));
    console.log(`Total de ${pendingPayments.length} pagos pendientes: $${totalPending.toFixed(2)}`);

    // Get partial payment
    const [partialPayments] = await connection.query(
      'SELECT payment_number, amount, amount_paid, amount_pending FROM payments WHERE contract_id = ? AND status = "parcial"',
      [contractId]
    );

    if (partialPayments.length > 0) {
      const partial = partialPayments[0];
      console.log(`\n⚠️  PAGO PARCIAL #${partial.payment_number}:`);
      console.log(`   Amount: $${Number(partial.amount).toFixed(2)}`);
      console.log(`   Paid: $${Number(partial.amount_paid).toFixed(2)}`);
      console.log(`   Pending: $${Number(partial.amount_pending).toFixed(2)}`);
      
      const totalWithPartial = totalPending + Number(partial.amount_pending);
      console.log(`\n💰 TOTAL PENDIENTE (con parcial): $${totalWithPartial.toFixed(2)}`);
    }

    // Get contract balance
    const [contractData] = await connection.query(
      'SELECT remaining_balance FROM contracts WHERE id = ?',
      [contractId]
    );

    console.log(`\n📋 SALDO EN CONTRATO: $${Number(contractData[0].remaining_balance).toFixed(2)}`);
    
    const difference = Number(contractData[0].remaining_balance) - (totalPending + (partialPayments.length > 0 ? Number(partialPayments[0].amount_pending) : 0));
    console.log(`\n❌ DIFERENCIA: $${difference.toFixed(2)}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

verifyAmounts();
