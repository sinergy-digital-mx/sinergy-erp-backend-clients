import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddBaseUomToProducts1772812700000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add base_uom_id column
    await queryRunner.addColumn(
      'products',
      new TableColumn({
        name: 'base_uom_id',
        type: 'char',
        length: '36',
        isNullable: true,
      }),
    );

    // Add foreign key to uom_catalog
    await queryRunner.createForeignKey(
      'products',
      new TableForeignKey({
        columnNames: ['base_uom_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'uom_catalog',
        onDelete: 'SET NULL',
      }),
    );

    // Add index
    await queryRunner.query(
      `CREATE INDEX idx_products_base_uom ON products(base_uom_id)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`DROP INDEX idx_products_base_uom ON products`);

    // Drop foreign key
    const table = await queryRunner.getTable('products');
    const foreignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('base_uom_id') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('products', foreignKey);
    }

    // Drop column
    await queryRunner.dropColumn('products', 'base_uom_id');
  }
}
