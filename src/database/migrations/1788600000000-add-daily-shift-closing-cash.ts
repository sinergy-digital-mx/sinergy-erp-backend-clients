import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDailyShiftClosingCash1788600000000 implements MigrationInterface {
  private async hasColumn(
    queryRunner: QueryRunner,
    tableName: string,
    columnName: string,
  ): Promise<boolean> {
    const result = await queryRunner.query(
      `
      SELECT 1
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
      LIMIT 1
      `,
      [tableName, columnName],
    );
    return result.length > 0;
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    const columns: TableColumn[] = [
      new TableColumn({
        name: 'closing_cash_mxn',
        type: 'decimal',
        precision: 12,
        scale: 2,
        isNullable: true,
      }),
      new TableColumn({
        name: 'closing_cash_usd',
        type: 'decimal',
        precision: 12,
        scale: 2,
        isNullable: true,
      }),
      new TableColumn({
        name: 'expected_cash_mxn',
        type: 'decimal',
        precision: 12,
        scale: 2,
        isNullable: true,
      }),
      new TableColumn({
        name: 'expected_cash_usd',
        type: 'decimal',
        precision: 12,
        scale: 2,
        isNullable: true,
      }),
      new TableColumn({
        name: 'cash_difference_mxn',
        type: 'decimal',
        precision: 12,
        scale: 2,
        isNullable: true,
      }),
      new TableColumn({
        name: 'cash_difference_usd',
        type: 'decimal',
        precision: 12,
        scale: 2,
        isNullable: true,
      }),
      new TableColumn({
        name: 'closing_denominations',
        type: 'json',
        isNullable: true,
      }),
    ];

    for (const column of columns) {
      if (!(await this.hasColumn(queryRunner, 'pos_daily_shifts', column.name))) {
        await queryRunner.addColumn('pos_daily_shifts', column);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const names = [
      'closing_denominations',
      'cash_difference_usd',
      'cash_difference_mxn',
      'expected_cash_usd',
      'expected_cash_mxn',
      'closing_cash_usd',
      'closing_cash_mxn',
    ];
    for (const name of names) {
      if (await this.hasColumn(queryRunner, 'pos_daily_shifts', name)) {
        await queryRunner.dropColumn('pos_daily_shifts', name);
      }
    }
  }
}
