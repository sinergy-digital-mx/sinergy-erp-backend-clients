import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Tres colores del degradado del menú, por razón social.
 * El que está marcado como logo del sistema es el que pinta la barra.
 */
export class AddBrandColorsToFiscalConfigurations1796500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.ensureColumn(
      queryRunner,
      new TableColumn({
        name: 'brand_color_start',
        type: 'varchar',
        length: '7',
        isNullable: true,
      }),
    );
    await this.ensureColumn(
      queryRunner,
      new TableColumn({
        name: 'brand_color_mid',
        type: 'varchar',
        length: '7',
        isNullable: true,
      }),
    );
    await this.ensureColumn(
      queryRunner,
      new TableColumn({
        name: 'brand_color_end',
        type: 'varchar',
        length: '7',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('fiscal_configurations');
    for (const name of ['brand_color_end', 'brand_color_mid', 'brand_color_start']) {
      if (table?.findColumnByName(name)) {
        await queryRunner.dropColumn('fiscal_configurations', name);
      }
    }
  }

  private async ensureColumn(queryRunner: QueryRunner, column: TableColumn): Promise<void> {
    const table = await queryRunner.getTable('fiscal_configurations');
    if (!table?.findColumnByName(column.name)) {
      await queryRunner.addColumn('fiscal_configurations', column);
    }
  }
}
