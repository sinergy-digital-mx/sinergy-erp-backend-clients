import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/** Lista usada como precio de referencia en los márgenes. */
export class AddPriceListMarginDefault1796200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('product_price_lists');
    if (table && !table.findColumnByName('is_margin_default')) {
      await queryRunner.addColumn(
        'product_price_lists',
        new TableColumn({
          name: 'is_margin_default',
          type: 'tinyint',
          width: 1,
          default: 0,
          isNullable: false,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('product_price_lists');
    if (table?.findColumnByName('is_margin_default')) {
      await queryRunner.dropColumn('product_price_lists', 'is_margin_default');
    }
  }
}
