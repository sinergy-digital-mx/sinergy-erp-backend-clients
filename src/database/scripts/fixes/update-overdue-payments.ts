import { DataSource } from 'typeorm';
import { AppDataSource } from '../data-source';

const TENANT_ID = '54481b63-5516-458d-9bb3-d4e5cb028864';

async function updateOverduePayments() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    console.log('🔄 Updating overdue payments...');

    // Update payments that are past due date and not paid
    const result = await queryRunner.query(`
      UPDATE contract_payments 
      SET is_overdue = 1, updated_at = CURRENT_TIMESTAMP
      WHERE tenant_id = ? 
        AND status IN ('pendiente', 'parcial')
        AND due_date < CURDATE()
        AND is_overdue = 0
    `, [TENANT_ID]);

    console.log(`✅ Marked ${result.affectedRows} payments as overdue`);

    // Show summary of overdue payments by contract
    const overdueByContract = await queryRunner.query(`
      SELECT 
        c.contract_number,
        CONCAT(cu.name, ' ', cu.lastname) as customer_name,
        p.code as property_code,
        COUNT(*) as overdue_count,
        SUM(CASE WHEN pay.status = 'parcial' THEN pay.amount_pending ELSE pay.amount END) as overdue_amount
      FROM contract_payments pay
      INNER JOIN contracts c ON pay.contract_id = c.id
      INNER JOIN customers cu ON c.customer_id = cu.id
      INNER JOIN properties p ON c.property_id = p.id
      WHERE pay.tenant_id = ? 
        AND pay.is_overdue = 1
      GROUP BY c.id, c.contract_number, cu.name, cu.lastname, p.code
      ORDER BY overdue_count DESC
    `, [TENANT_ID]);

    console.log('\n📊 Overdue payments by contract:');
    overdueByContract.forEach((contract: any) => {
      console.log(`${contract.contract_number} (${contract.customer_name} - ${contract.property_code}): ${contract.overdue_count} payments, $${Number(contract.overdue_amount).toFixed(2)}`);
    });

    await queryRunner.commitTransaction();
    console.log('\n🎉 Overdue payments updated successfully!');

  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('❌ Error updating overdue payments:', error);
    throw error;
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

// Run the script
updateOverduePayments().catch(console.error);