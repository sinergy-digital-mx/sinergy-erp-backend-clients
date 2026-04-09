import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class AddSellerIdToContracts1773600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add seller_id column
    await queryRunner.addColumn(
      'contracts',
      new TableColumn({
        name: 'seller_id',
        type: 'varchar',
        length: '36',
        isNullable: true,
      }),
    );

    // Create index on seller_id
    await queryRunner.createIndex(
      'contracts',
      new TableIndex({
        name: 'IDX_contracts_seller_id',
        columnNames: ['seller_id'],
      }),
    );

    // Add foreign key to users table
    await queryRunner.createForeignKey(
      'contracts',
      new TableForeignKey({
        columnNames: ['seller_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    const table = await queryRunner.getTable('contracts');
    if (table) {
      const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf('seller_id') !== -1);
      if (foreignKey) {
        await queryRunner.dropForeignKey('contracts', foreignKey);
      }
    }

    // Drop index
    await queryRunner.dropIndex('contracts', 'IDX_contracts_seller_id');

    // Drop column
    await queryRunner.dropColumn('contracts', 'seller_id');
  }
}
