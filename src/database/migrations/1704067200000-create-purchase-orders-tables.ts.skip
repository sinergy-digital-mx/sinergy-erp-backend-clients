import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreatePurchaseOrdersTables1704067200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create purchase_orders table
    await queryRunner.createTable(
      new Table({
        name: 'purchase_orders',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'tenant_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'vendor_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'creator_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'purpose',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'warehouse_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'tentative_receipt_date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['En Proceso', 'Recibida', 'Cancelada'],
            default: "'En Proceso'",
          },
          {
            name: 'cancellation_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'cancellation_reason',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'payment_status',
            type: 'enum',
            enum: ['Pagada', 'Parcial', 'No pagado'],
            default: "'No pagado'",
          },
          {
            name: 'payment_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'payment_amount',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'payment_method',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'remaining_amount',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'total_subtotal',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'total_iva',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'total_ieps',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'grand_total',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
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
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'purchase_orders',
      new TableIndex({
        name: 'tenant_index',
        columnNames: ['tenant_id'],
      }),
    );

    await queryRunner.createIndex(
      'purchase_orders',
      new TableIndex({
        name: 'status_index',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'purchase_orders',
      new TableIndex({
        name: 'vendor_index',
        columnNames: ['vendor_id'],
      }),
    );

    await queryRunner.createIndex(
      'purchase_orders',
      new TableIndex({
        name: 'warehouse_index',
        columnNames: ['warehouse_id'],
      }),
    );

    // Create line_items table
    await queryRunner.createTable(
      new Table({
        name: 'line_items',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'purchase_order_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'product_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'quantity',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'unit_price',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'subtotal',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'iva_percentage',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 0,
          },
          {
            name: 'iva_amount',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'ieps_percentage',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 0,
          },
          {
            name: 'ieps_amount',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'line_total',
            type: 'decimal',
            precision: 12,
            scale: 2,
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
        foreignKeys: [
          {
            columnNames: ['purchase_order_id'],
            referencedTableName: 'purchase_orders',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'line_items',
      new TableIndex({
        name: 'purchase_order_index',
        columnNames: ['purchase_order_id'],
      }),
    );

    // Create payments table
    await queryRunner.createTable(
      new Table({
        name: 'payments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'purchase_order_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'payment_date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'payment_amount',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'payment_method',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'reference_number',
            type: 'varchar',
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
            columnNames: ['purchase_order_id'],
            referencedTableName: 'purchase_orders',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'payments',
      new TableIndex({
        name: 'purchase_order_index',
        columnNames: ['purchase_order_id'],
      }),
    );

    // Create documents table
    await queryRunner.createTable(
      new Table({
        name: 'documents',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'purchase_order_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'filename',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'file_type',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 's3_key',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 's3_url',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'uploader_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'file_size',
            type: 'bigint',
            isNullable: false,
          },
          {
            name: 'upload_date',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
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
            columnNames: ['purchase_order_id'],
            referencedTableName: 'purchase_orders',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'documents',
      new TableIndex({
        name: 'purchase_order_index',
        columnNames: ['purchase_order_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('documents');
    await queryRunner.dropTable('payments');
    await queryRunner.dropTable('line_items');
    await queryRunner.dropTable('purchase_orders');
  }
}
