import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class AddBillingBranchToSalesOrders1787300000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('inv_s_sales_orders');
    if (!table) {
      return;
    }

    if (!table.findColumnByName('billing_branch_id')) {
      await queryRunner.addColumn(
        'inv_s_sales_orders',
        new TableColumn({
          name: 'billing_branch_id',
          type: 'varchar',
          length: '36',
          isNullable: true,
        }),
      );
    }

    await queryRunner.query(`
      UPDATE inv_s_sales_orders so
      INNER JOIN warehouses w ON w.id = so.warehouse_id
      SET so.billing_branch_id = w.billing_branch_id
      WHERE so.billing_branch_id IS NULL
        AND w.billing_branch_id IS NOT NULL
    `);

    const warehouseCol = table.findColumnByName('warehouse_id');
    if (warehouseCol && !warehouseCol.isNullable) {
      await queryRunner.changeColumn(
        'inv_s_sales_orders',
        'warehouse_id',
        new TableColumn({
          name: 'warehouse_id',
          type: 'varchar',
          length: '36',
          isNullable: true,
        }),
      );
    }

    const updated = await queryRunner.getTable('inv_s_sales_orders');
    const hasBranchIndex = updated?.indices.some(
      (index) => index.name === 'idx_so_billing_branch',
    );
    if (!hasBranchIndex) {
      await queryRunner.createIndex(
        'inv_s_sales_orders',
        new TableIndex({
          name: 'idx_so_billing_branch',
          columnNames: ['billing_branch_id'],
        }),
      );
    }

    const hasBranchFk = updated?.foreignKeys.some(
      (fk) => fk.name === 'fk_so_billing_branch',
    );
    if (!hasBranchFk) {
      await queryRunner.createForeignKey(
        'inv_s_sales_orders',
        new TableForeignKey({
          name: 'fk_so_billing_branch',
          columnNames: ['billing_branch_id'],
          referencedTableName: 'billing_branches',
          referencedColumnNames: ['id'],
          onDelete: 'RESTRICT',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('inv_s_sales_orders');
    if (!table) {
      return;
    }

    const branchFk = table.foreignKeys.find((fk) => fk.name === 'fk_so_billing_branch');
    if (branchFk) {
      await queryRunner.dropForeignKey('inv_s_sales_orders', branchFk);
    }

    const branchIndex = table.indices.find((index) => index.name === 'idx_so_billing_branch');
    if (branchIndex) {
      await queryRunner.dropIndex('inv_s_sales_orders', branchIndex);
    }

    if (table.findColumnByName('billing_branch_id')) {
      await queryRunner.dropColumn('inv_s_sales_orders', 'billing_branch_id');
    }

    const warehouseCol = table.findColumnByName('warehouse_id');
    if (warehouseCol?.isNullable) {
      await queryRunner.changeColumn(
        'inv_s_sales_orders',
        'warehouse_id',
        new TableColumn({
          name: 'warehouse_id',
          type: 'varchar',
          length: '36',
          isNullable: false,
        }),
      );
    }
  }
}
