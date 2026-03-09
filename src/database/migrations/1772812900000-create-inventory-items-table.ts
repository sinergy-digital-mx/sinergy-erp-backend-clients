import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateInventoryItemsTable1772812900000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create inventory_items table
    await queryRunner.createTable(
      new Table({
        name: 'inventory_items',
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
            name: 'quantity_on_hand',
            type: 'decimal',
            precision: 18,
            scale: 4,
            default: 0,
            isNullable: false,
          },
          {
            name: 'quantity_reserved',
            type: 'decimal',
            precision: 18,
            scale: 4,
            default: 0,
            isNullable: false,
          },
          {
            name: 'quantity_available',
            type: 'decimal',
            precision: 18,
            scale: 4,
            default: 0,
            isNullable: false,
          },
          {
            name: 'reorder_point',
            type: 'decimal',
            precision: 18,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'reorder_quantity',
            type: 'decimal',
            precision: 18,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'location',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'valuation_method',
            type: 'enum',
            enum: ['FIFO', 'LIFO', 'Weighted_Average'],
            default: "'Weighted_Average'",
            isNullable: false,
          },
          {
            name: 'unit_cost',
            type: 'decimal',
            precision: 18,
            scale: 4,
            default: 0,
            isNullable: false,
          },
          {
            name: 'total_value',
            type: 'decimal',
            precision: 18,
            scale: 4,
            default: 0,
            isNullable: false,
          },
          {
            name: 'cost_layers',
            type: 'json',
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
      'inventory_items',
      new TableIndex({
        name: 'inventory_items_tenant_idx',
        columnNames: ['tenant_id'],
      }),
    );

    // Create index on product_id
    await queryRunner.createIndex(
      'inventory_items',
      new TableIndex({
        name: 'inventory_items_product_idx',
        columnNames: ['product_id'],
      }),
    );

    // Create index on warehouse_id
    await queryRunner.createIndex(
      'inventory_items',
      new TableIndex({
        name: 'inventory_items_warehouse_idx',
        columnNames: ['warehouse_id'],
      }),
    );

    // Create unique index on (tenant_id, product_id, warehouse_id, uom_id, location)
    await queryRunner.createIndex(
      'inventory_items',
      new TableIndex({
        name: 'inventory_items_unique_idx',
        columnNames: ['tenant_id', 'product_id', 'warehouse_id', 'uom_id', 'location'],
        isUnique: true,
      }),
    );

    // Create foreign key to rbac_tenants
    await queryRunner.createForeignKey(
      'inventory_items',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedTableName: 'rbac_tenants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'fk_inventory_items_tenant',
      }),
    );

    // Create foreign key to products
    await queryRunner.createForeignKey(
      'inventory_items',
      new TableForeignKey({
        columnNames: ['product_id'],
        referencedTableName: 'products',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'fk_inventory_items_product',
      }),
    );

    // Create foreign key to warehouses
    await queryRunner.createForeignKey(
      'inventory_items',
      new TableForeignKey({
        columnNames: ['warehouse_id'],
        referencedTableName: 'warehouses',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'fk_inventory_items_warehouse',
      }),
    );

    // Create foreign key to uoms
    await queryRunner.createForeignKey(
      'inventory_items',
      new TableForeignKey({
        columnNames: ['uom_id'],
        referencedTableName: 'uoms',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        name: 'fk_inventory_items_uom',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.dropForeignKey(
      'inventory_items',
      'fk_inventory_items_uom',
    );
    await queryRunner.dropForeignKey(
      'inventory_items',
      'fk_inventory_items_warehouse',
    );
    await queryRunner.dropForeignKey(
      'inventory_items',
      'fk_inventory_items_product',
    );
    await queryRunner.dropForeignKey(
      'inventory_items',
      'fk_inventory_items_tenant',
    );

    // Drop indexes
    await queryRunner.dropIndex('inventory_items', 'inventory_items_unique_idx');
    await queryRunner.dropIndex('inventory_items', 'inventory_items_warehouse_idx');
    await queryRunner.dropIndex('inventory_items', 'inventory_items_product_idx');
    await queryRunner.dropIndex('inventory_items', 'inventory_items_tenant_idx');

    // Drop table
    await queryRunner.dropTable('inventory_items');
  }
}
