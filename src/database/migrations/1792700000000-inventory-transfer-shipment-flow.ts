import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

/**
 * La transferencia queda pendiente: sale del origen y entra al destino hasta la recepción.
 * El envío puede llevar órdenes, transferencias o ambas.
 */
export class InventoryTransferShipmentFlow1792700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const transfers = await queryRunner.getTable('inv_s_inventory_transfers');
    if (transfers && !transfers.findColumnByName('reception_notes')) {
      await queryRunner.query(`
        ALTER TABLE inv_s_inventory_transfers
          ADD COLUMN reception_notes text NULL AFTER notes,
          ADD COLUMN received_at timestamp NULL AFTER reception_notes,
          ADD COLUMN received_by varchar(36) NULL AFTER received_at
      `);
    }

    await queryRunner.query(`
      ALTER TABLE inv_s_inventory_transfers
        MODIFY COLUMN status ENUM(
          'pending',
          'in_transit',
          'received',
          'received_with_difference',
          'completed',
          'cancelled'
        ) NOT NULL DEFAULT 'pending'
    `);

    const lines = await queryRunner.getTable('inv_s_inventory_transfer_lines');
    if (lines && !lines.findColumnByName('quantity_received')) {
      await queryRunner.query(`
        ALTER TABLE inv_s_inventory_transfer_lines
          ADD COLUMN quantity_received decimal(12,3) NULL AFTER quantity
      `);
    }
    await queryRunner.query(`
      ALTER TABLE inv_s_inventory_transfer_lines
        MODIFY COLUMN destination_inventory_batch_id varchar(36) NULL
    `);

    const shippings = await queryRunner.getTable('shippings');
    if (shippings && !shippings.findColumnByName('cargo_kind')) {
      await queryRunner.query(`
        ALTER TABLE shippings
          ADD COLUMN cargo_kind varchar(30) NOT NULL DEFAULT 'order_delivery' AFTER status
      `);
    }

    const linkTable = await queryRunner.getTable('shipping_inventory_transfers');
    if (!linkTable) {
      await queryRunner.createTable(
        new Table({
          name: 'shipping_inventory_transfers',
          columns: [
            { name: 'id', type: 'varchar', length: '36', isPrimary: true },
            { name: 'tenant_id', type: 'varchar', length: '36', isNullable: false },
            { name: 'shipping_id', type: 'varchar', length: '36', isNullable: false },
            { name: 'inventory_transfer_id', type: 'varchar', length: '36', isNullable: false },
            {
              name: 'created_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
              isNullable: false,
            },
          ],
        }),
      );
      await queryRunner.createIndices('shipping_inventory_transfers', [
        new TableIndex({ name: 'idx_shipping_transfer_tenant', columnNames: ['tenant_id'] }),
        new TableIndex({ name: 'idx_shipping_transfer_shipping', columnNames: ['shipping_id'] }),
        new TableIndex({
          name: 'idx_shipping_transfer_transfer',
          columnNames: ['inventory_transfer_id'],
        }),
      ]);
      await queryRunner.createForeignKeys('shipping_inventory_transfers', [
        new TableForeignKey({
          columnNames: ['shipping_id'],
          referencedTableName: 'shippings',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
        new TableForeignKey({
          columnNames: ['inventory_transfer_id'],
          referencedTableName: 'inv_s_inventory_transfers',
          referencedColumnNames: ['id'],
          onDelete: 'RESTRICT',
        }),
      ]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const linkTable = await queryRunner.getTable('shipping_inventory_transfers');
    if (linkTable) {
      await queryRunner.dropTable('shipping_inventory_transfers');
    }

    const shippings = await queryRunner.getTable('shippings');
    if (shippings?.findColumnByName('cargo_kind')) {
      await queryRunner.dropColumn('shippings', 'cargo_kind');
    }

    await queryRunner.query(`
      UPDATE inv_s_inventory_transfer_lines
      SET destination_inventory_batch_id = source_inventory_batch_id
      WHERE destination_inventory_batch_id IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE inv_s_inventory_transfer_lines
        MODIFY COLUMN destination_inventory_batch_id varchar(36) NOT NULL
    `);
    const lines = await queryRunner.getTable('inv_s_inventory_transfer_lines');
    if (lines?.findColumnByName('quantity_received')) {
      await queryRunner.dropColumn('inv_s_inventory_transfer_lines', 'quantity_received');
    }

    await queryRunner.query(`
      UPDATE inv_s_inventory_transfers
      SET status = 'completed'
      WHERE status IN ('pending', 'in_transit', 'received', 'received_with_difference')
    `);
    await queryRunner.query(`
      ALTER TABLE inv_s_inventory_transfers
        MODIFY COLUMN status ENUM('completed', 'cancelled') NOT NULL DEFAULT 'completed'
    `);

    const transfers = await queryRunner.getTable('inv_s_inventory_transfers');
    for (const column of ['received_by', 'received_at', 'reception_notes']) {
      if (transfers?.findColumnByName(column)) {
        await queryRunner.dropColumn('inv_s_inventory_transfers', column);
      }
    }
  }
}
