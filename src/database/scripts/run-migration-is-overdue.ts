import { DataSource } from 'typeorm';
import { AppDataSource } from '../data-source';

async function runMigration() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    console.log('🔄 Adding is_overdue column...');

    // Add is_overdue column
    await queryRunner.query(`
      ALTER TABLE \`payments\` 
      ADD COLUMN \`is_overdue\` tinyint NOT NULL DEFAULT 0
    `);

    console.log('✅ Added is_overdue column');

    // Update existing overdue payments
    console.log('🔄 Updating existing overdue payments...');
    
    const result1 = await queryRunner.query(`
      UPDATE \`payments\` 
      SET \`is_overdue\` = 1 
      WHERE \`status\` = 'atrasado'
    `);

    console.log(`✅ Marked ${result1.affectedRows} payments as overdue`);

    // Update status back to original for overdue payments
    const result2 = await queryRunner.query(`
      UPDATE \`payments\` 
      SET \`status\` = 'pendiente' 
      WHERE \`status\` = 'atrasado' AND \`amount_paid\` = 0
    `);

    console.log(`✅ Restored ${result2.affectedRows} payments to 'pendiente' status`);

    const result3 = await queryRunner.query(`
      UPDATE \`payments\` 
      SET \`status\` = 'parcial' 
      WHERE \`status\` = 'atrasado' AND \`amount_paid\` > 0
    `);

    console.log(`✅ Restored ${result3.affectedRows} payments to 'parcial' status`);

    // Update enum to remove 'atrasado'
    await queryRunner.query(`
      ALTER TABLE \`payments\` 
      MODIFY COLUMN \`status\` enum('pagado','pendiente','parcial','cancelado') NOT NULL DEFAULT 'pendiente'
    `);

    console.log('✅ Updated status enum');

    await queryRunner.commitTransaction();
    console.log('🎉 Migration completed successfully!');

  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('❌ Error running migration:', error);
    throw error;
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

// Run the migration
runMigration().catch(console.error);