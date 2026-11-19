import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Moneda del documento de la orden de venta: toda la orden es MXN o USD.
 * El tipo de cambio se guarda cuando la orden es en dólares (CFDI TipoCambio).
 */
export class AddSalesOrderCurrency1792700000000 implements MigrationInterface {
  name = 'AddSalesOrderCurrency1792700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('inv_s_sales_orders');
    if (!table?.findColumnByName('currency')) {
      await queryRunner.addColumn(
        'inv_s_sales_orders',
        new TableColumn({
          name: 'currency',
          type: 'varchar',
          length: '3',
          isNullable: false,
          default: "'MXN'",
        }),
      );
    }
    if (!table?.findColumnByName('exchange_rate')) {
      await queryRunner.addColumn(
        'inv_s_sales_orders',
        new TableColumn({
          name: 'exchange_rate',
          type: 'decimal',
          precision: 12,
          scale: 6,
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('inv_s_sales_orders');
    if (table?.findColumnByName('exchange_rate')) {
      await queryRunner.dropColumn('inv_s_sales_orders', 'exchange_rate');
    }
    if (table?.findColumnByName('currency')) {
      await queryRunner.dropColumn('inv_s_sales_orders', 'currency');
    }
  }
}
