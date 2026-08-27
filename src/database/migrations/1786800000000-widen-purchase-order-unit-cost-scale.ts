import { MigrationInterface, QueryRunner } from 'typeorm';

export class WidenPurchaseOrderUnitCostScale1786800000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE inv_s_purchase_order_batch_detail
        MODIFY COLUMN unit_total DECIMAL(16,4) NOT NULL,
        MODIFY COLUMN received_original_unit_total DECIMAL(16,4) NULL
    `);
    await queryRunner.query(`
      ALTER TABLE product_vendor_costs
        MODIFY COLUMN cost DECIMAL(16,4) NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE inv_s_purchase_order_batch_detail
        MODIFY COLUMN unit_total DECIMAL(12,2) NOT NULL,
        MODIFY COLUMN received_original_unit_total DECIMAL(12,2) NULL
    `);
    await queryRunner.query(`
      ALTER TABLE product_vendor_costs
        MODIFY COLUMN cost DECIMAL(12,2) NOT NULL
    `);
  }
}
