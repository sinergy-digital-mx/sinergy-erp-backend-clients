require('dotenv').config();
const mysql = require('mysql2/promise');

async function recalculateAllActiveContracts() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  try {
    console.log('\n🔄 Recalculando balance de todos los contratos activos...\n');

    // Get all active contracts
    const [contracts] = await connection.query(
      "SELECT id, contract_number, total_price, down_payment, remaining_balance FROM contracts WHERE status = 'activo'"
    );

    console.log(`📦 Encontrados ${contracts.length} contratos activos\n`);

    let updatedCount = 0;

    for (const contract of contracts) {
      const totalPrice = Number(contract.total_price);
      const downPayment = Number(contract.down_payment);
      const oldBalance = Number(contract.remaining_balance);

      // Get all payments and calculate total paid
      const [payments] = await connection.query(
        'SELECT status, amount_paid FROM payments WHERE contract_id = ?',
        [contract.id]
      );

      let totalPaidFromPayments = 0;
      payments.forEach(p => {
        if (p.status === 'pagado' || p.status === 'parcial') {
          totalPaidFromPayments += Number(p.amount_paid);
        }
      });

      // Calculate new remaining balance
      const newBalance = totalPrice - downPayment - totalPaidFromPayments;
      const difference = Math.abs(newBalance - oldBalance);

      // Only update if difference is significant (more than $0.50)
      if (difference > 0.50) {
        await connection.query(
          'UPDATE contracts SET remaining_balance = ? WHERE id = ?',
          [newBalance.toFixed(2), contract.id]
        );

        console.log(`✅ ${contract.contract_number}`);
        console.log(`   Old: $${oldBalance.toFixed(2)} → New: $${newBalance.toFixed(2)} (diff: $${difference.toFixed(2)})`);
        updatedCount++;
      }
    }

    console.log(`\n✅ ${updatedCount} contratos actualizados de ${contracts.length} totales`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

recalculateAllActiveContracts();
