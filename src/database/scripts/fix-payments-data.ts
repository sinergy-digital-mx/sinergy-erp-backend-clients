import { AppDataSource } from '../data-source';

async function fixPaymentsData() {
  try {
    console.log('🔄 Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    console.log('🔄 Fixing payments data structure...');
    
    // Fix the data structure:
    // 1. Move payment_date to due_date
    // 2. Move amount_paid to amount (total amount to pay)
    // 3. Set amount_paid based on status (if paid = amount, if not = 0)
    // 4. Calculate amount_pending
    
    await AppDataSource.query(`
      UPDATE payments SET
        due_date = payment_date,
        amount = amount_paid,
        amount_paid = CASE 
          WHEN status = 'pagado' THEN amount_paid
          ELSE 0
        END,
        amount_pending = CASE 
          WHEN status = 'pagado' THEN 0
          ELSE amount_paid
        END,
        paid_date = CASE 
          WHEN status = 'pagado' THEN payment_date
          ELSE NULL
        END
    `);

    console.log('✅ Payments data structure fixed');

    console.log('🔄 Checking fixed data...');
    const sampleData = await AppDataSource.query(`
      SELECT id, payment_number, due_date, amount, amount_paid, amount_pending, status, paid_date
      FROM payments 
      LIMIT 5
    `);

    console.log('📊 Fixed payments data:');
    sampleData.forEach(payment => {
      console.log(`  Payment ${payment.payment_number}: due=${payment.due_date}, amount=${payment.amount}, paid=${payment.amount_paid}, pending=${payment.amount_pending}, status=${payment.status}`);
    });

  } catch (error) {
    console.error('❌ Error fixing data:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

fixPaymentsData();