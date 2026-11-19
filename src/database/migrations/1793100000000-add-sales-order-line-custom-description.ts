import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Concepto libre por línea de la orden de venta (se usa en la orden clonada para
 * cambiar el nombre del producto, por ejemplo el mes del servicio).
 */
export class AddSalesOrderLineCustomDescription1793100000000 implements MigrationInterface {
  name = 'AddSalesOrderLineCustomDescription1793100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('inv_s_sales_order_details');
    if (!table?.findColumnByName('custom_description')) {
      await queryRunner.addColumn(
        'inv_s_sales_order_details',
        new TableColumn({
          name: 'custom_description',
          type: 'varchar',
          length: '255',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('inv_s_sales_order_details');
    if (table?.findColumnByName('custom_description')) {
      await queryRunner.dropColumn('inv_s_sales_order_details', 'custom_description');
    }
  }
}
