require('dotenv').config();
const mysql = require('mysql2/promise');

async function adjustPaidAmounts() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  try {
    console.log('\n🔄 Ajustando amount_paid de pagos completados...\n');
    console.log('='.repeat(80));

    // Get all paid payments where amount_paid != amount
    const [payments] = await connection.query(`
      SELECT p.id, p.payment_number, p.amount, p.amount_paid, c.contract_number
      FROM payments p
      JOIN contracts c ON c.id = p.contract_id
      WHERE p.status = 'pagado' 
      AND p.amount != p.amount_paid
      ORDER BY c.contract_number, p.payment_number
    `);

    if (payments.length === 0) {
      console.log('✅ No hay pagos que ajustar. Todos los amount_paid coinciden con amount.');
      return;
    }

    console.log(`📦 Encontrados ${payments.length} pagos a ajustar:\n`);

    let totalDifference = 0;
    const contractUpdates = {};

    for (const payment of payments) {
      const oldPaid = Number(payment.amount_paid);
      const newPaid = Number(payment.amount);
      const difference = newPaid - oldPaid;
      totalDifference += difference;

      console.log(`${payment.contract_number} - Pago #${payment.payment_number}: $${oldPaid.toFixed(2)} → $${newPaid.toFixed(2)} (diff: $${difference.toFixed(2)})`);

      // Update amount_paid to match amount
      await connection.query(
        'UPDATE payments SET amount_paid = amount WHERE id = ?',
        [payment.id]
      );

      // Track contracts that need balance update
      if (!contractUpdates[payment.contract_number]) {
        contractUpdates[payment.contract_number] = 0;
      }
      contractUpdates[payment.contract_number] += difference;
    }

    console.log('\n' + '='.repeat(80));
    console.log(`✅ ${payments.length} pagos ajustados`);
    console.log(`💰 Diferencia total: $${totalDifference.toFixed(2)}`);

    // Update contract balances
    console.log('\n🔄 Actualizando balances de contratos...\n');

    for (const [contractNumber, difference] of Object.entries(contractUpdates)) {
      const [contracts] = await connection.query(
        'SELECT id, remaining_balance FROM contracts WHERE contract_number = ?',
        [contractNumber]
      );

      if (contracts.length > 0) {
        const contract = contracts[0];
        const oldBalance = Number(contract.remaining_balance);
        const newBalance = Math.max(0, oldBalance - difference);

        await connection.query(
          'UPDATE contracts SET remaining_balance = ? WHERE id = ?',
          [newBalance.toFixed(2), contract.id]
        );

        console.log(`${contractNumber}: Balance $${oldBalance.toFixed(2)} → $${newBalance.toFixed(2)} (reducido $${difference.toFixed(2)})`);
      }
    }

    console.log('\n✅ Ajuste completado!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

adjustPaidAmounts();
