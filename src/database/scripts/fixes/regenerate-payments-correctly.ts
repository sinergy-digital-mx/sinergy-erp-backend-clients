import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const TENANT_ID = '54481b63-5516-458d-9bb3-d4e5cb028864';

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  synchronize: false,
  logging: false,
});

async function regeneratePaymentsCorrectly() {
  await AppDataSource.initialize();
  console.log('✅ Database connected\n');

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    console.log('🔧 REGENERANDO PAGOS CORRECTAMENTE...\n');

    // Get all payments for the tenant
    const payments = await queryRunner.query(`
      SELECT p.*, c.id as contract_id
      FROM contract_payments p
      INNER JOIN contracts c ON p.contract_id = c.id
      WHERE c.tenant_id = ?
    `, [TENANT_ID]);

    console.log(`📊 Found ${payments.length} payments to fix\n`);

    let updatedCount = 0;

    for (const payment of payments) {
      // amount = amount_paid (the monthly amount - FIXED)
      const monthlyAmount = Number(payment.amount_paid) || 0;
      
      // For paid payments: amount_paid = monthlyAmount, amount_pending = 0
      // For pending payments: amount_paid = 0, amount_pending = monthlyAmount
      let actualAmountPaid = 0;
      let actualAmountPending = monthlyAmount;
      
      if (payment.status === 'pagado') {
        actualAmountPaid = monthlyAmount;
        actualAmountPending = 0;
      }

      await queryRunner.query(`
        UPDATE contract_payments 
        SET 
          amount = ?,
          amount_paid = ?,
          amount_pending = ?
        WHERE id = ?
      `, [monthlyAmount, actualAmountPaid, actualAmountPending, payment.id]);

      updatedCount++;
      
      if (updatedCount % 100 === 0) {
        console.log(`✅ Updated ${updatedCount} payments...`);
      }
    }

    console.log('\n=== RESUMEN ===');
    console.log(`✅ Pagos actualizados: ${updatedCount}`);
    console.log(`✅ amount = monto mensual fijo`);
    console.log(`✅ amount_paid = 0 para pendientes, monto completo para pagados`);
    console.log(`✅ amount_pending = monto completo para pendientes, 0 para pagados`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

regeneratePaymentsCorrectly()
  .then(() => {
    console.log('\n✅ Pagos regenerados correctamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });