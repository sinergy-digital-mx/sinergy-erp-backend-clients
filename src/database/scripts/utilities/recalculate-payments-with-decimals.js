require('dotenv').config();
const mysql = require('mysql2/promise');

async function recalculatePayments() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  try {
    // Get specific contract
    const [contracts] = await connection.query(
      "SELECT id, contract_number, total_price, down_payment, payment_months FROM contracts WHERE contract_number = 'CONT-3-10'"
    );

    if (contracts.length === 0) {
      console.log('❌ No contracts found');
      return;
    }

    console.log(`\n🔄 Processing CONT-3-09...\n`);
    console.log('='.repeat(80));

    for (const contract of contracts) {
      const totalPrice = Number(contract.total_price);
      const downPayment = Number(contract.down_payment);
      const paymentMonths = Number(contract.payment_months);
      
      // Calcular el monto mensual EXACTO con decimales
      const remainingAfterDownPayment = totalPrice - downPayment;
      const exactMonthlyPayment = remainingAfterDownPayment / paymentMonths;

      console.log(`\n📋 Contract: ${contract.contract_number}`);
      console.log(`💰 Total: $${totalPrice.toFixed(2)} | Enganche: $${downPayment.toFixed(2)} | Remaining: $${remainingAfterDownPayment.toFixed(2)}`);
      console.log(`📅 Months: ${paymentMonths} | Monthly: $${exactMonthlyPayment.toFixed(2)}`);

      // Get all payments
      const [payments] = await connection.query(
        'SELECT id, payment_number, amount, amount_paid, amount_pending, status FROM payments WHERE contract_id = ? ORDER BY payment_number',
        [contract.id]
      );

      let updatedCount = 0;
      let totalOldAmount = 0;
      let totalNewAmount = 0;

      for (const payment of payments) {
        const oldAmount = Number(payment.amount);
        const newAmount = exactMonthlyPayment;
        
        totalOldAmount += oldAmount;
        totalNewAmount += newAmount;

        // Solo actualizar si el pago NO está pagado completamente
        if (payment.status === 'pendiente' || payment.status === 'vencido') {
          await connection.query(
            'UPDATE payments SET amount = ?, amount_pending = ? WHERE id = ?',
            [newAmount.toFixed(2), newAmount.toFixed(2), payment.id]
          );
          updatedCount++;
        } else if (payment.status === 'parcial') {
          const amountPaid = Number(payment.amount_paid);
          const newPending = newAmount - amountPaid;
          await connection.query(
            'UPDATE payments SET amount = ?, amount_pending = ? WHERE id = ?',
            [newAmount.toFixed(2), newPending.toFixed(2), payment.id]
          );
          updatedCount++;
        } else if (payment.status === 'pagado') {
          // Para pagos completados, actualizar tanto amount como amount_paid
          await connection.query(
            'UPDATE payments SET amount = ?, amount_paid = ? WHERE id = ?',
            [newAmount.toFixed(2), newAmount.toFixed(2), payment.id]
          );
          updatedCount++;
        }
      }

      // Verificar si hay diferencia de redondeo y ajustar el último pago pendiente
      const totalCalculated = exactMonthlyPayment * payments.length;
      const difference = remainingAfterDownPayment - totalCalculated;
      
      if (Math.abs(difference) > 0.01) {
        console.log(`⚠️  Diferencia de redondeo detectada: $${difference.toFixed(2)}`);
        
        // Encontrar el último pago pendiente y ajustarlo
        const lastPendingPayment = payments.reverse().find(p => p.status === 'pendiente' || p.status === 'vencido');
        
        if (lastPendingPayment) {
          const adjustedAmount = exactMonthlyPayment + difference;
          await connection.query(
            'UPDATE payments SET amount = ?, amount_pending = ? WHERE id = ?',
            [adjustedAmount.toFixed(2), adjustedAmount.toFixed(2), lastPendingPayment.id]
          );
          console.log(`✅ Último pago ajustado: $${exactMonthlyPayment.toFixed(2)} → $${adjustedAmount.toFixed(2)}`);
        }
      }

      // Recalcular el balance del contrato
      const [paidPayments] = await connection.query(
        'SELECT amount_paid FROM payments WHERE contract_id = ? AND status IN ("pagado", "parcial")',
        [contract.id]
      );

      const totalPaid = paidPayments.reduce((sum, p) => sum + Number(p.amount_paid), 0);
      const newRemainingBalance = remainingAfterDownPayment - totalPaid;

      await connection.query(
        'UPDATE contracts SET remaining_balance = ?, monthly_payment = ? WHERE id = ?',
        [Math.max(0, newRemainingBalance).toFixed(2), exactMonthlyPayment.toFixed(2), contract.id]
      );

      console.log(`✅ Updated ${updatedCount} payments | Difference: $${(totalNewAmount - totalOldAmount).toFixed(2)} | New Balance: $${newRemainingBalance.toFixed(2)}`);
      console.log('='.repeat(80));
    }

    console.log('\n✅ All contracts recalculated successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

recalculatePayments();
