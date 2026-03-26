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

async function cleanPayments() {
  await AppDataSource.initialize();
  console.log('✅ Database connected\n');

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    // Count existing payments
    const countResult = await queryRunner.query(
      `SELECT COUNT(*) as count FROM payments p
       INNER JOIN contracts c ON p.contract_id = c.id
       WHERE c.tenant_id = ?`,
      [TENANT_ID]
    );

    console.log(`📊 Found ${countResult[0].count} payments to delete`);

    // Delete all payments for this tenant
    const deleteResult = await queryRunner.query(
      `DELETE p FROM payments p
       INNER JOIN contracts c ON p.contract_id = c.id
       WHERE c.tenant_id = ?`,
      [TENANT_ID]
    );

    console.log(`🗑️  Deleted ${deleteResult.affectedRows} payments`);

    // Reset contract remaining balances to original values
    await queryRunner.query(
      `UPDATE contracts 
       SET remaining_balance = total_amount
       WHERE tenant_id = ?`,
      [TENANT_ID]
    );

    console.log('✅ Reset contract remaining balances');

  } catch (error) {
    console.error('❌ Clean failed:', error);
    throw error;
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

cleanPayments()
  .then(() => {
    console.log('\n✅ Clean completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Clean failed:', error);
    process.exit(1);
  });