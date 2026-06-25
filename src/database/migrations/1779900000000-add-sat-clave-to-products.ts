import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddSatClaveToProducts1779900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('products');
    if (!table?.findColumnByName('sat_clave')) {
      await queryRunner.addColumn(
        'products',
        new TableColumn({
          name: 'sat_clave',
          type: 'varchar',
          length: '8',
          isNullable: true,
        }),
      );
    }

    const updated = await queryRunner.getTable('products');
    const hasIndex = updated?.indices.some((i) => i.name === 'IDX_products_sat_clave');
    if (!hasIndex) {
      await queryRunner.createIndex(
        'products',
        new TableIndex({
          name: 'IDX_products_sat_clave',
          columnNames: ['sat_clave'],
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('products');
    const index = table?.indices.find((i) => i.name === 'IDX_products_sat_clave');
    if (index) {
      await queryRunner.dropIndex('products', 'IDX_products_sat_clave');
    }
    if (table?.findColumnByName('sat_clave')) {
      await queryRunner.dropColumn('products', 'sat_clave');
    }
  }
}
