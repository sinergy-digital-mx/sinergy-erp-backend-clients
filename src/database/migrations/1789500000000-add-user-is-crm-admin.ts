import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddUserIsCrmAdmin1789500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const usersTable = await queryRunner.getTable('users');
    const hasColumn = usersTable?.columns.some((c) => c.name === 'is_crm_admin');

    if (!hasColumn) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'is_crm_admin',
          type: 'tinyint',
          default: 0,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const usersTable = await queryRunner.getTable('users');
    const hasColumn = usersTable?.columns.some((c) => c.name === 'is_crm_admin');

    if (hasColumn) {
      await queryRunner.dropColumn('users', 'is_crm_admin');
    }
  }
}
