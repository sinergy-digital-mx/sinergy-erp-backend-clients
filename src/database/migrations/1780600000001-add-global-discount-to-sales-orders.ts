import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddGlobalDiscountToSalesOrders1780600000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'inv_s_sales_orders',
      new TableColumn({
        name: 'global_discount_id',
        type: 'varchar',
        length: '36',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'inv_s_sales_orders',
      new TableColumn({
        name: 'global_discount_amount',
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0,
      }),
    );

    await queryRunner.createForeignKey(
      'inv_s_sales_orders',
      new TableForeignKey({
        columnNames: ['global_discount_id'],
        referencedTableName: 'global_discounts',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('inv_s_sales_orders');
    const fk = table?.foreignKeys.find((key) => key.columnNames.includes('global_discount_id'));
    if (fk) {
      await queryRunner.dropForeignKey('inv_s_sales_orders', fk);
    }
    await queryRunner.dropColumn('inv_s_sales_orders', 'global_discount_amount');
    await queryRunner.dropColumn('inv_s_sales_orders', 'global_discount_id');
  }
}
