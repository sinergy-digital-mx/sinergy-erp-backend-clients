import { DataSource } from 'typeorm';
import { AppDataSource } from '../data-source';

const TENANT_ID = '54481b63-5516-458d-9bb3-d4e5cb028864';
const CONTRACT_ID = '3cc0991e-dd0b-4c42-b849-9a80ce7006dd'; // CONT-1-01

async function checkOverdueStatus() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    console.log('🔍 Checking overdue status...');

    // Check if is_overdue column exists
    const columns = await queryRunner.query(`
      SHOW COLUMNS FROM contract_payments LIKE 'is_overdue'
    `);

    console.log('is_overdue column exists:', columns.length > 0);

    // Check payments for specific contract
    const contractPayments = await queryRunner.query(`
      SELECT payment_number, status, is_overdue, due_date, amount_paid
      FROM contract_payments 
      WHERE contract_id = ? AND tenant_id = ?
      ORDER BY CAST(payment_number AS UNSIGNED)
      LIMIT 20
    `, [CONTRACT_ID, TENANT_ID]);

    console.log('\n📋 Contract CONT-1-01 payments:');
    contractPayments.forEach((p: any) => {
      const overdue = p.is_overdue ? '🔴 OVERDUE' : '✅ OK';
      console.log(`Payment #${p.payment_number}: ${p.status} | Due: ${p.due_date} | ${overdue}`);
    });

    // Check total overdue count
    const overdueCount = await queryRunner.query(`
      SELECT COUNT(*) as count
      FROM contract_payments 
      WHERE contract_id = ? AND tenant_id = ? AND is_overdue = 1
    `, [CONTRACT_ID, TENANT_ID]);

    console.log(`\n📊 Total overdue payments for CONT-1-01: ${overdueCount[0].count}`);

    // Check all overdue payments across tenant
    const allOverdue = await queryRunner.query(`
      SELECT COUNT(*) as count
      FROM contract_payments 
      WHERE tenant_id = ? AND is_overdue = 1
    `, [TENANT_ID]);

    console.log(`📊 Total overdue payments for tenant: ${allOverdue[0].count}`);

    // Check today's date vs due dates
    const today = new Date().toISOString().split('T')[0];
    console.log(`\n📅 Today's date: ${today}`);

    const shouldBeOverdue = await queryRunner.query(`
      SELECT COUNT(*) as count
      FROM contract_payments 
      WHERE contract_id = ? AND tenant_id = ? 
        AND status IN ('pendiente', 'parcial')
        AND due_date < CURDATE()
    `, [CONTRACT_ID, TENANT_ID]);

    console.log(`📊 Payments that should be overdue: ${shouldBeOverdue[0].count}`);

  } catch (error) {
    console.error('❌ Error checking status:', error);
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

// Run the check
checkOverdueStatus().catch(console.error);