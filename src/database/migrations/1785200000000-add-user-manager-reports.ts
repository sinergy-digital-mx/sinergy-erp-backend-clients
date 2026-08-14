import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class AddUserManagerReports1785200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const usersTable = await queryRunner.getTable('users');
    const hasIsManager = usersTable?.columns.some((c) => c.name === 'is_manager');

    if (!hasIsManager) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'is_manager',
          type: 'tinyint',
          default: 0,
        }),
      );
    }

    const reportsTable = await queryRunner.getTable('user_manager_reports');
    if (reportsTable) {
      return;
    }

    await queryRunner.createTable(
      new Table({
        name: 'user_manager_reports',
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
            name: 'manager_user_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'report_user_id',
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
      'user_manager_reports',
      new TableForeignKey({
        name: 'FK_user_manager_reports_tenant',
        columnNames: ['tenant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'rbac_tenants',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'user_manager_reports',
      new TableForeignKey({
        name: 'FK_user_manager_reports_manager',
        columnNames: ['manager_user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'user_manager_reports',
      new TableForeignKey({
        name: 'FK_user_manager_reports_report',
        columnNames: ['report_user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'user_manager_reports',
      new TableIndex({
        name: 'idx_user_manager_reports_tenant',
        columnNames: ['tenant_id'],
      }),
    );

    await queryRunner.createIndex(
      'user_manager_reports',
      new TableIndex({
        name: 'idx_user_manager_reports_manager',
        columnNames: ['tenant_id', 'manager_user_id'],
      }),
    );

    await queryRunner.createIndex(
      'user_manager_reports',
      new TableIndex({
        name: 'idx_user_manager_reports_report_unique',
        columnNames: ['tenant_id', 'report_user_id'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const reportsTable = await queryRunner.getTable('user_manager_reports');
    if (reportsTable) {
      await queryRunner.dropTable('user_manager_reports');
    }

    const usersTable = await queryRunner.getTable('users');
    const hasIsManager = usersTable?.columns.some((c) => c.name === 'is_manager');
    if (hasIsManager) {
      await queryRunner.dropColumn('users', 'is_manager');
    }
  }
}
