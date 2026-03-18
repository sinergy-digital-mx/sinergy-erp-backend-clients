import { AppDataSource } from '../data-source';

const TENANT_ID = '54481b63-5516-458d-9bb3-d4e5cb028864';

async function recalculateRemainingBalance() {
  try {
    console.log('🔄 Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    console.log('🔄 Recalculating remaining balance for all contracts...');

    // Get all contracts with their payment totals
    const contracts = await AppDataSource.query(`
      SELECT 
        c.id,
        c.contract_number,
        c.total_price,
        c.down_payment,
        c.remaining_balance as old_remaining_balance,
        COALESCE(SUM(p.amount_paid), 0) as total_paid,
        (c.total_price - c.down_payment - COALESCE(SUM(p.amount_paid), 0)) as new_remaining_balance
      FROM contracts c
      LEFT JOIN payments p ON c.id = p.contract_id
      WHERE c.tenant_id = ?
      GROUP BY c.id, c.contract_number, c.total_price, c.down_payment, c.remaining_balance
      ORDER BY c.contract_number
    `, [TENANT_ID]);

    console.log(`📊 Found ${contracts.length} contracts to update\n`);

    let updatedCount = 0;
    
    for (const contract of contracts) {
      const oldBalance = parseFloat(contract.old_remaining_balance);
      const newBalance = parseFloat(contract.new_remaining_balance);
      
      if (Math.abs(oldBalance - newBalance) > 0.01) { // Only update if difference > 1 cent
        await AppDataSource.query(`
          UPDATE contracts 
          SET remaining_balance = ?
          WHERE id = ?
        `, [newBalance, contract.id]);
        
        console.log(`✅ ${contract.contract_number}: $${oldBalance.toFixed(2)} → $${newBalance.toFixed(2)} (paid: $${parseFloat(contract.total_paid).toFixed(2)})`);
        updatedCount++;
      } else {
        console.log(`ℹ️  ${contract.contract_number}: Already correct ($${newBalance.toFixed(2)})`);
      }
    }

    console.log(`\n🎉 Updated ${updatedCount} contracts with corrected remaining balance`);

  } catch (error) {
    console.error('❌ Error recalculating remaining balance:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

recalculateRemainingBalance();