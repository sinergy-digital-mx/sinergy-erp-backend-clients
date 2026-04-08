import { AppDataSource } from '../data-source';

async function finalFixPayments() {
  try {
    console.log('🔄 Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    console.log('🔄 Final fix for amount_pending...');
    
    await AppDataSource.query(`
      UPDATE contract_payments SET
        amount_pending = CASE 
          WHEN status = 'pagado' THEN 0
          ELSE amount
        END
    `);

    console.log('✅ Final fix completed');

    console.log('🔄 Checking final data...');
    const sampleData = await AppDataSource.query(`
      SELECT payment_number, due_date, amount, amount_paid, amount_pending, status
      FROM contract_payments 
      WHERE status IN ('pagado', 'pendiente')
      LIMIT 6
    `);

    console.log('📊 Final payments data:');
    sampleData.forEach(payment => {
      console.log(`  Payment ${payment.payment_number}: amount=${payment.amount}, paid=${payment.amount_paid}, pending=${payment.amount_pending}, status=${payment.status}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

finalFixPayments();