import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateInventoryTransfers1779800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'inv_s_inventory_transfers',
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
            name: 'folio',
            type: 'varchar',
            length: '20',
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
            name: 'source_warehouse_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'destination_warehouse_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'total_quantity',
            type: 'decimal',
            precision: 12,
            scale: 3,
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['completed', 'cancelled'],
            default: "'completed'",
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
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'inv_s_inventory_transfers',
      new TableIndex({
        name: 'idx_transfer_tenant',
        columnNames: ['tenant_id'],
      }),
    );

    await queryRunner.createIndex(
      'inv_s_inventory_transfers',
      new TableIndex({
        name: 'idx_transfer_folio',
        columnNames: ['tenant_id', 'folio'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'inv_s_inventory_transfers',
      new TableIndex({
        name: 'idx_transfer_source_wh',
        columnNames: ['source_warehouse_id'],
      }),
    );

    await queryRunner.createIndex(
      'inv_s_inventory_transfers',
      new TableIndex({
        name: 'idx_transfer_dest_wh',
        columnNames: ['destination_warehouse_id'],
      }),
    );

    await queryRunner.createIndex(
      'inv_s_inventory_transfers',
      new TableIndex({
        name: 'idx_transfer_product',
        columnNames: ['product_id'],
      }),
    );

    await queryRunner.createIndex(
      'inv_s_inventory_transfers',
      new TableIndex({
        name: 'idx_transfer_created_at',
        columnNames: ['created_at'],
      }),
    );

    await queryRunner.createForeignKey(
      'inv_s_inventory_transfers',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedTableName: 'rbac_tenants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'fk_inv_transfer_tenant',
      }),
    );

    await queryRunner.createForeignKey(
      'inv_s_inventory_transfers',
      new TableForeignKey({
        columnNames: ['product_id'],
        referencedTableName: 'products',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        name: 'fk_inv_transfer_product',
      }),
    );

    await queryRunner.createForeignKey(
      'inv_s_inventory_transfers',
      new TableForeignKey({
        columnNames: ['uom_id'],
        referencedTableName: 'uom_catalog',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        name: 'fk_inv_transfer_uom',
      }),
    );

    await queryRunner.createForeignKey(
      'inv_s_inventory_transfers',
      new TableForeignKey({
        columnNames: ['source_warehouse_id'],
        referencedTableName: 'warehouses',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        name: 'fk_inv_transfer_source_wh',
      }),
    );

    await queryRunner.createForeignKey(
      'inv_s_inventory_transfers',
      new TableForeignKey({
        columnNames: ['destination_warehouse_id'],
        referencedTableName: 'warehouses',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        name: 'fk_inv_transfer_dest_wh',
      }),
    );

    await queryRunner.createForeignKey(
      'inv_s_inventory_transfers',
      new TableForeignKey({
        columnNames: ['created_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        name: 'fk_inv_transfer_created_by',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'inv_s_inventory_transfer_lines',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'inventory_transfer_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'source_inventory_batch_id',
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
            name: 'destination_inventory_batch_id',
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

    await queryRunner.createIndex(
      'inv_s_inventory_transfer_lines',
      new TableIndex({
        name: 'idx_transfer_line_transfer',
        columnNames: ['inventory_transfer_id'],
      }),
    );

    await queryRunner.createIndex(
      'inv_s_inventory_transfer_lines',
      new TableIndex({
        name: 'idx_transfer_line_source_batch',
        columnNames: ['source_inventory_batch_id'],
      }),
    );

    await queryRunner.createIndex(
      'inv_s_inventory_transfer_lines',
      new TableIndex({
        name: 'idx_transfer_line_dest_batch',
        columnNames: ['destination_inventory_batch_id'],
      }),
    );

    await queryRunner.createForeignKey(
      'inv_s_inventory_transfer_lines',
      new TableForeignKey({
        columnNames: ['inventory_transfer_id'],
        referencedTableName: 'inv_s_inventory_transfers',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'fk_inv_transfer_line_transfer',
      }),
    );

    await queryRunner.createForeignKey(
      'inv_s_inventory_transfer_lines',
      new TableForeignKey({
        columnNames: ['source_inventory_batch_id'],
        referencedTableName: 'inv_s_batches',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        name: 'fk_inv_transfer_line_source_batch',
      }),
    );

    await queryRunner.createForeignKey(
      'inv_s_inventory_transfer_lines',
      new TableForeignKey({
        columnNames: ['destination_inventory_batch_id'],
        referencedTableName: 'inv_s_batches',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        name: 'fk_inv_transfer_line_dest_batch',
      }),
    );

    await queryRunner.query(`
      ALTER TABLE inv_s_batches
      ADD COLUMN transferred_from_batch_id VARCHAR(36) NULL
    `);

    await queryRunner.createForeignKey(
      'inv_s_batches',
      new TableForeignKey({
        columnNames: ['transferred_from_batch_id'],
        referencedTableName: 'inv_s_batches',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'fk_inv_batch_transferred_from',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const batchesTable = await queryRunner.getTable('inv_s_batches');
    const transferredFromFk = batchesTable?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('transferred_from_batch_id') !== -1,
    );
    if (transferredFromFk) {
      await queryRunner.dropForeignKey('inv_s_batches', transferredFromFk);
    }
    await queryRunner.query(`
      ALTER TABLE inv_s_batches DROP COLUMN transferred_from_batch_id
    `);

    await queryRunner.dropTable('inv_s_inventory_transfer_lines');
    await queryRunner.dropTable('inv_s_inventory_transfers');
  }
}
