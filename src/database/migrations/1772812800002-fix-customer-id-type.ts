import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixCustomerIdType1772812800002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if customer_id column exists
    const table = await queryRunner.getTable('sales_orders');
    const customerIdColumn = table?.columns.find(
      (col) => col.name === 'customer_id',
    );

    if (customerIdColumn) {
      // Drop the existing customer_id column
      await queryRunner.query(
        'ALTER TABLE `sales_orders` DROP COLUMN `customer_id`',
      );
    }

    // Add customer_id column with correct type (int)
    await queryRunner.query(
      'ALTER TABLE `sales_orders` ADD COLUMN `customer_id` INT NULL AFTER `tenant_id`',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop customer_id column
    await queryRunner.query(
      'ALTER TABLE `sales_orders` DROP COLUMN `customer_id`',
    );
  }
}
