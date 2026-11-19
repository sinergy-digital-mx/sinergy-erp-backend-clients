import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Bandera de orden de venta marcada para envío.
 * No crea el envío: solo indica que después se puede mapear a uno.
 */
export class AddSalesOrderForShipping1795100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('inv_s_sales_orders');
    if (!table?.findColumnByName('for_shipping')) {
      await queryRunner.addColumn(
        'inv_s_sales_orders',
        new TableColumn({
          name: 'for_shipping',
          type: 'tinyint',
          length: '1',
          isNullable: false,
          default: '0',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('inv_s_sales_orders');
    if (table?.findColumnByName('for_shipping')) {
      await queryRunner.dropColumn('inv_s_sales_orders', 'for_shipping');
    }
  }
}
