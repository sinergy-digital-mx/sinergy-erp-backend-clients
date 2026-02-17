import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddIsAdminToRoles1770000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('rbac_roles');
    const columnExists = table?.columns.some(col => col.name === 'is_admin');

    if (!columnExists) {
      await queryRunner.addColumn(
        'rbac_roles',
        new TableColumn({
          name: 'is_admin',
          type: 'boolean',
          default: false,
          isNullable: false,
        })
      );

      // Mark the existing Admin role as admin
      await queryRunner.query(
        `UPDATE rbac_roles SET is_admin = true WHERE name = 'Admin'`
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('rbac_roles');
    const columnExists = table?.columns.some(col => col.name === 'is_admin');

    if (columnExists) {
      await queryRunner.dropColumn('rbac_roles', 'is_admin');
    }
  }
}
