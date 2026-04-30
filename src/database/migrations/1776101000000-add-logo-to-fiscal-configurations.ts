import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddLogoToFiscalConfigurations1776101000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'fiscal_configurations',
      new TableColumn({
        name: 'logo',
        type: 'varchar',
        length: '500',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('fiscal_configurations', 'logo');
  }
}
