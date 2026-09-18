import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateInvSStockLedger1788900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable('inv_s_stock_ledger');
    if (exists) {
      return;
    }

    await queryRunner.createTable(
      new Table({
        name: 'inv_s_stock_ledger',
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
            name: 'inventory_batch_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'movement_type',
            type: 'enum',
            enum: [
              'purchase_receipt',
              'import',
              'sale',
              'sale_reversal',
              'transfer_in',
              'transfer_out',
              'audit_adjustment',
              'opening_balance',
            ],
            isNullable: false,
          },
          {
            name: 'quantity_delta',
            type: 'decimal',
            precision: 12,
            scale: 3,
            isNullable: false,
          },
          {
            name: 'balance_after',
            type: 'decimal',
            precision: 12,
            scale: 3,
            isNullable: false,
          },
          {
            name: 'occurred_at',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'reference_type',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'reference_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'reference_folio',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'created_by',
            type: 'varchar',
            length: '36',
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
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'inv_s_stock_ledger',
      new TableIndex({
        name: 'idx_stock_ledger_tenant',
        columnNames: ['tenant_id'],
      }),
    );

    await queryRunner.createIndex(
      'inv_s_stock_ledger',
      new TableIndex({
        name: 'idx_stock_ledger_balance_key',
        columnNames: [
          'tenant_id',
          'warehouse_id',
          'product_id',
          'uom_id',
          'occurred_at',
        ],
      }),
    );

    await queryRunner.createIndex(
      'inv_s_stock_ledger',
      new TableIndex({
        name: 'idx_stock_ledger_reference',
        columnNames: ['tenant_id', 'reference_type', 'reference_id'],
      }),
    );

    await queryRunner.createIndex(
      'inv_s_stock_ledger',
      new TableIndex({
        name: 'idx_stock_ledger_batch',
        columnNames: ['tenant_id', 'inventory_batch_id'],
      }),
    );

    await queryRunner.createForeignKey(
      'inv_s_stock_ledger',
      new TableForeignKey({
        name: 'fk_stock_ledger_tenant',
        columnNames: ['tenant_id'],
        referencedTableName: 'rbac_tenants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'inv_s_stock_ledger',
      new TableForeignKey({
        name: 'fk_stock_ledger_product',
        columnNames: ['product_id'],
        referencedTableName: 'products',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );

    await queryRunner.createForeignKey(
      'inv_s_stock_ledger',
      new TableForeignKey({
        name: 'fk_stock_ledger_warehouse',
        columnNames: ['warehouse_id'],
        referencedTableName: 'warehouses',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );

    await queryRunner.createForeignKey(
      'inv_s_stock_ledger',
      new TableForeignKey({
        name: 'fk_stock_ledger_uom',
        columnNames: ['uom_id'],
        referencedTableName: 'uom_catalog',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );

    await queryRunner.createForeignKey(
      'inv_s_stock_ledger',
      new TableForeignKey({
        name: 'fk_stock_ledger_batch',
        columnNames: ['inventory_batch_id'],
        referencedTableName: 'inv_s_batches',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'inv_s_stock_ledger',
      new TableForeignKey({
        name: 'fk_stock_ledger_user',
        columnNames: ['created_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable('inv_s_stock_ledger');
    if (!exists) {
      return;
    }

    await queryRunner.dropTable('inv_s_stock_ledger', true);
  }
}
