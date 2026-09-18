import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddProductItemKindAndSaleScope1789100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const products = await queryRunner.getTable('products');
    if (products && !products.findColumnByName('item_kind')) {
      await queryRunner.addColumn(
        'products',
        new TableColumn({
          name: 'item_kind',
          type: 'varchar',
          length: '16',
          isNullable: false,
          default: "'goods'",
        }),
      );
    }

    const productsUpdated = await queryRunner.getTable('products');
    const hasProductIndex = productsUpdated?.indices.some(
      (index) => index.name === 'IDX_products_tenant_item_kind',
    );
    if (productsUpdated && !hasProductIndex) {
      await queryRunner.createIndex(
        'products',
        new TableIndex({
          name: 'IDX_products_tenant_item_kind',
          columnNames: ['tenant_id', 'item_kind'],
        }),
      );
    }

    const salesOrders = await queryRunner.getTable('inv_s_sales_orders');
    if (salesOrders && !salesOrders.findColumnByName('sale_scope')) {
      await queryRunner.addColumn(
        'inv_s_sales_orders',
        new TableColumn({
          name: 'sale_scope',
          type: 'varchar',
          length: '16',
          isNullable: false,
          default: "'inventory'",
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const salesOrders = await queryRunner.getTable('inv_s_sales_orders');
    if (salesOrders?.findColumnByName('sale_scope')) {
      await queryRunner.dropColumn('inv_s_sales_orders', 'sale_scope');
    }

    const products = await queryRunner.getTable('products');
    const productIndex = products?.indices.find(
      (index) => index.name === 'IDX_products_tenant_item_kind',
    );
    if (productIndex) {
      await queryRunner.dropIndex('products', 'IDX_products_tenant_item_kind');
    }
    if (products?.findColumnByName('item_kind')) {
      await queryRunner.dropColumn('products', 'item_kind');
    }
  }
}
