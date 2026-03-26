import { AppDataSource } from '../data-source';
import { v4 as uuidv4 } from 'uuid';

async function roxanaCleanRegenerate() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('Cleaning and regenerating payments for CONT-3-08 (Roxana)...\n');

    // Get contract
    const contract = await AppDataSource.query(`
      SELECT id, tenant_id, total_price, down_payment, payment_months
      FROM contracts 
      WHERE contract_number = 'CONT-3-08'
    `);

    if (contract.length === 0) {
      console.error('Contract not found');
      process.exit(1);
    }

    const c = contract[0];
    const PAID_MONTHS = 8;
    const MONTHLY_PAYMENT = 387.81;

    console.log('Contract details:');
    console.log(`- Total Price: $${c.total_price}`);
    console.log(`- Down Payment: $${c.down_payment}`);
    console.log(`- Payment Months: ${c.payment_months}`);
    console.log(`- Monthly Payment: $${MONTHLY_PAYMENT}`);
    console.log(`- Paid Months: ${PAID_MONTHS}\n`);

    // DELETE all existing payments
    const deleteResult = await AppDataSource.query(`
      DELETE FROM payments 
      WHERE contract_id = ?
    `, [c.id]);

    console.log(`✓ Deleted ${deleteResult.affectedRows || 0} existing payments\n`);

    // Generate payments starting from MARCH 2025 (month 2, day 5)
    const payments: any[] = [];
    const startYear = 2025;
    const startMonth = 2; // March (0-indexed: 0=Jan, 1=Feb, 2=Mar)

    for (let i = 0; i < c.payment_months; i++) {
      // Calculate due date: 5th of each month starting from March 2025
      const dueDate = new Date(startYear, startMonth + i, 5);

      const isPaid = i < PAID_MONTHS;
      const status = isPaid ? 'pagado' : 'pendiente';
      
      // Check if payment is overdue (due date is before today)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isOverdue = !isPaid && dueDate < today;

      payments.push({
        id: uuidv4(),
        tenant_id: c.tenant_id,
        contract_id: c.id,
        payment_number: String(i + 1),
        payment_date: dueDate,
        due_date: dueDate,
        amount: MONTHLY_PAYMENT,
        amount_paid: isPaid ? MONTHLY_PAYMENT : 0,
        amount_pending: isPaid ? 0 : MONTHLY_PAYMENT,
        payment_method: isPaid ? 'efectivo' : 'transferencia',
        status: status,
        is_overdue: isOverdue,
        paid_date: isPaid ? dueDate : null,
        notes: isPaid ? 'Pago histórico' : null,
        metadata: null,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    console.log(`Inserting ${payments.length} payments (${PAID_MONTHS} paid, ${c.payment_months - PAID_MONTHS} pending)...\n`);

    // Insert payments
    for (const payment of payments) {
      await AppDataSource.query(`
        INSERT INTO payments (
          id, tenant_id, contract_id, payment_number, payment_date, due_date,
          amount, amount_paid, amount_pending, payment_method, status,
          is_overdue, paid_date, notes, metadata, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        payment.id, payment.tenant_id, payment.contract_id, payment.payment_number,
        payment.payment_date, payment.due_date, payment.amount, payment.amount_paid,
        payment.amount_pending, payment.payment_method, payment.status,
        payment.is_overdue, payment.paid_date, payment.notes, payment.metadata,
        payment.created_at, payment.updated_at
      ]);
    }

    console.log(`✓ Inserted ${payments.length} payments\n`);

    // Calculate and update contract balance
    const totalPaidAmount = PAID_MONTHS * MONTHLY_PAYMENT;
    const financedAmount = c.total_price - c.down_payment;
    const correctRemaining = financedAmount - totalPaidAmount;

    await AppDataSource.query(`
      UPDATE contracts 
      SET 
        remaining_balance = ?,
        monthly_payment = ?,
        first_payment_date = '2025-03-01',
        updated_at = NOW()
      WHERE id = ?
    `, [correctRemaining, MONTHLY_PAYMENT, c.id]);

    console.log('✓ Contract updated\n');

    // Show first 10 payments
    const samplePayments = await AppDataSource.query(`
      SELECT payment_number, due_date, amount, amount_paid, amount_pending, status
      FROM payments 
      WHERE contract_id = ?
      ORDER BY CAST(payment_number AS UNSIGNED) ASC
      LIMIT 10
    `, [c.id]);

    console.log('First 10 payments:');
    samplePayments.forEach(p => {
      const dueDate = new Date(p.due_date).toISOString().split('T')[0];
      console.log(`- Pago #${p.payment_number}: ${dueDate} - MONTO=$${p.amount} PAGADO=$${p.amount_paid} PENDIENTE=$${p.amount_pending} (${p.status})`);
    });

    // Show contract summary
    const contractSummary = await AppDataSource.query(`
      SELECT total_price, down_payment, remaining_balance, payment_months, monthly_payment, first_payment_date
      FROM contracts 
      WHERE id = ?
    `, [c.id]);

    console.log('\n✓ Contract Summary:');
    console.log(`- Total Price: $${contractSummary[0].total_price}`);
    console.log(`- Down Payment: $${contractSummary[0].down_payment}`);
    console.log(`- Remaining Balance: $${contractSummary[0].remaining_balance}`);
    console.log(`- Payment Months: ${contractSummary[0].payment_months}`);
    console.log(`- Monthly Payment: $${contractSummary[0].monthly_payment}`);
    console.log(`- First Payment Date: ${contractSummary[0].first_payment_date}`);

    await AppDataSource.destroy();
    console.log('\n✓ Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

roxanaCleanRegenerate();
