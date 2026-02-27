require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixLastPayment() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  try {
    console.log('\n🔧 Ajustando último pago de CONT-3-10...\n');

    const [contracts] = await connection.query(
      "SELECT id, total_price, down_payment FROM contracts WHERE contract_number = 'CONT-3-10'"
    );

    const contract = contracts[0];
    const contractId = contract.id;
    const totalAfterDown = Number(contract.total_price) - Number(contract.down_payment);

    // Get all payments
    const [allPayments] = await connection.query(
      'SELECT SUM(amount) as total FROM payments WHERE contract_id = ?',
      [contractId]
    );

    const currentTotal = Number(allPayments[0].total);
    const difference = totalAfterDown - currentTotal;

    console.log(`💰 Total a pagar: $${totalAfterDown.toFixed(2)}`);
    console.log(`📊 Total actual de pagos: $${currentTotal.toFixed(2)}`);
    console.log(`❌ Diferencia: $${difference.toFixed(2)}`);

    if (Math.abs(difference) < 0.01) {
      console.log('\n✅ No hay diferencia significativa. Todo está correcto.');
      return;
    }

    // Get last payment
    const [lastPayment] = await connection.query(
      'SELECT id, payment_number, amount, amount_pending, status FROM payments WHERE contract_id = ? ORDER BY payment_number DESC LIMIT 1',
      [contractId]
    );

    const payment = lastPayment[0];
    const oldAmount = Number(payment.amount);
    const newAmount = oldAmount + difference;

    console.log(`\n🔄 Ajustando pago #${payment.payment_number}:`);
    console.log(`   Monto actual: $${oldAmount.toFixed(2)}`);
    console.log(`   Monto nuevo: $${newAmount.toFixed(2)}`);

    // Update last payment
    if (payment.status === 'pendiente' || payment.status === 'vencido') {
      await connection.query(
        'UPDATE payments SET amount = ?, amount_pending = ? WHERE id = ?',
        [newAmount.toFixed(2), newAmount.toFixed(2), payment.id]
      );
    } else if (payment.status === 'pagado') {
      await connection.query(
        'UPDATE payments SET amount = ?, amount_paid = ? WHERE id = ?',
        [newAmount.toFixed(2), newAmount.toFixed(2), payment.id]
      );
    }

    // Recalculate contract balance
    const [paidPayments] = await connection.query(
      'SELECT SUM(amount_paid) as total FROM payments WHERE contract_id = ? AND status IN ("pagado", "parcial")',
      [contractId]
    );

    const totalPaid = Number(paidPayments[0].total);
    const newBalance = totalAfterDown - totalPaid;

    await connection.query(
      'UPDATE contracts SET remaining_balance = ? WHERE id = ?',
      [newBalance.toFixed(2), contractId]
    );

    console.log(`\n✅ Ajuste completado!`);
    console.log(`📋 Nuevo saldo del contrato: $${newBalance.toFixed(2)}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

fixLastPayment();
