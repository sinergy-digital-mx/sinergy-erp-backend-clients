import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixPoDetailUomColumn1712145600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the old foreign key constraint
    await queryRunner.query(
      `ALTER TABLE inv_s_purchase_order_batch_detail DROP FOREIGN KEY fk_po_detail_uom`,
    );

    // Drop the old uom_id column
    await queryRunner.query(
      `ALTER TABLE inv_s_purchase_order_batch_detail DROP COLUMN uom_id`,
    );

    // Add the new product_uom_id column
    await queryRunner.query(
      `ALTER TABLE inv_s_purchase_order_batch_detail ADD COLUMN product_uom_id VARCHAR(36) NULL`,
    );

    // Add the new foreign key constraint
    await queryRunner.query(
      `ALTER TABLE inv_s_purchase_order_batch_detail ADD CONSTRAINT fk_po_detail_product_uom FOREIGN KEY (product_uom_id) REFERENCES product_uoms(id)`,
    );

    // Clear test data
    await queryRunner.query(
      `DELETE FROM inv_s_purchase_order_batch_detail`,
    );
    await queryRunner.query(
      `DELETE FROM inv_s_purchase_order_batch`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the new foreign key constraint
    await queryRunner.query(
      `ALTER TABLE inv_s_purchase_order_batch_detail DROP FOREIGN KEY fk_po_detail_product_uom`,
    );

    // Drop the new product_uom_id column
    await queryRunner.query(
      `ALTER TABLE inv_s_purchase_order_batch_detail DROP COLUMN product_uom_id`,
    );

    // Add back the old uom_id column
    await queryRunner.query(
      `ALTER TABLE inv_s_purchase_order_batch_detail ADD COLUMN uom_id VARCHAR(36) NOT NULL`,
    );

    // Add back the old foreign key constraint
    await queryRunner.query(
      `ALTER TABLE inv_s_purchase_order_batch_detail ADD CONSTRAINT fk_po_detail_uom FOREIGN KEY (uom_id) REFERENCES uom_catalog(id)`,
    );
  }
}
