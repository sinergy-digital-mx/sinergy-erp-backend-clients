import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateProductPricesTable1773000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'product_prices',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'tenant_id',
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
            name: 'price_list_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'price',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'discount_percentage',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 0,
          },
          {
            name: 'valid_from',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'valid_to',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'metadata',
            type: 'json',
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
        foreignKeys: [
          {
            columnNames: ['tenant_id'],
            referencedTableName: 'rbac_tenants',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['product_id'],
            referencedTableName: 'products',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['price_list_id'],
            referencedTableName: 'price_lists',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'product_prices',
      new TableIndex({
        name: 'product_prices_tenant_idx',
        columnNames: ['tenant_id'],
      }),
    );

    await queryRunner.createIndex(
      'product_prices',
      new TableIndex({
        name: 'product_prices_product_idx',
        columnNames: ['product_id'],
      }),
    );

    await queryRunner.createIndex(
      'product_prices',
      new TableIndex({
        name: 'product_prices_price_list_idx',
        columnNames: ['price_list_id'],
      }),
    );

    await queryRunner.createIndex(
      'product_prices',
      new TableIndex({
        name: 'product_prices_unique_idx',
        columnNames: ['product_id', 'price_list_id'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('product_prices');
  }
}
