import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateInvSPurchaseOrderBatchTable1773400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'inv_s_purchase_order_batch',
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
            name: 'fiscal_configuration_id',
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
            name: 'vendor_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'expected_delivery_date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'payment_status',
            type: 'enum',
            enum: ['Pendiente', 'Pagado'],
            default: "'Pendiente'",
            isNullable: false,
          },
          {
            name: 'general_status',
            type: 'enum',
            enum: ['Creada', 'Recibida', 'Cancelada'],
            default: "'Creada'",
            isNullable: false,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_by',
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
          {
            name: 'updated_by',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
        foreignKeys: [
          {
            name: 'fk_po_batch_tenant',
            columnNames: ['tenant_id'],
            referencedTableName: 'rbac_tenants',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            name: 'fk_po_batch_fiscal_config',
            columnNames: ['fiscal_configuration_id'],
            referencedTableName: 'fiscal_configurations',
            referencedColumnNames: ['id'],
            onDelete: 'RESTRICT',
          },
          {
            name: 'fk_po_batch_warehouse',
            columnNames: ['warehouse_id'],
            referencedTableName: 'warehouses',
            referencedColumnNames: ['id'],
            onDelete: 'RESTRICT',
          },
          {
            name: 'fk_po_batch_vendor',
            columnNames: ['vendor_id'],
            referencedTableName: 'vendors',
            referencedColumnNames: ['id'],
            onDelete: 'RESTRICT',
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'inv_s_purchase_order_batch',
      new TableIndex({
        name: 'idx_tenant',
        columnNames: ['tenant_id'],
      }),
    );

    await queryRunner.createIndex(
      'inv_s_purchase_order_batch',
      new TableIndex({
        name: 'idx_general_status',
        columnNames: ['general_status'],
      }),
    );

    await queryRunner.createIndex(
      'inv_s_purchase_order_batch',
      new TableIndex({
        name: 'idx_payment_status',
        columnNames: ['payment_status'],
      }),
    );

    await queryRunner.createIndex(
      'inv_s_purchase_order_batch',
      new TableIndex({
        name: 'idx_vendor',
        columnNames: ['vendor_id'],
      }),
    );

    await queryRunner.createIndex(
      'inv_s_purchase_order_batch',
      new TableIndex({
        name: 'idx_warehouse',
        columnNames: ['warehouse_id'],
      }),
    );

    await queryRunner.createIndex(
      'inv_s_purchase_order_batch',
      new TableIndex({
        name: 'idx_expected_delivery',
        columnNames: ['expected_delivery_date'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('inv_s_purchase_order_batch');
  }
}
