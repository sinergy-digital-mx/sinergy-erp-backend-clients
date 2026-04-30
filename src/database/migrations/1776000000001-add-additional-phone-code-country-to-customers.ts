import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAdditionalPhoneCodeCountryToCustomers1776000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.ensureColumn(
      queryRunner,
      'additional_phone_country',
      new TableColumn({
        name: 'additional_phone_country',
        type: 'varchar',
        length: '2',
        isNullable: true,
      }),
    );

    await this.ensureColumn(
      queryRunner,
      'additional_phone_code',
      new TableColumn({
        name: 'additional_phone_code',
        type: 'varchar',
        length: '10',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('customers');
    const hasAdditionalPhoneCode = table?.findColumnByName('additional_phone_code');
    const hasAdditionalPhoneCountry = table?.findColumnByName('additional_phone_country');

    if (hasAdditionalPhoneCode) {
      await queryRunner.dropColumn('customers', 'additional_phone_code');
    }
    if (hasAdditionalPhoneCountry) {
      await queryRunner.dropColumn('customers', 'additional_phone_country');
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
