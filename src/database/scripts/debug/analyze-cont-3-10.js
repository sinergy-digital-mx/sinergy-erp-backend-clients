require('dotenv').config();
const mysql = require('mysql2/promise');

async function analyzeContract() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  try {
    // Get contract
    const [contracts] = await connection.query(
      "SELECT * FROM contracts WHERE contract_number = 'CONT-3-10'"
    );

    if (contracts.length === 0) {
      console.log('❌ Contract not found');
      return;
    }

    const contract = contracts[0];
    
    console.log('\n📋 CONTRATO CONT-3-10');
    console.log('='.repeat(80));
    console.log(`Precio Total: $${Number(contract.total_price).toFixed(2)}`);
    console.log(`Enganche: $${Number(contract.down_payment).toFixed(2)}`);
    console.log(`Saldo Pendiente (DB): $${Number(contract.remaining_balance).toFixed(2)}`);
    console.log(`Meses de Pago: ${contract.payment_months}`);
    console.log(`Pago Mensual (DB): $${Number(contract.monthly_payment).toFixed(2)}`);

    // Calcular lo que DEBERÍA ser
    const totalPrice = Number(contract.total_price);
    const downPayment = Number(contract.down_payment);
    const paymentMonths = Number(contract.payment_months);
    const remainingAfterDown = totalPrice - downPayment;
    const exactMonthly = remainingAfterDown / paymentMonths;

    console.log(`\n💡 CÁLCULO CORRECTO:`);
    console.log(`Restante después de enganche: $${remainingAfterDown.toFixed(2)}`);
    console.log(`Pago mensual exacto: $${exactMonthly.toFixed(2)}`);
    console.log(`Total de ${paymentMonths} pagos: $${(exactMonthly * paymentMonths).toFixed(2)}`);

    // Get all payments
    const [payments] = await connection.query(
      'SELECT payment_number, amount, amount_paid, amount_pending, status FROM payments WHERE contract_id = ? ORDER BY payment_number',
      [contract.id]
    );

    console.log(`\n📦 PAGOS (${payments.length} total):`);
    console.log('='.repeat(80));

    let totalPagado = 0;
    let totalParcial = 0;
    let totalPendiente = 0;
    let countPagado = 0;
    let countParcial = 0;
    let countPendiente = 0;

    payments.forEach(p => {
      const amount = Number(p.amount);
      const paid = Number(p.amount_paid);
      const pending = Number(p.amount_pending);

      if (p.status === 'pagado') {
        totalPagado += paid;
        countPagado++;
      } else if (p.status === 'parcial') {
        totalParcial += paid;
        countParcial++;
        console.log(`⚠️  Pago #${p.payment_number}: PARCIAL - Amount: $${amount.toFixed(2)}, Paid: $${paid.toFixed(2)}, Pending: $${pending.toFixed(2)}`);
      } else if (p.status === 'pendiente' || p.status === 'vencido') {
        totalPendiente += amount;
        countPendiente++;
      }
    });

    console.log(`\n📊 RESUMEN DE PAGOS:`);
    console.log('='.repeat(80));
    console.log(`Pagados: ${countPagado} pagos = $${totalPagado.toFixed(2)}`);
    console.log(`Parciales: ${countParcial} pagos = $${totalParcial.toFixed(2)} pagado`);
    console.log(`Pendientes: ${countPendiente} pagos = $${totalPendiente.toFixed(2)}`);
    console.log(`\nTOTAL: $${(totalPagado + totalParcial + totalPendiente).toFixed(2)}`);

    // Verificar si hay pago parcial
    const [partialPayments] = await connection.query(
      'SELECT payment_number, amount, amount_paid, amount_pending FROM payments WHERE contract_id = ? AND status = "parcial"',
      [contract.id]
    );

    if (partialPayments.length > 0) {
      console.log(`\n⚠️  PAGO PARCIAL DETECTADO:`);
      partialPayments.forEach(p => {
        console.log(`   Pago #${p.payment_number}: Amount=$${Number(p.amount).toFixed(2)}, Paid=$${Number(p.amount_paid).toFixed(2)}, Pending=$${Number(p.amount_pending).toFixed(2)}`);
      });
    }

    // Calcular saldo pendiente correcto
    const totalPagadoConParcial = totalPagado + totalParcial;
    const saldoPendienteCorrecto = remainingAfterDown - totalPagadoConParcial;

    console.log(`\n💰 VERIFICACIÓN DE SALDO:`);
    console.log('='.repeat(80));
    console.log(`Total a pagar (sin enganche): $${remainingAfterDown.toFixed(2)}`);
    console.log(`Total pagado (completos + parciales): $${totalPagadoConParcial.toFixed(2)}`);
    console.log(`Saldo pendiente CORRECTO: $${saldoPendienteCorrecto.toFixed(2)}`);
    console.log(`Saldo pendiente en DB: $${Number(contract.remaining_balance).toFixed(2)}`);
    console.log(`Diferencia: $${(Number(contract.remaining_balance) - saldoPendienteCorrecto).toFixed(2)}`);

    // Verificar suma de pagos pendientes
    const sumaPendientes = totalPendiente;
    const pendienteDelParcial = partialPayments.length > 0 ? Number(partialPayments[0].amount_pending) : 0;
    const totalPendienteConParcial = sumaPendientes + pendienteDelParcial;

    console.log(`\n🔍 ANÁLISIS DE PENDIENTES:`);
    console.log('='.repeat(80));
    console.log(`Suma de pagos pendientes: $${sumaPendientes.toFixed(2)}`);
    console.log(`Pendiente del pago parcial: $${pendienteDelParcial.toFixed(2)}`);
    console.log(`Total pendiente (con parcial): $${totalPendienteConParcial.toFixed(2)}`);
    console.log(`Saldo pendiente del contrato: $${Number(contract.remaining_balance).toFixed(2)}`);
    console.log(`Diferencia: $${(Number(contract.remaining_balance) - totalPendienteConParcial).toFixed(2)}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

analyzeContract();
