import { DataSource } from 'typeorm';
import { AppDataSource } from '../data-source';

const TENANT_ID = '54481b63-5516-458d-9bb3-d4e5cb028864';
const CONTRACT_ID = '3cc0991e-dd0b-4c42-b849-9a80ce7006dd'; // CONT-1-01

async function debugPartialPayments() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    console.log('🔍 Debugging partial payments for CONT-1-01...');

    // Check all payments for this contract
    const allPayments = await queryRunner.query(`
      SELECT payment_number, status, is_overdue, due_date, amount_paid, amount_pending, amount
      FROM contract_payments 
      WHERE contract_id = ? AND tenant_id = ?
      ORDER BY CAST(payment_number AS UNSIGNED)
    `, [CONTRACT_ID, TENANT_ID]);

    console.log('\n📋 All payments:');
    allPayments.forEach((p: any) => {
      const overdue = p.is_overdue ? 'OVERDUE' : 'OK';
      console.log(`#${p.payment_number}: ${p.status} | ${overdue} | Paid: $${p.amount_paid} | Pending: $${p.amount_pending}`);
    });

    // Count by categories
    const parcialCount = allPayments.filter((p: any) => p.status === 'parcial' && !p.is_overdue).length;
    const parcialOverdueCount = allPayments.filter((p: any) => p.status === 'parcial' && p.is_overdue).length;
    const pendienteCount = allPayments.filter((p: any) => p.status === 'pendiente' && !p.is_overdue).length;
    const pendienteOverdueCount = allPayments.filter((p: any) => p.status === 'pendiente' && p.is_overdue).length;

    console.log('\n📊 Counts:');
    console.log(`Parcial (not overdue): ${parcialCount}`);
    console.log(`Parcial (overdue): ${parcialOverdueCount}`);
    console.log(`Pendiente (not overdue): ${pendienteCount}`);
    console.log(`Pendiente (overdue): ${pendienteOverdueCount}`);

    // Find partial payment
    const partialPayment = allPayments.find((p: any) => p.status === 'parcial');
    console.log('\n🔍 Partial payment found:', partialPayment ? `#${partialPayment.payment_number}` : 'None');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

debugPartialPayments().catch(console.error);