import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAdditionalPersonToCustomers1776000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.ensureColumn(
      queryRunner,
      'additional_name',
      new TableColumn({
        name: 'additional_name',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );

    await this.ensureColumn(
      queryRunner,
      'additional_lastname',
      new TableColumn({
        name: 'additional_lastname',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );

    await this.ensureColumn(
      queryRunner,
      'additional_email',
      new TableColumn({
        name: 'additional_email',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );

    await this.ensureColumn(
      queryRunner,
      'additional_phone',
      new TableColumn({
        name: 'additional_phone',
        type: 'varchar',
        length: '50',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('customers');
    const hasAdditionalPhone = table?.findColumnByName('additional_phone');
    const hasAdditionalEmail = table?.findColumnByName('additional_email');
    const hasAdditionalLastname = table?.findColumnByName('additional_lastname');
    const hasAdditionalName = table?.findColumnByName('additional_name');

    if (hasAdditionalPhone) await queryRunner.dropColumn('customers', 'additional_phone');
    if (hasAdditionalEmail) await queryRunner.dropColumn('customers', 'additional_email');
    if (hasAdditionalLastname) await queryRunner.dropColumn('customers', 'additional_lastname');
    if (hasAdditionalName) await queryRunner.dropColumn('customers', 'additional_name');
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
