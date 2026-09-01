import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddVacationCarryoverDays1788000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.ensureColumn(
      queryRunner,
      'employees',
      new TableColumn({
        name: 'vacation_carryover_days',
        type: 'decimal',
        precision: 5,
        scale: 1,
        default: '0',
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('employees');
    if (table?.findColumnByName('vacation_carryover_days')) {
      await queryRunner.dropColumn('employees', 'vacation_carryover_days');
    }
  }

  private async ensureColumn(
    queryRunner: QueryRunner,
    tableName: string,
    column: TableColumn,
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    if (!table?.findColumnByName(column.name)) {
      await queryRunner.addColumn(tableName, column);
    }
  }
}
