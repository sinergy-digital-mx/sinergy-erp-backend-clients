import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddUseAsSystemLogoToFiscalConfigurations1791000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const fiscal = await queryRunner.getTable('fiscal_configurations');
    if (fiscal && !fiscal.findColumnByName('use_as_system_logo')) {
      await queryRunner.addColumn(
        'fiscal_configurations',
        new TableColumn({
          name: 'use_as_system_logo',
          type: 'tinyint',
          width: 1,
          default: 0,
          isNullable: false,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const fiscal = await queryRunner.getTable('fiscal_configurations');
    if (fiscal?.findColumnByName('use_as_system_logo')) {
      await queryRunner.dropColumn('fiscal_configurations', 'use_as_system_logo');
    }
  }
}
