import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddGroupFkToCustomers1770900000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('customers');
    
    // Add group_id column if it doesn't exist
    if (!table?.findColumnByName('group_id')) {
      await queryRunner.addColumn(
        'customers',
        new TableColumn({
          name: 'group_id',
          type: 'varchar',
          isNullable: true,
        }),
      );

      // Add foreign key
      await queryRunner.createForeignKey(
        'customers',
        new TableForeignKey({
          columnNames: ['group_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'customer_groups',
          onDelete: 'SET NULL',
          name: 'FK_customers_group_id',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('customers');
    const foreignKey = table?.foreignKeys.find(fk => fk.columnNames.indexOf('group_id') !== -1);
    if (foreignKey) {
      await queryRunner.dropForeignKey('customers', foreignKey);
    }

    const columnExists = table?.findColumnByName('group_id');
    if (columnExists) {
      await queryRunner.dropColumn('customers', 'group_id');
    }
  }
}
