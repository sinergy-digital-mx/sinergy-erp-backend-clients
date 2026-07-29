import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateShippings1784900000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'shippings',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: '(UUID())',
          },
          { name: 'tenant_id', type: 'varchar', length: '36' },
          { name: 'shipping_date', type: 'date' },
          { name: 'created_by', type: 'varchar', length: '36' },
          { name: 'edited_by', type: 'varchar', length: '36', isNullable: true },
          { name: 'driver_id', type: 'varchar', length: '36' },
          { name: 'truck_id', type: 'varchar', length: '36' },
          { name: 'origin_warehouse_id', type: 'varchar', length: '36' },
          {
            name: 'status',
            type: 'varchar',
            length: '30',
            default: "'Creado'",
          },
          {
            name: 'distance_km',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: true,
          },
          { name: 'notes', type: 'text', isNullable: true },
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
      true,
    );

    await queryRunner.createForeignKey(
      'shippings',
      new TableForeignKey({
        name: 'FK_shippings_tenant',
        columnNames: ['tenant_id'],
        referencedTableName: 'rbac_tenants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'shippings',
      new TableForeignKey({
        name: 'FK_shippings_truck',
        columnNames: ['truck_id'],
        referencedTableName: 'trucks',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );
    await queryRunner.createForeignKey(
      'shippings',
      new TableForeignKey({
        name: 'FK_shippings_warehouse',
        columnNames: ['origin_warehouse_id'],
        referencedTableName: 'warehouses',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );
    await queryRunner.createForeignKey(
      'shippings',
      new TableForeignKey({
        name: 'FK_shippings_driver',
        columnNames: ['driver_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );
    await queryRunner.createForeignKey(
      'shippings',
      new TableForeignKey({
        name: 'FK_shippings_created_by',
        columnNames: ['created_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );

    await queryRunner.createIndex(
      'shippings',
      new TableIndex({ name: 'idx_shippings_tenant', columnNames: ['tenant_id'] }),
    );
    await queryRunner.createIndex(
      'shippings',
      new TableIndex({ name: 'idx_shippings_status', columnNames: ['status'] }),
    );
    await queryRunner.createIndex(
      'shippings',
      new TableIndex({
        name: 'idx_shippings_date',
        columnNames: ['shipping_date'],
      }),
    );
    await queryRunner.createIndex(
      'shippings',
      new TableIndex({
        name: 'idx_shippings_driver',
        columnNames: ['driver_id'],
      }),
    );
    await queryRunner.createIndex(
      'shippings',
      new TableIndex({ name: 'idx_shippings_truck', columnNames: ['truck_id'] }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'shipping_stops',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: '(UUID())',
          },
          { name: 'tenant_id', type: 'varchar', length: '36' },
          { name: 'shipping_id', type: 'varchar', length: '36' },
          { name: 'sales_order_id', type: 'varchar', length: '36' },
          { name: 'stop_sequence', type: 'int' },
          {
            name: 'customer_address_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'location_status',
            type: 'varchar',
            length: '30',
            default: "'without_location'",
          },
          {
            name: 'delivery_latitude',
            type: 'decimal',
            precision: 10,
            scale: 6,
            isNullable: true,
          },
          {
            name: 'delivery_longitude',
            type: 'decimal',
            precision: 10,
            scale: 6,
            isNullable: true,
          },
          {
            name: 'distance_from_previous_km',
            type: 'decimal',
            precision: 12,
            scale: 2,
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
      true,
    );

    await queryRunner.createForeignKey(
      'shipping_stops',
      new TableForeignKey({
        name: 'FK_shipping_stops_tenant',
        columnNames: ['tenant_id'],
        referencedTableName: 'rbac_tenants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'shipping_stops',
      new TableForeignKey({
        name: 'FK_shipping_stops_shipping',
        columnNames: ['shipping_id'],
        referencedTableName: 'shippings',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'shipping_stops',
      new TableForeignKey({
        name: 'FK_shipping_stops_sales_order',
        columnNames: ['sales_order_id'],
        referencedTableName: 'inv_s_sales_orders',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );

    await queryRunner.createIndex(
      'shipping_stops',
      new TableIndex({
        name: 'idx_shipping_stops_tenant',
        columnNames: ['tenant_id'],
      }),
    );
    await queryRunner.createIndex(
      'shipping_stops',
      new TableIndex({
        name: 'idx_shipping_stops_shipping',
        columnNames: ['shipping_id'],
      }),
    );
    // Unicidad de OV en envío activo se valida en aplicación
    // (permite historial de envíos cancelados con la misma orden).
    await queryRunner.createIndex(
      'shipping_stops',
      new TableIndex({
        name: 'idx_shipping_stops_sales_order',
        columnNames: ['tenant_id', 'sales_order_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('shipping_stops', true);
    await queryRunner.dropTable('shippings', true);
  }
}
