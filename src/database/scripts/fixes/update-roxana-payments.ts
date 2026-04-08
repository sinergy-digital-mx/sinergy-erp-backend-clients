import { AppDataSource } from '../data-source';

async function updateRoxanaPayments() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('Updating payments for CONT-3-08 (Roxana)...');

    // Get contract details
    const contract = await AppDataSource.query(`
      SELECT id, tenant_id, total_price, down_payment, remaining_balance, 
             first_payment_date, payment_months, monthly_payment
      FROM contracts 
      WHERE contract_number = 'CONT-3-08'
    `);

    if (contract.length === 0) {
      console.error('Contract CONT-3-08 not found');
      process.exit(1);
    }

    const contractData = contract[0];
    console.log(`\nContract found:`);
    console.log(`- Total Price: $${contractData.total_price}`);
    console.log(`- Down Payment: $${contractData.down_payment}`);
    console.log(`- Remaining Balance: $${contractData.remaining_balance}`);
    console.log(`- Monthly Payment: $${contractData.monthly_payment}`);
    console.log(`- Payment Months: ${contractData.payment_months}`);
    console.log(`- First Payment Date: ${contractData.first_payment_date}`);

    // Get existing payments
    const existingPayments = await AppDataSource.query(`
      SELECT id, payment_number, due_date, amount, amount_paid, amount_pending, status
      FROM contract_payments 
      WHERE contract_id = ?
      ORDER BY CAST(payment_number AS UNSIGNED) ASC
    `, [contractData.id]);

    console.log(`\nFound ${existingPayments.length} existing payments`);

    // Update each payment with correct values
    const firstPaymentDate = new Date(contractData.first_payment_date);
    let updatedCount = 0;

    for (let i = 0; i < existingPayments.length; i++) {
      const payment = existingPayments[i];
      const paymentNum = parseInt(payment.payment_number);

      // Calculate correct due date: 5th of each month
      const correctDueDate = new Date(
        firstPaymentDate.getFullYear(),
        firstPaymentDate.getMonth() + (paymentNum - 1),
        5
      );

      // Update payment with correct values
      await AppDataSource.query(`
        UPDATE contract_payments 
        SET 
          amount = ?,
          amount_pending = ?,
          amount_paid = 0,
          due_date = ?,
          payment_date = ?,
          status = 'pendiente',
          is_overdue = false,
          updated_at = NOW()
        WHERE id = ?
      `, [
        contractData.monthly_payment,
        contractData.monthly_payment,
        correctDueDate,
        correctDueDate,
        payment.id
      ]);

      updatedCount++;
    }

    console.log(`\n✓ Updated ${updatedCount} payments`);

    // Verify updates
    const verifyPayments = await AppDataSource.query(`
      SELECT payment_number, due_date, amount, amount_paid, amount_pending, status
      FROM contract_payments 
      WHERE contract_id = ?
      ORDER BY CAST(payment_number AS UNSIGNED) ASC
      LIMIT 10
    `, [contractData.id]);

    console.log(`\nFirst 10 updated payments:`);
    verifyPayments.forEach(p => {
      const dueDate = new Date(p.due_date).toISOString().split('T')[0];
      console.log(`- Pago #${p.payment_number}: ${dueDate} - MONTO=$${p.amount} PAGADO=$${p.amount_paid} PENDIENTE=$${p.amount_pending} (${p.status})`);
    });

    // Summary
    const summary = await AppDataSource.query(`
      SELECT 
        COUNT(*) as total_payments,
        SUM(amount) as total_amount,
        SUM(amount_paid) as total_paid,
        SUM(amount_pending) as total_pending
      FROM contract_payments 
      WHERE contract_id = ?
    `, [contractData.id]);

    console.log(`\n✓ Summary:`);
    console.log(`- Total Payments: ${summary[0].total_payments}`);
    console.log(`- Total Amount: $${summary[0].total_amount}`);
    console.log(`- Total Paid: $${summary[0].total_paid}`);
    console.log(`- Total Pending: $${summary[0].total_pending}`);

    await AppDataSource.destroy();
    console.log('\n✓ Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating payments:', error);
    process.exit(1);
  }
}

updateRoxanaPayments();
