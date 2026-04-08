import { AppDataSource } from '../data-source';
import { v4 as uuidv4 } from 'uuid';

async function recalculateRoxanaPayments() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('Recalculating payments for CONT-3-08 (Roxana)...');

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

    // Delete existing payments
    const deleteResult = await AppDataSource.query(`
      DELETE FROM contract_payments 
      WHERE contract_id = ? AND tenant_id = ?
    `, [contractData.id, contractData.tenant_id]);

    console.log(`\n✓ Deleted ${deleteResult.affectedRows || 0} existing payments`);

    // Generate new payments
    const firstPaymentDate = new Date(contractData.first_payment_date);
    const payments: any[] = [];

    for (let i = 0; i < contractData.payment_months; i++) {
      // Calculate due date: 5th of each month starting from first payment date
      const dueDate = new Date(
        firstPaymentDate.getFullYear(),
        firstPaymentDate.getMonth() + i,
        5
      );

      payments.push({
        id: uuidv4(),
        tenant_id: contractData.tenant_id,
        contract_id: contractData.id,
        payment_number: String(i + 1),
        payment_date: dueDate,
        due_date: dueDate,
        amount: contractData.monthly_payment,
        amount_paid: 0,
        amount_pending: contractData.monthly_payment,
        payment_method: 'transferencia',
        status: 'pendiente',
        is_overdue: false,
        notes: null,
        metadata: null,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    // Insert new payments
    const insertResult = await AppDataSource.query(`
      INSERT INTO contract_payments (
        id, tenant_id, contract_id, payment_number, payment_date, due_date,
        amount, amount_paid, amount_pending, payment_method, status,
        is_overdue, notes, metadata, created_at, updated_at
      ) VALUES ?
    `, [payments.map(p => [
      p.id, p.tenant_id, p.contract_id, p.payment_number, p.payment_date, p.due_date,
      p.amount, p.amount_paid, p.amount_pending, p.payment_method, p.status,
      p.is_overdue, p.notes, p.metadata, p.created_at, p.updated_at
    ])]);

    console.log(`✓ Created ${payments.length} new payments`);

    // Verify
    const verifyPayments = await AppDataSource.query(`
      SELECT COUNT(*) as count, SUM(amount) as total_amount
      FROM contract_payments 
      WHERE contract_id = ?
    `, [contractData.id]);

    console.log(`\n✓ Verification:`);
    console.log(`- Total Payments: ${verifyPayments[0].count}`);
    console.log(`- Total Amount: $${verifyPayments[0].total_amount}`);

    // Show first few payments
    const samplePayments = await AppDataSource.query(`
      SELECT payment_number, due_date, amount, status
      FROM contract_payments 
      WHERE contract_id = ?
      ORDER BY CAST(payment_number AS UNSIGNED) ASC
      LIMIT 5
    `, [contractData.id]);

    console.log(`\nFirst 5 payments:`);
    samplePayments.forEach(p => {
      console.log(`- Pago #${p.payment_number}: ${p.due_date.toISOString().split('T')[0]} - $${p.amount} (${p.status})`);
    });

    await AppDataSource.destroy();
    console.log('\n✓ Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error recalculating payments:', error);
    process.exit(1);
  }
}

recalculateRoxanaPayments();
