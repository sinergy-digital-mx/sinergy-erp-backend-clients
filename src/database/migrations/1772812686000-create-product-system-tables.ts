import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateProductSystemTables1772812686000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create products table
    await queryRunner.createTable(
      new Table({
        name: 'products',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'tenant_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'sku',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
        uniques: [
          {
            name: 'UQ_products_tenant_sku',
            columnNames: ['tenant_id', 'sku'],
          },
        ],
      }),
      true
    );

    // Create indexes on products
    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'IDX_products_tenant_id',
        columnNames: ['tenant_id'],
      })
    );

    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'IDX_products_sku',
        columnNames: ['sku'],
      })
    );

    // Create uoms table
    await queryRunner.createTable(
      new Table({
        name: 'uoms',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'product_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'code',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
        uniques: [
          {
            name: 'UQ_uoms_product_code',
            columnNames: ['product_id', 'code'],
          },
        ],
      }),
      true
    );

    // Create indexes on uoms
    await queryRunner.createIndex(
      'uoms',
      new TableIndex({
        name: 'IDX_uoms_product_id',
        columnNames: ['product_id'],
      })
    );

    // Add foreign key for uoms -> products
    await queryRunner.createForeignKey(
      'uoms',
      new TableForeignKey({
        name: 'FK_uoms_product_id',
        columnNames: ['product_id'],
        referencedTableName: 'products',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );

    // Create uom_relationships table
    await queryRunner.createTable(
      new Table({
        name: 'uom_relationships',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'product_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'source_uom_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'target_uom_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'conversion_factor',
            type: 'decimal',
            precision: 18,
            scale: 6,
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
        uniques: [
          {
            name: 'UQ_uom_relationships_product_source_target',
            columnNames: ['product_id', 'source_uom_id', 'target_uom_id'],
          },
        ],
      }),
      true
    );

    // Create indexes on uom_relationships
    await queryRunner.createIndex(
      'uom_relationships',
      new TableIndex({
        name: 'IDX_uom_relationships_product_id',
        columnNames: ['product_id'],
      })
    );

    // Add foreign keys for uom_relationships
    await queryRunner.createForeignKey(
      'uom_relationships',
      new TableForeignKey({
        name: 'FK_uom_relationships_product_id',
        columnNames: ['product_id'],
        referencedTableName: 'products',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'uom_relationships',
      new TableForeignKey({
        name: 'FK_uom_relationships_source_uom_id',
        columnNames: ['source_uom_id'],
        referencedTableName: 'uoms',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'uom_relationships',
      new TableForeignKey({
        name: 'FK_uom_relationships_target_uom_id',
        columnNames: ['target_uom_id'],
        referencedTableName: 'uoms',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );

    // Create vendor_product_prices table
    await queryRunner.createTable(
      new Table({
        name: 'vendor_product_prices',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'vendor_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'product_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'uom_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'price',
            type: 'decimal',
            precision: 18,
            scale: 6,
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
        uniques: [
          {
            name: 'UQ_vendor_product_prices_vendor_product_uom',
            columnNames: ['vendor_id', 'product_id', 'uom_id'],
          },
        ],
      }),
      true
    );

    // Create indexes on vendor_product_prices
    await queryRunner.createIndex(
      'vendor_product_prices',
      new TableIndex({
        name: 'IDX_vendor_product_prices_vendor_id',
        columnNames: ['vendor_id'],
      })
    );

    await queryRunner.createIndex(
      'vendor_product_prices',
      new TableIndex({
        name: 'IDX_vendor_product_prices_product_id',
        columnNames: ['product_id'],
      })
    );

    await queryRunner.createIndex(
      'vendor_product_prices',
      new TableIndex({
        name: 'IDX_vendor_product_prices_uom_id',
        columnNames: ['uom_id'],
      })
    );

    // Add foreign keys for vendor_product_prices
    await queryRunner.createForeignKey(
      'vendor_product_prices',
      new TableForeignKey({
        name: 'FK_vendor_product_prices_vendor_id',
        columnNames: ['vendor_id'],
        referencedTableName: 'vendors',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'vendor_product_prices',
      new TableForeignKey({
        name: 'FK_vendor_product_prices_product_id',
        columnNames: ['product_id'],
        referencedTableName: 'products',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'vendor_product_prices',
      new TableForeignKey({
        name: 'FK_vendor_product_prices_uom_id',
        columnNames: ['uom_id'],
        referencedTableName: 'uoms',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop vendor_product_prices table
    await queryRunner.dropTable('vendor_product_prices');

    // Drop uom_relationships table
    await queryRunner.dropTable('uom_relationships');

    // Drop uoms table
    await queryRunner.dropTable('uoms');

    // Drop products table
    await queryRunner.dropTable('products');
  }
}
