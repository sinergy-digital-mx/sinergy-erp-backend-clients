import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPhoneCodeCountryToCustomers1771600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'customers',
      new TableColumn({
        name: 'phone_code',
        type: 'varchar',
        length: '10',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'customers',
      new TableColumn({
        name: 'country',
        type: 'varchar',
        length: '100',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('customers', 'country');
    await queryRunner.dropColumn('customers', 'phone_code');
  }
}
