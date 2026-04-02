import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateInvSPurchaseOrderBatchDetailTable1773400000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'inv_s_purchase_order_batch_detail',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'purchase_order_batch_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          // Requested (original order)
          {
            name: 'product_id',
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
            name: 'quantity',
            type: 'decimal',
            precision: 12,
            scale: 3,
            isNullable: false,
          },
          {
            name: 'unit_total',
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
            isNullable: false,
          },
          {
            name: 'iva_unit',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: 'ieps_percentage',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: 'ieps_unit',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          // Received (what actually arrived) - original units
          {
            name: 'received_original_product_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'received_original_uom_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'received_original_quantity',
            type: 'decimal',
            precision: 12,
            scale: 3,
            isNullable: true,
          },
          {
            name: 'received_original_unit_total',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'received_original_iva_percentage',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'received_original_iva_unit',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'received_original_ieps_percentage',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'received_original_ieps_unit',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: true,
          },
          // Received (converted to base units for inventory)
          {
            name: 'received_converted_uom_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'received_converted_quantity',
            type: 'decimal',
            precision: 12,
            scale: 3,
            isNullable: true,
          },
          // Audit fields
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
            name: 'fk_po_detail_batch',
            columnNames: ['purchase_order_batch_id'],
            referencedTableName: 'inv_s_purchase_order_batch',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            name: 'fk_po_detail_product',
            columnNames: ['product_id'],
            referencedTableName: 'products',
            referencedColumnNames: ['id'],
            onDelete: 'RESTRICT',
          },
          {
            name: 'fk_po_detail_uom',
            columnNames: ['uom_id'],
            referencedTableName: 'uom_catalog',
            referencedColumnNames: ['id'],
            onDelete: 'RESTRICT',
          },
          {
            name: 'fk_po_detail_received_product',
            columnNames: ['received_original_product_id'],
            referencedTableName: 'products',
            referencedColumnNames: ['id'],
            onDelete: 'RESTRICT',
          },
          {
            name: 'fk_po_detail_received_uom',
            columnNames: ['received_original_uom_id'],
            referencedTableName: 'uom_catalog',
            referencedColumnNames: ['id'],
            onDelete: 'RESTRICT',
          },
          {
            name: 'fk_po_detail_converted_uom',
            columnNames: ['received_converted_uom_id'],
            referencedTableName: 'uom_catalog',
            referencedColumnNames: ['id'],
            onDelete: 'RESTRICT',
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'inv_s_purchase_order_batch_detail',
      new TableIndex({
        name: 'idx_purchase_order',
        columnNames: ['purchase_order_batch_id'],
      }),
    );

    await queryRunner.createIndex(
      'inv_s_purchase_order_batch_detail',
      new TableIndex({
        name: 'idx_product',
        columnNames: ['product_id'],
      }),
    );

    await queryRunner.createIndex(
      'inv_s_purchase_order_batch_detail',
      new TableIndex({
        name: 'idx_received_product',
        columnNames: ['received_original_product_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('inv_s_purchase_order_batch_detail');
  }
}
