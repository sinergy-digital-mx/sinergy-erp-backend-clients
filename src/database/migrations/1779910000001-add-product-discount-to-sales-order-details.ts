import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddProductDiscountToSalesOrderDetails1779910000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'inv_s_sales_order_details',
      new TableColumn({
        name: 'product_discount_id',
        type: 'varchar',
        length: '36',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'inv_s_sales_order_details',
      new TableForeignKey({
        columnNames: ['product_discount_id'],
        referencedTableName: 'product_discounts',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('inv_s_sales_order_details');
    const fk = table?.foreignKeys.find((key) => key.columnNames.includes('product_discount_id'));
    if (fk) {
      await queryRunner.dropForeignKey('inv_s_sales_order_details', fk);
    }
    await queryRunner.dropColumn('inv_s_sales_order_details', 'product_discount_id');
  }
}
