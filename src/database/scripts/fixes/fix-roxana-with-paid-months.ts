import { AppDataSource } from '../data-source';

async function fixRoxanaWithPaidMonths() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('Fixing CONT-3-08 (Roxana) with paid months calculation...\n');

    // Get contract
    const contract = await AppDataSource.query(`
      SELECT id, contract_number, total_price, down_payment, payment_months, first_payment_date
      FROM contracts 
      WHERE contract_number = 'CONT-3-08'
    `);

    if (contract.length === 0) {
      console.error('Contract not found');
      process.exit(1);
    }

    const c = contract[0];
    console.log('Contract details:');
    console.log(`- Total Price: $${c.total_price}`);
    console.log(`- Down Payment: $${c.down_payment}`);
    console.log(`- Payment Months: ${c.payment_months}`);
    console.log(`- First Payment Date: ${c.first_payment_date}\n`);

    // Get payments with status 'pagado'
    const paidPayments = await AppDataSource.query(`
      SELECT COUNT(*) as count, SUM(amount) as total_paid
      FROM contract_payments 
      WHERE contract_id = ? AND status = 'pagado'
    `, [c.id]);

    const paidMonths = paidPayments[0].count || 0;
    const totalPaidAmount = parseFloat(paidPayments[0].total_paid) || 0;

    console.log('Paid payments:');
    console.log(`- Paid Months: ${paidMonths}`);
    console.log(`- Total Paid Amount: $${totalPaidAmount}\n`);

    // Calculate correct values
    const financedAmount = c.total_price - c.down_payment;
    const monthlyPayment = Math.round((financedAmount / c.payment_months) * 100) / 100;
    const totalPaidFromMonths = paidMonths * monthlyPayment;
    const correctRemaining = financedAmount - totalPaidFromMonths;

    console.log('Calculated values:');
    console.log(`- Financed Amount: $${financedAmount}`);
    console.log(`- Monthly Payment: $${monthlyPayment}`);
    console.log(`- Total Paid (${paidMonths} months × $${monthlyPayment}): $${totalPaidFromMonths}`);
    console.log(`- Correct Remaining Balance: $${correctRemaining}\n`);

    // Update contract
    await AppDataSource.query(`
      UPDATE contracts 
      SET 
        remaining_balance = ?,
        monthly_payment = ?,
        updated_at = NOW()
      WHERE contract_number = 'CONT-3-08'
    `, [correctRemaining, monthlyPayment]);

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

fixRoxanaWithPaidMonths();
