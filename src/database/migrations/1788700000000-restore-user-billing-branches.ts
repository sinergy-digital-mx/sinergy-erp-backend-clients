import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class RestoreUserBillingBranches1788700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const existing = await queryRunner.getTable('user_billing_branches');
    if (!existing) {
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
              name: 'tenant_id',
              type: 'varchar',
              length: '36',
              isNullable: false,
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
              name: 'is_primary',
              type: 'tinyint',
              default: 0,
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
          columnNames: ['tenant_id', 'user_id'],
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

    await queryRunner.query(`
      INSERT INTO user_billing_branches (id, tenant_id, user_id, billing_branch_id, is_primary, created_at)
      SELECT UUID(), u.tenant_id, u.id, u.billing_branch_id, 1, CURRENT_TIMESTAMP
      FROM users u
      WHERE u.billing_branch_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM user_billing_branches ub
          WHERE ub.user_id = u.id
            AND ub.billing_branch_id = u.billing_branch_id
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('user_billing_branches');
    if (table) {
      await queryRunner.dropTable('user_billing_branches');
    }
  }
}
