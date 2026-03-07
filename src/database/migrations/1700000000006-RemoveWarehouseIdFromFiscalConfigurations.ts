import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

export class RemoveWarehouseIdFromFiscalConfigurations1700000000006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key if exists
    const table = await queryRunner.getTable('fiscal_configurations');
    if (table) {
      const foreignKey = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('warehouse_id') !== -1,
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey('fiscal_configurations', foreignKey);
      }

      // Drop index if exists
      const index = table.indices.find(
        (idx) => idx.columnNames.includes('warehouse_id'),
      );
      if (index) {
        await queryRunner.dropIndex('fiscal_configurations', index);
      }
    }

    // Drop column
    await queryRunner.dropColumn('fiscal_configurations', 'warehouse_id');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // This is a destructive migration, no rollback needed
  }
}
