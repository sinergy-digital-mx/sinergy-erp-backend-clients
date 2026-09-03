import { MigrationInterface, QueryRunner } from 'typeorm';

export class WidenSalesUnitPriceScale1788600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE inv_s_sales_order_details
        MODIFY COLUMN unit_price DECIMAL(16,4) NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE inv_s_quotation_details
        MODIFY COLUMN unit_price DECIMAL(16,4) NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE product_prices
        MODIFY COLUMN price DECIMAL(16,4) NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE inv_s_sales_order_details
        MODIFY COLUMN unit_price DECIMAL(12,2) NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE inv_s_quotation_details
        MODIFY COLUMN unit_price DECIMAL(12,2) NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE product_prices
        MODIFY COLUMN price DECIMAL(12,2) NOT NULL
    `);
  }
}
