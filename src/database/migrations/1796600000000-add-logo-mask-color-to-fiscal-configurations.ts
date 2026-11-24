import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Color plano opcional del logo en el menú.
 * Vacío = el archivo se ve como se subió. El PNG en almacenamiento no cambia.
 */
export class AddLogoMaskColorToFiscalConfigurations1796600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('fiscal_configurations');
    if (table?.findColumnByName('logo_mask_color')) {
      return;
    }
    await queryRunner.addColumn(
      'fiscal_configurations',
      new TableColumn({
        name: 'logo_mask_color',
        type: 'varchar',
        length: '7',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('fiscal_configurations');
    if (table?.findColumnByName('logo_mask_color')) {
      await queryRunner.dropColumn('fiscal_configurations', 'logo_mask_color');
    }
  }
}
