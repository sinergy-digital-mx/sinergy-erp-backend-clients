import { AppDataSource } from '../data-source';
import { v4 as uuidv4 } from 'uuid';

async function generateRoxanaPayments() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('Generating payments for CONT-3-08 (Roxana)...\n');

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
    console.log('Contract details:');
    console.log(`- ID: ${contractData.id}`);
    console.log(`- Total Price: $${contractData.total_price}`);
    console.log(`- Down Payment: $${contractData.down_payment}`);
    console.log(`- Remaining Balance: $${contractData.remaining_balance}`);
    console.log(`- Monthly Payment: $${contractData.monthly_payment}`);
    console.log(`- Payment Months: ${contractData.payment_months}`);
    console.log(`- First Payment Date: ${contractData.first_payment_date}`);
    console.log(`- Tenant ID: ${contractData.tenant_id}\n`);

    // Generate payment records
    const firstPaymentDate = new Date(contractData.first_payment_date);
    const payments: any[] = [];

    for (let i = 0; i < contractData.payment_months; i++) {
      // Calculate due date: 5th of each month
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

    console.log(`Inserting ${payments.length} payments...\n`);

    // Insert payments one by one to avoid bulk insert issues
    for (const payment of payments) {
      await AppDataSource.query(`
        INSERT INTO contract_payments (
          id, tenant_id, contract_id, payment_number, payment_date, due_date,
          amount, amount_paid, amount_pending, payment_method, status,
          is_overdue, notes, metadata, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        payment.id, payment.tenant_id, payment.contract_id, payment.payment_number,
        payment.payment_date, payment.due_date, payment.amount, payment.amount_paid,
        payment.amount_pending, payment.payment_method, payment.status,
        payment.is_overdue, payment.notes, payment.metadata, payment.created_at, payment.updated_at
      ]);
    }

    console.log(`✓ Inserted ${payments.length} payments\n`);

    // Verify
    const verify = await AppDataSource.query(`
      SELECT 
        COUNT(*) as total_payments,
        SUM(amount) as total_amount,
        SUM(amount_paid) as total_paid,
        SUM(amount_pending) as total_pending
      FROM contract_payments 
      WHERE contract_id = ?
    `, [contractData.id]);

    console.log('✓ Verification:');
    console.log(`- Total Payments: ${verify[0].total_payments}`);
    console.log(`- Total Amount: $${verify[0].total_amount}`);
    console.log(`- Total Paid: $${verify[0].total_paid}`);
    console.log(`- Total Pending: $${verify[0].total_pending}\n`);

    // Show first 10 payments
    const samplePayments = await AppDataSource.query(`
      SELECT payment_number, due_date, amount, amount_paid, amount_pending, status
      FROM contract_payments 
      WHERE contract_id = ?
      ORDER BY CAST(payment_number AS UNSIGNED) ASC
      LIMIT 10
    `, [contractData.id]);

    console.log('First 10 payments:');
    samplePayments.forEach(p => {
      const dueDate = new Date(p.due_date).toISOString().split('T')[0];
      console.log(`- Pago #${p.payment_number}: ${dueDate} - MONTO=$${p.amount} PAGADO=$${p.amount_paid} PENDIENTE=$${p.amount_pending} (${p.status})`);
    });

    await AppDataSource.destroy();
    console.log('\n✓ Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

generateRoxanaPayments();
