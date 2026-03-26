require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixFullyPaidContracts() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  try {
    console.log('\n🔄 Buscando contratos totalmente pagados...\n');

    // Find contracts with "TOTALMENTE PAGADO" in notes or with 0 payment_months
    const [contracts] = await connection.query(`
      SELECT id, contract_number, total_price, down_payment, remaining_balance, payment_months, notes, status
      FROM contracts 
      WHERE (notes LIKE '%TOTALMENTE PAGADO%' OR notes LIKE '%TOTALMENTE%PAGADO%' OR payment_months = 0)
      AND status != 'completado'
    `);

    if (contracts.length === 0) {
      console.log('✅ No se encontraron contratos para actualizar.');
      return;
    }

    console.log(`📦 Encontrados ${contracts.length} contratos totalmente pagados:\n`);

    for (const contract of contracts) {
      console.log(`📋 ${contract.contract_number}`);
      console.log(`   Total: $${Number(contract.total_price).toFixed(2)}`);
      console.log(`   Enganche: $${Number(contract.down_payment).toFixed(2)}`);
      console.log(`   Meses: ${contract.payment_months}`);
      console.log(`   Status actual: ${contract.status}`);
      console.log(`   Saldo pendiente: $${Number(contract.remaining_balance).toFixed(2)}`);

      // Update contract to completed with 0 balance
      await connection.query(
        'UPDATE contracts SET status = ?, remaining_balance = ? WHERE id = ?',
        ['completado', 0, contract.id]
      );

      console.log(`   ✅ Actualizado a: completado, saldo: $0.00\n`);
    }

    console.log(`\n✅ ${contracts.length} contratos actualizados correctamente!`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

fixFullyPaidContracts();
