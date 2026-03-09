import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreatePurchaseOrdersTable1772813100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'purchase_orders',
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
            name: 'vendor_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'creator_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'purpose',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'warehouse_id',
            type: 'varchar',
            length: '36',
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
            isNullable: false,
          },
          {
            name: 'cancellation_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'cancellation_reason',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'payment_status',
            type: 'enum',
            enum: ['Pagada', 'Parcial', 'No pagado'],
            default: "'No pagado'",
            isNullable: false,
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
            length: '100',
            isNullable: true,
          },
          {
            name: 'remaining_amount',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: 'total_subtotal',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: 'total_iva',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: 'total_ieps',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: 'grand_total',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
            isNullable: false,
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
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create indexes
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

    // Create foreign keys
    await queryRunner.createForeignKey(
      'purchase_orders',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedTableName: 'rbac_tenants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'purchase_orders',
      new TableForeignKey({
        columnNames: ['warehouse_id'],
        referencedTableName: 'warehouses',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('purchase_orders');
  }
}
