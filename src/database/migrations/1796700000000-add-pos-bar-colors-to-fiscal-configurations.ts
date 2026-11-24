import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Color opcional de la barra de POS Ventas y de POS Caja, por razón social.
 * Vacío = la barra sigue en el tono oscuro de siempre.
 */
export class AddPosBarColorsToFiscalConfigurations1796700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.ensureColumn(
      queryRunner,
      new TableColumn({
        name: 'pos_sales_bar_color',
        type: 'varchar',
        length: '7',
        isNullable: true,
      }),
    );
    await this.ensureColumn(
      queryRunner,
      new TableColumn({
        name: 'pos_cash_bar_color',
        type: 'varchar',
        length: '7',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('fiscal_configurations');
    for (const name of ['pos_cash_bar_color', 'pos_sales_bar_color']) {
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
