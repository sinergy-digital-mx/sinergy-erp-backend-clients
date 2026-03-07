import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class AddFiscalConfigurationToWarehouses1700000000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add fiscal_configuration_id column to warehouses
    await queryRunner.addColumn(
      'warehouses',
      new TableColumn({
        name: 'fiscal_configuration_id',
        type: 'varchar',
        length: '36',
        isNullable: true,
      }),
    );

    // Add foreign key
    await queryRunner.createForeignKey(
      'warehouses',
      new TableForeignKey({
        columnNames: ['fiscal_configuration_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'fiscal_configurations',
        onDelete: 'SET NULL',
      }),
    );

    // Add index
    await queryRunner.createIndex(
      'warehouses',
      new TableIndex({
        name: 'fiscal_configuration_index',
        columnNames: ['fiscal_configuration_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    const table = await queryRunner.getTable('warehouses');
    const foreignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('fiscal_configuration_id') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('warehouses', foreignKey);
    }

    // Drop index
    await queryRunner.dropIndex('warehouses', 'fiscal_configuration_index');

    // Drop column
    await queryRunner.dropColumn('warehouses', 'fiscal_configuration_id');
  }
}
