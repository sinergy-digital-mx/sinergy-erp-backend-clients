import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreatePosOrdersTable1772900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create pos_orders table
    await queryRunner.createTable(
      new Table({
        name: 'pos_orders',
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
            name: 'order_number',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'warehouse_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'waiter_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'cashier_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'table_number',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'zone',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'in_progress', 'ready', 'paid', 'cancelled'],
            default: "'pending'",
            isNullable: false,
          },
          {
            name: 'subtotal',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: 'tax',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: 'discount',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: 'tip',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: 'total',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: 'paid_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
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
      'pos_orders',
      new TableIndex({
        name: 'pos_orders_tenant_idx',
        columnNames: ['tenant_id'],
      }),
    );

    // Create index on warehouse_id
    await queryRunner.createIndex(
      'pos_orders',
      new TableIndex({
        name: 'pos_orders_warehouse_idx',
        columnNames: ['warehouse_id'],
      }),
    );

    // Create index on order_number
    await queryRunner.createIndex(
      'pos_orders',
      new TableIndex({
        name: 'pos_orders_order_number_idx',
        columnNames: ['order_number'],
      }),
    );

    // Create index on status
    await queryRunner.createIndex(
      'pos_orders',
      new TableIndex({
        name: 'pos_orders_status_idx',
        columnNames: ['status'],
      }),
    );

    // Create index on waiter_id
    await queryRunner.createIndex(
      'pos_orders',
      new TableIndex({
        name: 'pos_orders_waiter_idx',
        columnNames: ['waiter_id'],
      }),
    );

    // Create index on created_at
    await queryRunner.createIndex(
      'pos_orders',
      new TableIndex({
        name: 'pos_orders_date_idx',
        columnNames: ['created_at'],
      }),
    );

    // Create foreign key to rbac_tenants
    await queryRunner.createForeignKey(
      'pos_orders',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedTableName: 'rbac_tenants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'fk_pos_orders_tenant',
      }),
    );

    // Create foreign key to warehouses
    await queryRunner.createForeignKey(
      'pos_orders',
      new TableForeignKey({
        columnNames: ['warehouse_id'],
        referencedTableName: 'warehouses',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        name: 'fk_pos_orders_warehouse',
      }),
    );

    // Create foreign key to users (waiter)
    await queryRunner.createForeignKey(
      'pos_orders',
      new TableForeignKey({
        columnNames: ['waiter_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        name: 'fk_pos_orders_waiter',
      }),
    );

    // Create foreign key to users (cashier)
    await queryRunner.createForeignKey(
      'pos_orders',
      new TableForeignKey({
        columnNames: ['cashier_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        name: 'fk_pos_orders_cashier',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.dropForeignKey('pos_orders', 'fk_pos_orders_cashier');
    await queryRunner.dropForeignKey('pos_orders', 'fk_pos_orders_waiter');
    await queryRunner.dropForeignKey('pos_orders', 'fk_pos_orders_warehouse');
    await queryRunner.dropForeignKey('pos_orders', 'fk_pos_orders_tenant');

    // Drop indexes
    await queryRunner.dropIndex('pos_orders', 'pos_orders_date_idx');
    await queryRunner.dropIndex('pos_orders', 'pos_orders_waiter_idx');
    await queryRunner.dropIndex('pos_orders', 'pos_orders_status_idx');
    await queryRunner.dropIndex('pos_orders', 'pos_orders_order_number_idx');
    await queryRunner.dropIndex('pos_orders', 'pos_orders_warehouse_idx');
    await queryRunner.dropIndex('pos_orders', 'pos_orders_tenant_idx');

    // Drop table
    await queryRunner.dropTable('pos_orders');
  }
}
