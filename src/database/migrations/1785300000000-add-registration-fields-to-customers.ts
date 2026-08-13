import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class AddRegistrationFieldsToCustomers1785300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.ensureColumn(
      queryRunner,
      'registered_billing_branch_id',
      new TableColumn({
        name: 'registered_billing_branch_id',
        type: 'varchar',
        length: '36',
        isNullable: true,
      }),
    );

    await this.ensureColumn(
      queryRunner,
      'registered_by_user_id',
      new TableColumn({
        name: 'registered_by_user_id',
        type: 'varchar',
        length: '36',
        isNullable: true,
      }),
    );

    const table = await queryRunner.getTable('customers');

    if (!table?.indices.find((idx) => idx.name === 'idx_customers_registered_billing_branch_id')) {
      await queryRunner.createIndex(
        'customers',
        new TableIndex({
          name: 'idx_customers_registered_billing_branch_id',
          columnNames: ['registered_billing_branch_id'],
        }),
      );
    }

    if (!table?.indices.find((idx) => idx.name === 'idx_customers_registered_by_user_id')) {
      await queryRunner.createIndex(
        'customers',
        new TableIndex({
          name: 'idx_customers_registered_by_user_id',
          columnNames: ['registered_by_user_id'],
        }),
      );
    }

    if (!table?.foreignKeys.find((fk) => fk.name === 'fk_customers_registered_billing_branch_id')) {
      await queryRunner.createForeignKey(
        'customers',
        new TableForeignKey({
          name: 'fk_customers_registered_billing_branch_id',
          columnNames: ['registered_billing_branch_id'],
          referencedTableName: 'billing_branches',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      );
    }

    if (!table?.foreignKeys.find((fk) => fk.name === 'fk_customers_registered_by_user_id')) {
      await queryRunner.createForeignKey(
        'customers',
        new TableForeignKey({
          name: 'fk_customers_registered_by_user_id',
          columnNames: ['registered_by_user_id'],
          referencedTableName: 'users',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('customers');

    const branchFk = table?.foreignKeys.find(
      (fk) => fk.name === 'fk_customers_registered_billing_branch_id',
    );
    if (branchFk) {
      await queryRunner.dropForeignKey('customers', branchFk);
    }

    const userFk = table?.foreignKeys.find(
      (fk) => fk.name === 'fk_customers_registered_by_user_id',
    );
    if (userFk) {
      await queryRunner.dropForeignKey('customers', userFk);
    }

    const branchIdx = table?.indices.find(
      (idx) => idx.name === 'idx_customers_registered_billing_branch_id',
    );
    if (branchIdx) {
      await queryRunner.dropIndex('customers', branchIdx);
    }

    const userIdx = table?.indices.find(
      (idx) => idx.name === 'idx_customers_registered_by_user_id',
    );
    if (userIdx) {
      await queryRunner.dropIndex('customers', userIdx);
    }

    for (const columnName of ['registered_billing_branch_id', 'registered_by_user_id']) {
      const currentTable = await queryRunner.getTable('customers');
      if (currentTable?.findColumnByName(columnName)) {
        await queryRunner.dropColumn('customers', columnName);
      }
    }
  }

  private async ensureColumn(
    queryRunner: QueryRunner,
    columnName: string,
    column: TableColumn,
  ): Promise<void> {
    const table = await queryRunner.getTable('customers');
    if (!table?.findColumnByName(columnName)) {
      await queryRunner.addColumn('customers', column);
    }
  }
}
