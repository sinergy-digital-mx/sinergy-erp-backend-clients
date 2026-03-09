import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateInventoryMovementsTable1772812900001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create inventory_movements table
    await queryRunner.createTable(
      new Table({
        name: 'inventory_movements',
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
            name: 'movement_type',
            type: 'enum',
            enum: [
              'purchase_receipt',
              'sales_shipment',
              'adjustment',
              'transfer_in',
              'transfer_out',
              'initial_balance',
              'return_to_vendor',
              'return_from_customer',
            ],
            isNullable: false,
          },
          {
            name: 'quantity',
            type: 'decimal',
            precision: 18,
            scale: 4,
            isNullable: false,
          },
          {
            name: 'unit_cost',
            type: 'decimal',
            precision: 18,
            scale: 4,
            isNullable: false,
          },
          {
            name: 'total_cost',
            type: 'decimal',
            precision: 18,
            scale: 4,
            isNullable: false,
          },
          {
            name: 'reference_type',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'reference_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'location',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'lot_number',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'serial_number',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'movement_date',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'created_by_user_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'created_at',
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
      'inventory_movements',
      new TableIndex({
        name: 'inventory_movements_tenant_idx',
        columnNames: ['tenant_id'],
      }),
    );

    // Create index on product_id
    await queryRunner.createIndex(
      'inventory_movements',
      new TableIndex({
        name: 'inventory_movements_product_idx',
        columnNames: ['product_id'],
      }),
    );

    // Create index on warehouse_id
    await queryRunner.createIndex(
      'inventory_movements',
      new TableIndex({
        name: 'inventory_movements_warehouse_idx',
        columnNames: ['warehouse_id'],
      }),
    );

    // Create index on movement_date
    await queryRunner.createIndex(
      'inventory_movements',
      new TableIndex({
        name: 'inventory_movements_date_idx',
        columnNames: ['movement_date'],
      }),
    );

    // Create index on (reference_type, reference_id)
    await queryRunner.createIndex(
      'inventory_movements',
      new TableIndex({
        name: 'inventory_movements_reference_idx',
        columnNames: ['reference_type', 'reference_id'],
      }),
    );

    // Create foreign key to rbac_tenants
    await queryRunner.createForeignKey(
      'inventory_movements',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedTableName: 'rbac_tenants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'fk_inventory_movements_tenant',
      }),
    );

    // Create foreign key to products
    await queryRunner.createForeignKey(
      'inventory_movements',
      new TableForeignKey({
        columnNames: ['product_id'],
        referencedTableName: 'products',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'fk_inventory_movements_product',
      }),
    );

    // Create foreign key to warehouses
    await queryRunner.createForeignKey(
      'inventory_movements',
      new TableForeignKey({
        columnNames: ['warehouse_id'],
        referencedTableName: 'warehouses',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'fk_inventory_movements_warehouse',
      }),
    );

    // Create foreign key to uoms
    await queryRunner.createForeignKey(
      'inventory_movements',
      new TableForeignKey({
        columnNames: ['uom_id'],
        referencedTableName: 'uoms',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        name: 'fk_inventory_movements_uom',
      }),
    );

    // Create foreign key to users
    await queryRunner.createForeignKey(
      'inventory_movements',
      new TableForeignKey({
        columnNames: ['created_by_user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        name: 'fk_inventory_movements_user',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.dropForeignKey(
      'inventory_movements',
      'fk_inventory_movements_user',
    );
    await queryRunner.dropForeignKey(
      'inventory_movements',
      'fk_inventory_movements_uom',
    );
    await queryRunner.dropForeignKey(
      'inventory_movements',
      'fk_inventory_movements_warehouse',
    );
    await queryRunner.dropForeignKey(
      'inventory_movements',
      'fk_inventory_movements_product',
    );
    await queryRunner.dropForeignKey(
      'inventory_movements',
      'fk_inventory_movements_tenant',
    );

    // Drop indexes
    await queryRunner.dropIndex('inventory_movements', 'inventory_movements_reference_idx');
    await queryRunner.dropIndex('inventory_movements', 'inventory_movements_date_idx');
    await queryRunner.dropIndex('inventory_movements', 'inventory_movements_warehouse_idx');
    await queryRunner.dropIndex('inventory_movements', 'inventory_movements_product_idx');
    await queryRunner.dropIndex('inventory_movements', 'inventory_movements_tenant_idx');

    // Drop table
    await queryRunner.dropTable('inventory_movements');
  }
}
