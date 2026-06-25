import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class AddUserBranchAndPosFields1779400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'billing_branch_id',
        type: 'varchar',
        length: '36',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'is_pos_user',
        type: 'tinyint',
        default: 0,
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'pos_user_code',
        type: 'int',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'users',
      new TableForeignKey({
        columnNames: ['billing_branch_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'billing_branches',
        onDelete: 'SET NULL',
        name: 'FK_users_billing_branch',
      }),
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'idx_users_billing_branch',
        columnNames: ['billing_branch_id'],
      }),
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'idx_users_tenant_pos_code_unique',
        columnNames: ['tenant_id', 'pos_user_code'],
        isUnique: true,
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'user_billing_branches',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: '(UUID())',
          },
          {
            name: 'user_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'billing_branch_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'tenant_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'user_billing_branches',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
        name: 'FK_user_billing_branches_user',
      }),
    );

    await queryRunner.createForeignKey(
      'user_billing_branches',
      new TableForeignKey({
        columnNames: ['billing_branch_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'billing_branches',
        onDelete: 'CASCADE',
        name: 'FK_user_billing_branches_branch',
      }),
    );

    await queryRunner.createIndex(
      'user_billing_branches',
      new TableIndex({
        name: 'uq_user_billing_branch',
        columnNames: ['user_id', 'billing_branch_id'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'user_billing_branches',
      new TableIndex({
        name: 'idx_user_billing_branches_user',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'user_billing_branches',
      new TableIndex({
        name: 'idx_user_billing_branches_tenant',
        columnNames: ['tenant_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('user_billing_branches');

    const usersTable = await queryRunner.getTable('users');
    const billingBranchFk = usersTable?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('billing_branch_id') !== -1,
    );
    if (billingBranchFk) {
      await queryRunner.dropForeignKey('users', billingBranchFk);
    }

    await queryRunner.dropIndex('users', 'idx_users_billing_branch');
    await queryRunner.dropIndex('users', 'idx_users_tenant_pos_code_unique');
    await queryRunner.dropColumn('users', 'pos_user_code');
    await queryRunner.dropColumn('users', 'is_pos_user');
    await queryRunner.dropColumn('users', 'billing_branch_id');
  }
}
