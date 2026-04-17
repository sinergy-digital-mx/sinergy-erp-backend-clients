import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAdditionalPersonToCustomers1776000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'customers',
      new TableColumn({
        name: 'additional_name',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'customers',
      new TableColumn({
        name: 'additional_lastname',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'customers',
      new TableColumn({
        name: 'additional_email',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'customers',
      new TableColumn({
        name: 'additional_phone',
        type: 'varchar',
        length: '50',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('customers', 'additional_phone');
    await queryRunner.dropColumn('customers', 'additional_email');
    await queryRunner.dropColumn('customers', 'additional_lastname');
    await queryRunner.dropColumn('customers', 'additional_name');
  }
}
