import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class AddBillingBranchToWarehouses1775830340776 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'warehouses',
      new TableColumn({
        name: 'billing_branch_id',
        type: 'varchar',
        length: '36',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'warehouses',
      new TableForeignKey({
        columnNames: ['billing_branch_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'billing_branches',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createIndex(
      'warehouses',
      new TableIndex({
        name: 'billing_branch_index',
        columnNames: ['billing_branch_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('warehouses');
    const foreignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('billing_branch_id') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('warehouses', foreignKey);
    }

    await queryRunner.dropIndex('warehouses', 'billing_branch_index');
    await queryRunner.dropColumn('warehouses', 'billing_branch_id');
  }
}
