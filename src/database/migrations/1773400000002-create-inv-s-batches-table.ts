import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateInvSBatchesTable1773400000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'inv_s_batches',
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
            name: 'batch_number',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'warehouse_id',
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
            name: 'purchase_order_batch_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'purchase_order_detail_id',
            type: 'varchar',
            length: '36',
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
        ],
        foreignKeys: [
          {
            name: 'fk_batch_tenant',
            columnNames: ['tenant_id'],
            referencedTableName: 'rbac_tenants',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            name: 'fk_batch_warehouse',
            columnNames: ['warehouse_id'],
            referencedTableName: 'warehouses',
            referencedColumnNames: ['id'],
            onDelete: 'RESTRICT',
          },
          {
            name: 'fk_batch_product',
            columnNames: ['product_id'],
            referencedTableName: 'products',
            referencedColumnNames: ['id'],
            onDelete: 'RESTRICT',
          },
          {
            name: 'fk_batch_uom',
            columnNames: ['uom_id'],
            referencedTableName: 'uom_catalog',
            referencedColumnNames: ['id'],
            onDelete: 'RESTRICT',
          },
          {
            name: 'fk_batch_po',
            columnNames: ['purchase_order_batch_id'],
            referencedTableName: 'inv_s_purchase_order_batch',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
          {
            name: 'fk_batch_po_detail',
            columnNames: ['purchase_order_detail_id'],
            referencedTableName: 'inv_s_purchase_order_batch_detail',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
        uniques: [
          {
            name: 'uq_batch_number',
            columnNames: ['tenant_id', 'batch_number'],
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'inv_s_batches',
      new TableIndex({
        name: 'idx_tenant',
        columnNames: ['tenant_id'],
      }),
    );

    await queryRunner.createIndex(
      'inv_s_batches',
      new TableIndex({
        name: 'idx_warehouse',
        columnNames: ['warehouse_id'],
      }),
    );

    await queryRunner.createIndex(
      'inv_s_batches',
      new TableIndex({
        name: 'idx_product',
        columnNames: ['product_id'],
      }),
    );

    await queryRunner.createIndex(
      'inv_s_batches',
      new TableIndex({
        name: 'idx_batch_number',
        columnNames: ['batch_number'],
      }),
    );

    await queryRunner.createIndex(
      'inv_s_batches',
      new TableIndex({
        name: 'idx_purchase_order',
        columnNames: ['purchase_order_batch_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('inv_s_batches');
  }
}
