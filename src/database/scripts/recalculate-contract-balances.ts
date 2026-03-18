import { DataSource } from 'typeorm';
import { AppDataSource } from '../data-source';

const TENANT_ID = '54481b63-5516-458d-9bb3-d4e5cb028864';

async function recalculateContractBalances() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    console.log('🔄 Recalculating contract balances...');

    // Get all contracts for the tenant
    const contracts = await queryRunner.query(`
      SELECT id, contract_number, total_price, down_payment, remaining_balance
      FROM contracts 
      WHERE tenant_id = ?
    `, [TENANT_ID]);

    console.log(`📋 Found ${contracts.length} contracts to recalculate`);

    for (const contract of contracts) {
      // Calculate total paid from payments using CORRECT logic:
      // - PAID payments: count full amount
      // - PARTIAL payments: count only amount_paid
      // - PENDING payments: count 0
      const paymentStats = await queryRunner.query(`
        SELECT 
          SUM(CASE 
            WHEN status = 'pagado' THEN amount 
            WHEN status = 'parcial' THEN amount_paid 
            ELSE 0 
          END) as total_paid_real
        FROM payments 
        WHERE contract_id = ? AND tenant_id = ?
      `, [contract.id, TENANT_ID]);

      const totalPaidReal = Number(paymentStats[0]?.total_paid_real || 0);
      const totalPrice = Number(contract.total_price);
      const downPayment = Number(contract.down_payment);
      
      // Correct balance = Total - Down Payment - Real Paid Amount
      const correctBalance = Math.max(0, totalPrice - downPayment - totalPaidReal);
      const currentBalance = Number(contract.remaining_balance);

      console.log(`📊 Contract ${contract.contract_number}:`);
      console.log(`   Total: $${totalPrice.toFixed(2)}`);
      console.log(`   Down Payment: $${downPayment.toFixed(2)}`);
      console.log(`   Real Paid: $${totalPaidReal.toFixed(2)}`);
      console.log(`   Current Balance: $${currentBalance.toFixed(2)}`);
      console.log(`   Correct Balance: $${correctBalance.toFixed(2)}`);

      if (Math.abs(currentBalance - correctBalance) > 0.01) {
        console.log(`   ⚠️  MISMATCH! Updating balance...`);
        
        await queryRunner.query(`
          UPDATE contracts 
          SET remaining_balance = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [correctBalance, contract.id]);

        console.log(`   ✅ Updated balance from $${currentBalance.toFixed(2)} to $${correctBalance.toFixed(2)}`);
      } else {
        console.log(`   ✅ Balance is correct`);
      }
      console.log('');
    }

    await queryRunner.commitTransaction();
    console.log('🎉 Contract balances recalculated successfully!');

  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('❌ Error recalculating balances:', error);
    throw error;
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

// Run the script
recalculateContractBalances().catch(console.error);