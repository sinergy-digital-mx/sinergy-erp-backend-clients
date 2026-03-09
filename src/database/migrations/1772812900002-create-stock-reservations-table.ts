import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateStockReservationsTable1772812900002
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create stock_reservations table
    await queryRunner.createTable(
      new Table({
        name: 'stock_reservations',
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
            name: 'warehouse_id',
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
            name: 'quantity_reserved',
            type: 'decimal',
            precision: 18,
            scale: 4,
            isNullable: false,
          },
          {
            name: 'reference_type',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'reference_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'fulfilled', 'cancelled', 'expired'],
            default: "'active'",
            isNullable: false,
          },
          {
            name: 'reserved_at',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'fulfilled_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create index on tenant_id
    await queryRunner.createIndex(
      'stock_reservations',
      new TableIndex({
        name: 'stock_reservations_tenant_idx',
        columnNames: ['tenant_id'],
      }),
    );

    // Create index on product_id
    await queryRunner.createIndex(
      'stock_reservations',
      new TableIndex({
        name: 'stock_reservations_product_idx',
        columnNames: ['product_id'],
      }),
    );

    // Create index on warehouse_id
    await queryRunner.createIndex(
      'stock_reservations',
      new TableIndex({
        name: 'stock_reservations_warehouse_idx',
        columnNames: ['warehouse_id'],
      }),
    );

    // Create index on (reference_type, reference_id)
    await queryRunner.createIndex(
      'stock_reservations',
      new TableIndex({
        name: 'stock_reservations_reference_idx',
        columnNames: ['reference_type', 'reference_id'],
      }),
    );

    // Create index on status
    await queryRunner.createIndex(
      'stock_reservations',
      new TableIndex({
        name: 'stock_reservations_status_idx',
        columnNames: ['status'],
      }),
    );

    // Create foreign key to rbac_tenants
    await queryRunner.createForeignKey(
      'stock_reservations',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedTableName: 'rbac_tenants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'fk_stock_reservations_tenant',
      }),
    );

    // Create foreign key to products
    await queryRunner.createForeignKey(
      'stock_reservations',
      new TableForeignKey({
        columnNames: ['product_id'],
        referencedTableName: 'products',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'fk_stock_reservations_product',
      }),
    );

    // Create foreign key to warehouses
    await queryRunner.createForeignKey(
      'stock_reservations',
      new TableForeignKey({
        columnNames: ['warehouse_id'],
        referencedTableName: 'warehouses',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'fk_stock_reservations_warehouse',
      }),
    );

    // Create foreign key to uoms
    await queryRunner.createForeignKey(
      'stock_reservations',
      new TableForeignKey({
        columnNames: ['uom_id'],
        referencedTableName: 'uoms',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        name: 'fk_stock_reservations_uom',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.dropForeignKey(
      'stock_reservations',
      'fk_stock_reservations_uom',
    );
    await queryRunner.dropForeignKey(
      'stock_reservations',
      'fk_stock_reservations_warehouse',
    );
    await queryRunner.dropForeignKey(
      'stock_reservations',
      'fk_stock_reservations_product',
    );
    await queryRunner.dropForeignKey(
      'stock_reservations',
      'fk_stock_reservations_tenant',
    );

    // Drop indexes
    await queryRunner.dropIndex('stock_reservations', 'stock_reservations_status_idx');
    await queryRunner.dropIndex('stock_reservations', 'stock_reservations_reference_idx');
    await queryRunner.dropIndex('stock_reservations', 'stock_reservations_warehouse_idx');
    await queryRunner.dropIndex('stock_reservations', 'stock_reservations_product_idx');
    await queryRunner.dropIndex('stock_reservations', 'stock_reservations_tenant_idx');

    // Drop table
    await queryRunner.dropTable('stock_reservations');
  }
}
