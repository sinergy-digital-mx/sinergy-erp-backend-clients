import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class AddColumnsToSalesOrders1772812800001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if customer_id column exists
    const customerIdColumn = await queryRunner.getTable('sales_orders');
    const hasCustomerId = customerIdColumn?.columns.find(col => col.name === 'customer_id');
    
    if (!hasCustomerId) {
      // Add customer_id column
      await queryRunner.addColumn(
        'sales_orders',
        new TableColumn({
          name: 'customer_id',
          type: 'int',
          isNullable: true,
        }),
      );
    }

    // Check if warehouse_id column exists
    const hasWarehouseId = customerIdColumn?.columns.find(col => col.name === 'warehouse_id');
    
    if (!hasWarehouseId) {
      // Add warehouse_id column
      await queryRunner.addColumn(
        'sales_orders',
        new TableColumn({
          name: 'warehouse_id',
          type: 'varchar',
          length: '36',
          isNullable: false,
        }),
      );
    }

    // Check if delivery_date column exists
    const hasDeliveryDate = customerIdColumn?.columns.find(col => col.name === 'delivery_date');
    
    if (!hasDeliveryDate) {
      // Add delivery_date column
      await queryRunner.addColumn(
        'sales_orders',
        new TableColumn({
          name: 'delivery_date',
          type: 'date',
          isNullable: true,
        }),
      );
    }

    // Check if total columns exist
    const hasTotalSubtotal = customerIdColumn?.columns.find(col => col.name === 'total_subtotal');
    
    if (!hasTotalSubtotal) {
      // Add total columns
      await queryRunner.addColumn(
        'sales_orders',
        new TableColumn({
          name: 'total_subtotal',
          type: 'decimal',
          precision: 12,
          scale: 2,
          default: 0,
          isNullable: false,
        }),
      );

      await queryRunner.addColumn(
        'sales_orders',
        new TableColumn({
          name: 'total_iva',
          type: 'decimal',
          precision: 12,
          scale: 2,
          default: 0,
          isNullable: false,
        }),
      );

      await queryRunner.addColumn(
        'sales_orders',
        new TableColumn({
          name: 'total_ieps',
          type: 'decimal',
          precision: 12,
          scale: 2,
          default: 0,
          isNullable: false,
        }),
      );

      await queryRunner.addColumn(
        'sales_orders',
        new TableColumn({
          name: 'grand_total',
          type: 'decimal',
          precision: 12,
          scale: 2,
          default: 0,
          isNullable: false,
        }),
      );
    }

    // Check if indexes exist
    const table = await queryRunner.getTable('sales_orders');
    const hasCustomerIdx = table?.indices.find(idx => idx.name === 'sales_orders_customer_idx');
    
    if (!hasCustomerIdx) {
      // Create index on customer_id
      await queryRunner.createIndex(
        'sales_orders',
        new TableIndex({
          name: 'sales_orders_customer_idx',
          columnNames: ['customer_id'],
        }),
      );
    }

    const hasWarehouseIdx = table?.indices.find(idx => idx.name === 'sales_orders_warehouse_idx');
    
    if (!hasWarehouseIdx) {
      // Create index on warehouse_id
      await queryRunner.createIndex(
        'sales_orders',
        new TableIndex({
          name: 'sales_orders_warehouse_idx',
          columnNames: ['warehouse_id'],
        }),
      );
    }

    // Check if foreign keys exist
    const hasWarehouseFk = table?.foreignKeys.find(fk => fk.name === 'fk_sales_orders_warehouse');
    
    if (!hasWarehouseFk) {
      // Create foreign key to warehouses
      await queryRunner.createForeignKey(
        'sales_orders',
        new TableForeignKey({
          columnNames: ['warehouse_id'],
          referencedTableName: 'warehouses',
          referencedColumnNames: ['id'],
          onDelete: 'RESTRICT',
          name: 'fk_sales_orders_warehouse',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.dropForeignKey(
      'sales_orders',
      'fk_sales_orders_warehouse',
    );
    await queryRunner.dropForeignKey(
      'sales_orders',
      'fk_sales_orders_customer',
    );

    // Drop indexes
    await queryRunner.dropIndex('sales_orders', 'sales_orders_warehouse_idx');
    await queryRunner.dropIndex('sales_orders', 'sales_orders_customer_idx');

    // Drop columns
    await queryRunner.dropColumn('sales_orders', 'grand_total');
    await queryRunner.dropColumn('sales_orders', 'total_ieps');
    await queryRunner.dropColumn('sales_orders', 'total_iva');
    await queryRunner.dropColumn('sales_orders', 'total_subtotal');
    await queryRunner.dropColumn('sales_orders', 'delivery_date');
    await queryRunner.dropColumn('sales_orders', 'warehouse_id');
    await queryRunner.dropColumn('sales_orders', 'customer_id');
  }
}
