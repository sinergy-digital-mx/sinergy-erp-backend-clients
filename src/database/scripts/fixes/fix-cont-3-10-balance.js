require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixBalance() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  try {
    console.log('\n🔄 Recalculando balance de CONT-3-10...\n');

    // Get contract
    const [contracts] = await connection.query(
      "SELECT id, contract_number, total_price, down_payment, remaining_balance FROM contracts WHERE contract_number = 'CONT-3-10'"
    );

    if (contracts.length === 0) {
      console.log('❌ Contract not found');
      return;
    }

    const contract = contracts[0];
    const totalPrice = Number(contract.total_price);
    const downPayment = Number(contract.down_payment);
    const oldBalance = Number(contract.remaining_balance);

    console.log(`📋 Contract: ${contract.contract_number}`);
    console.log(`💰 Total Price: $${totalPrice.toFixed(2)}`);
    console.log(`💵 Down Payment: $${downPayment.toFixed(2)}`);
    console.log(`📊 Old Remaining Balance: $${oldBalance.toFixed(2)}`);

    // Get all payments and calculate total paid
    const [payments] = await connection.query(
      'SELECT status, amount_paid FROM payments WHERE contract_id = ?',
      [contract.id]
    );

    let totalPaid = 0;
    payments.forEach(p => {
      if (p.status === 'pagado' || p.status === 'parcial') {
        totalPaid += Number(p.amount_paid);
      }
    });

    console.log(`\n💳 Total Paid from Payments: $${totalPaid.toFixed(2)}`);

    // Calculate new remaining balance
    const newBalance = totalPrice - downPayment - totalPaid;

    console.log(`\n✅ New Remaining Balance: $${newBalance.toFixed(2)}`);
    console.log(`📉 Difference: $${(newBalance - oldBalance).toFixed(2)}`);

    // Update contract
    await connection.query(
      'UPDATE contracts SET remaining_balance = ? WHERE id = ?',
      [newBalance.toFixed(2), contract.id]
    );

    console.log('\n✅ Balance actualizado correctamente!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

fixBalance();
