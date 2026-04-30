import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCreditFieldsToCustomers1776204000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.ensureColumn(
      queryRunner,
      'credit_days',
      new TableColumn({
        name: 'credit_days',
        type: 'int',
        isNullable: true,
      }),
    );

    await this.ensureColumn(
      queryRunner,
      'credit_amount',
      new TableColumn({
        name: 'credit_amount',
        type: 'decimal',
        precision: 14,
        scale: 2,
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('customers');
    const hasCreditAmount = table?.findColumnByName('credit_amount');
    const hasCreditDays = table?.findColumnByName('credit_days');

    if (hasCreditAmount) {
      await queryRunner.dropColumn('customers', 'credit_amount');
    }
    if (hasCreditDays) {
      await queryRunner.dropColumn('customers', 'credit_days');
    }
  }

  private async ensureColumn(
    queryRunner: QueryRunner,
    columnName: string,
    column: TableColumn,
  ): Promise<void> {
    const table = await queryRunner.getTable('customers');
    const exists = table?.findColumnByName(columnName);
    if (!exists) {
      await queryRunner.addColumn('customers', column);
    }
  }
}
