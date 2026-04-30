import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddExternalSkuToProducts1775840000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('products');
    const externalSkuExists = table?.findColumnByName('external_sku');

    if (!externalSkuExists) {
      await queryRunner.addColumn(
        'products',
        new TableColumn({
          name: 'external_sku',
          type: 'varchar',
          length: '255',
          isNullable: true,
        }),
      );
    }

    const updatedTable = await queryRunner.getTable('products');
    const hasExternalSkuIndex = updatedTable?.indices.some(
      (index) => index.name === 'IDX_products_external_sku',
    );
    const hasTenantExternalSkuUnique = updatedTable?.indices.some(
      (index) => index.name === 'UQ_products_tenant_external_sku',
    );

    if (!hasExternalSkuIndex) {
      await queryRunner.createIndex(
        'products',
        new TableIndex({
          name: 'IDX_products_external_sku',
          columnNames: ['external_sku'],
        }),
      );
    }

    if (!hasTenantExternalSkuUnique) {
      await queryRunner.createIndex(
        'products',
        new TableIndex({
          name: 'UQ_products_tenant_external_sku',
          columnNames: ['tenant_id', 'external_sku'],
          isUnique: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('products');
    const hasTenantExternalSkuUnique = table?.indices.some(
      (index) => index.name === 'UQ_products_tenant_external_sku',
    );
    const hasExternalSkuIndex = table?.indices.some(
      (index) => index.name === 'IDX_products_external_sku',
    );
    const hasExternalSkuColumn = table?.findColumnByName('external_sku');

    if (hasTenantExternalSkuUnique) {
      await queryRunner.dropIndex('products', 'UQ_products_tenant_external_sku');
    }
    if (hasExternalSkuIndex) {
      await queryRunner.dropIndex('products', 'IDX_products_external_sku');
    }
    if (hasExternalSkuColumn) {
      await queryRunner.dropColumn('products', 'external_sku');
    }
  }
}
