import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddWorkScheduleToEmployees1794500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('employees');
    if (table?.findColumnByName('work_schedule')) {
      return;
    }
    await queryRunner.addColumn(
      'employees',
      new TableColumn({
        name: 'work_schedule',
        type: 'json',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('employees', 'work_schedule');
  }
}
