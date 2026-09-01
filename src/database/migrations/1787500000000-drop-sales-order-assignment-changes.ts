import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropSalesOrderAssignmentChanges1787500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('inv_s_sales_order_assignment_changes');
    if (table) {
      await queryRunner.dropTable('inv_s_sales_order_assignment_changes');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`inv_s_sales_order_assignment_changes\` (
        \`id\` varchar(36) NOT NULL,
        \`tenant_id\` varchar(36) NOT NULL,
        \`sales_order_id\` varchar(36) NOT NULL,
        \`type\` varchar(50) NOT NULL,
        \`title\` varchar(255) NOT NULL,
        \`description\` text NULL,
        \`actor_id\` varchar(36) NULL,
        \`occurred_at\` timestamp NOT NULL,
        \`changes\` json NULL,
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      )
    `);
  }
}
