import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsOverdueToPayments1771250000000 implements MigrationInterface {
  name = 'AddIsOverdueToPayments1771250000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if is_overdue column already exists
    const table = await queryRunner.getTable('payments');
    const isOverdueColumn = table?.findColumnByName('is_overdue');
    
    if (!isOverdueColumn) {
      // Add is_overdue column only if it doesn't exist
      await queryRunner.query(`
        ALTER TABLE \`payments\` 
        ADD COLUMN \`is_overdue\` tinyint NOT NULL DEFAULT 0
      `);
    }

    // Update existing overdue payments
    await queryRunner.query(`
      UPDATE \`payments\` 
      SET \`is_overdue\` = 1 
      WHERE \`status\` = 'atrasado'
    `);

    // Update status back to original for overdue payments
    await queryRunner.query(`
      UPDATE \`payments\` 
      SET \`status\` = 'pendiente' 
      WHERE \`status\` = 'atrasado' AND \`amount_paid\` = 0
    `);

    await queryRunner.query(`
      UPDATE \`payments\` 
      SET \`status\` = 'parcial' 
      WHERE \`status\` = 'atrasado' AND \`amount_paid\` > 0
    `);

    // Update enum to remove 'atrasado'
    await queryRunner.query(`
      ALTER TABLE \`payments\` 
      MODIFY COLUMN \`status\` enum('pagado','pendiente','parcial','cancelado') NOT NULL DEFAULT 'pendiente'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore enum with 'atrasado'
    await queryRunner.query(`
      ALTER TABLE \`payments\` 
      MODIFY COLUMN \`status\` enum('pagado','pendiente','parcial','atrasado','cancelado') NOT NULL DEFAULT 'pendiente'
    `);

    // Restore overdue payments to 'atrasado' status
    await queryRunner.query(`
      UPDATE \`payments\` 
      SET \`status\` = 'atrasado' 
      WHERE \`is_overdue\` = 1
    `);

    // Remove is_overdue column
    await queryRunner.query(`
      ALTER TABLE \`payments\` 
      DROP COLUMN \`is_overdue\`
    `);
  }
}