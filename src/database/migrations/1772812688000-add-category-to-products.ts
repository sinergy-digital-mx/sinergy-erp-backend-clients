import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class AddCategoryToProducts1772812688000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add category_id column
    await queryRunner.addColumn(
      'products',
      new TableColumn({
        name: 'category_id',
        type: 'varchar',
        length: '36',
        isNullable: true,
      })
    );

    // Add subcategory_id column
    await queryRunner.addColumn(
      'products',
      new TableColumn({
        name: 'subcategory_id',
        type: 'varchar',
        length: '36',
        isNullable: true,
      })
    );

    // Create indexes
    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'IDX_products_category_id',
        columnNames: ['category_id'],
      })
    );

    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'IDX_products_subcategory_id',
        columnNames: ['subcategory_id'],
      })
    );

    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'IDX_products_tenant_category',
        columnNames: ['tenant_id', 'category_id'],
      })
    );

    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'IDX_products_tenant_subcategory',
        columnNames: ['tenant_id', 'subcategory_id'],
      })
    );

    // Add foreign keys
    await queryRunner.createForeignKey(
      'products',
      new TableForeignKey({
        name: 'FK_products_category_id',
        columnNames: ['category_id'],
        referencedTableName: 'categories',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      })
    );

    await queryRunner.createForeignKey(
      'products',
      new TableForeignKey({
        name: 'FK_products_subcategory_id',
        columnNames: ['subcategory_id'],
        referencedTableName: 'subcategories',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.dropForeignKey('products', 'FK_products_subcategory_id');
    await queryRunner.dropForeignKey('products', 'FK_products_category_id');

    // Drop indexes
    await queryRunner.dropIndex('products', 'IDX_products_tenant_subcategory');
    await queryRunner.dropIndex('products', 'IDX_products_tenant_category');
    await queryRunner.dropIndex('products', 'IDX_products_subcategory_id');
    await queryRunner.dropIndex('products', 'IDX_products_category_id');

    // Drop columns
    await queryRunner.dropColumn('products', 'subcategory_id');
    await queryRunner.dropColumn('products', 'category_id');
  }
}
