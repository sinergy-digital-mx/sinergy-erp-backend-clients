import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class AddFiscalConfigurationToContracts1793500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('contracts');
    if (!table?.findColumnByName('fiscal_configuration_id')) {
      await queryRunner.addColumn(
        'contracts',
        new TableColumn({
          name: 'fiscal_configuration_id',
          type: 'varchar',
          length: '36',
          isNullable: true,
        }),
      );
    }

    const refreshed = await queryRunner.getTable('contracts');
    if (refreshed && !refreshed.indices.find((index) => index.name === 'IDX_contracts_fiscal_configuration_id')) {
      await queryRunner.createIndex(
        'contracts',
        new TableIndex({
          name: 'IDX_contracts_fiscal_configuration_id',
          columnNames: ['fiscal_configuration_id'],
        }),
      );
    }

    if (
      refreshed &&
      !refreshed.foreignKeys.find((fk) => fk.columnNames.includes('fiscal_configuration_id'))
    ) {
      await queryRunner.createForeignKey(
        'contracts',
        new TableForeignKey({
          columnNames: ['fiscal_configuration_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'fiscal_configurations',
          onDelete: 'SET NULL',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('contracts');
    if (!table) return;

    const foreignKey = table.foreignKeys.find((fk) =>
      fk.columnNames.includes('fiscal_configuration_id'),
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('contracts', foreignKey);
    }

    if (table.indices.find((index) => index.name === 'IDX_contracts_fiscal_configuration_id')) {
      await queryRunner.dropIndex('contracts', 'IDX_contracts_fiscal_configuration_id');
    }

    if (table.findColumnByName('fiscal_configuration_id')) {
      await queryRunner.dropColumn('contracts', 'fiscal_configuration_id');
    }
  }
}
