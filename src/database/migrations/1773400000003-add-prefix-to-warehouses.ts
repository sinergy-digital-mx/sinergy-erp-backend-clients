import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddPrefixToWarehouses1773400000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add prefix column after code column
    await queryRunner.addColumn(
      'warehouses',
      new TableColumn({
        name: 'prefix',
        type: 'varchar',
        length: '10',
        isNullable: true,
      }),
    );

    // Create index on prefix column
    await queryRunner.createIndex(
      'warehouses',
      new TableIndex({
        name: 'idx_prefix',
        columnNames: ['prefix'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index first
    await queryRunner.dropIndex('warehouses', 'idx_prefix');

    // Drop prefix column
    await queryRunner.dropColumn('warehouses', 'prefix');
  }
}
