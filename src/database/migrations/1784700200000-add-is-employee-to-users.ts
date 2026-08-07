import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddIsEmployeeToUsers1784700200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('users');
    const hasColumn = table?.columns.some((c) => c.name === 'is_employee');

    if (!hasColumn) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'is_employee',
          type: 'tinyint',
          default: 0,
        }),
      );
    }

    console.log('✅ Migration: Added is_employee column to users');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('users');
    const hasColumn = table?.columns.some((c) => c.name === 'is_employee');

    if (hasColumn) {
      await queryRunner.dropColumn('users', 'is_employee');
    }

    console.log('✅ Migration rollback: Dropped is_employee column from users');
  }
}
