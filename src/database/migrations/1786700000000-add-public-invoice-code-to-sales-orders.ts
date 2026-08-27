import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddPublicInvoiceCodeToSalesOrders1786700000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('inv_s_sales_orders');
    if (!table?.findColumnByName('public_invoice_code')) {
      await queryRunner.addColumn(
        'inv_s_sales_orders',
        new TableColumn({
          name: 'public_invoice_code',
          type: 'varchar',
          length: '48',
          isNullable: true,
        }),
      );
    }

    const updated = await queryRunner.getTable('inv_s_sales_orders');
    const hasIndex = updated?.indices.some(
      (index) => index.name === 'uq_so_public_invoice_code',
    );
    if (!hasIndex) {
      await queryRunner.createIndex(
        'inv_s_sales_orders',
        new TableIndex({
          name: 'uq_so_public_invoice_code',
          columnNames: ['public_invoice_code'],
          isUnique: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('inv_s_sales_orders');
    const index = table?.indices.find((item) => item.name === 'uq_so_public_invoice_code');
    if (index) {
      await queryRunner.dropIndex('inv_s_sales_orders', 'uq_so_public_invoice_code');
    }
    if (table?.findColumnByName('public_invoice_code')) {
      await queryRunner.dropColumn('inv_s_sales_orders', 'public_invoice_code');
    }
  }
}
