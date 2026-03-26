import { AppDataSource } from '../data-source';

async function fixRoxanaBalance() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('Fixing balance for CONT-3-08 (Roxana)...\n');

    // Get contract
    const contract = await AppDataSource.query(`
      SELECT id, contract_number, total_price, down_payment, remaining_balance, 
             payment_months, monthly_payment
      FROM contracts 
      WHERE contract_number = 'CONT-3-08'
    `);

    if (contract.length === 0) {
      console.error('Contract not found');
      process.exit(1);
    }

    const c = contract[0];
    console.log('Current contract values:');
    console.log(`- Total Price: $${c.total_price}`);
    console.log(`- Down Payment: $${c.down_payment}`);
    console.log(`- Remaining Balance: $${c.remaining_balance}`);
    console.log(`- Payment Months: ${c.payment_months}`);
    console.log(`- Monthly Payment: $${c.monthly_payment}\n`);

    // Calculate correct values
    const correctRemaining = c.total_price - c.down_payment;
    const correctMonthly = Math.round((correctRemaining / c.payment_months) * 100) / 100;

    console.log('Correct values should be:');
    console.log(`- Remaining Balance: $${correctRemaining}`);
    console.log(`- Monthly Payment: $${correctMonthly}\n`);

    // Update contract
    await AppDataSource.query(`
      UPDATE contracts 
      SET 
        remaining_balance = ?,
        monthly_payment = ?,
        updated_at = NOW()
      WHERE contract_number = 'CONT-3-08'
    `, [correctRemaining, correctMonthly]);

    console.log('✓ Contract updated\n');

    // Verify
    const updated = await AppDataSource.query(`
      SELECT total_price, down_payment, remaining_balance, payment_months, monthly_payment
      FROM contracts 
      WHERE contract_number = 'CONT-3-08'
    `);

    console.log('Verified values:');
    console.log(`- Total Price: $${updated[0].total_price}`);
    console.log(`- Down Payment: $${updated[0].down_payment}`);
    console.log(`- Remaining Balance: $${updated[0].remaining_balance}`);
    console.log(`- Payment Months: ${updated[0].payment_months}`);
    console.log(`- Monthly Payment: $${updated[0].monthly_payment}`);

    await AppDataSource.destroy();
    console.log('\n✓ Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixRoxanaBalance();
