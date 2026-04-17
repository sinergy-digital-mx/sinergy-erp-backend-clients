import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAdditionalPhoneCodeCountryToCustomers1776000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'customers',
      new TableColumn({
        name: 'additional_phone_country',
        type: 'varchar',
        length: '2',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'customers',
      new TableColumn({
        name: 'additional_phone_code',
        type: 'varchar',
        length: '10',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('customers', 'additional_phone_code');
    await queryRunner.dropColumn('customers', 'additional_phone_country');
  }
}
