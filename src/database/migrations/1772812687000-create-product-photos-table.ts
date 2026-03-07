import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateProductPhotosTable1772812687000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create product_photos table
    await queryRunner.createTable(
      new Table({
        name: 'product_photos',
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
            name: 'product_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'file_name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 's3_key',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'mime_type',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'file_size',
            type: 'bigint',
            isNullable: false,
          },
          {
            name: 'display_order',
            type: 'int',
            default: 0,
            isNullable: false,
          },
          {
            name: 'is_primary',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'alt_text',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'uploaded_by',
            type: 'varchar',
            length: '36',
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
      }),
      true
    );

    // Create indexes on product_photos
    await queryRunner.createIndex(
      'product_photos',
      new TableIndex({
        name: 'IDX_product_photos_tenant_id',
        columnNames: ['tenant_id'],
      })
    );

    await queryRunner.createIndex(
      'product_photos',
      new TableIndex({
        name: 'IDX_product_photos_product_id',
        columnNames: ['product_id'],
      })
    );

    await queryRunner.createIndex(
      'product_photos',
      new TableIndex({
        name: 'IDX_product_photos_is_primary',
        columnNames: ['product_id', 'is_primary'],
      })
    );

    // Add foreign key for product_photos -> products
    await queryRunner.createForeignKey(
      'product_photos',
      new TableForeignKey({
        name: 'FK_product_photos_product_id',
        columnNames: ['product_id'],
        referencedTableName: 'products',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );

    // Add foreign key for product_photos -> tenants
    await queryRunner.createForeignKey(
      'product_photos',
      new TableForeignKey({
        name: 'FK_product_photos_tenant_id',
        columnNames: ['tenant_id'],
        referencedTableName: 'rbac_tenants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop product_photos table
    await queryRunner.dropTable('product_photos');
  }
}
