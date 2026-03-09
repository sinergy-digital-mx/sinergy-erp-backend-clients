import {
  MigrationInterface,
  QueryRunner,
  TableForeignKey,
} from 'typeorm';

export class AddSalesOrdersForeignKeys1772812800003
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if foreign keys exist
    const table = await queryRunner.getTable('sales_orders');
    const hasCustomerFk = table?.foreignKeys.find(
      (fk) => fk.name === 'fk_sales_orders_customer',
    );

    if (!hasCustomerFk) {
      // Create foreign key to customers
      await queryRunner.createForeignKey(
        'sales_orders',
        new TableForeignKey({
          columnNames: ['customer_id'],
          referencedTableName: 'customers',
          referencedColumnNames: ['id'],
          onDelete: 'RESTRICT',
          name: 'fk_sales_orders_customer',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    await queryRunner.dropForeignKey(
      'sales_orders',
      'fk_sales_orders_customer',
    );
  }
}
