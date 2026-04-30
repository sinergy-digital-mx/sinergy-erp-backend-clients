import { MigrationInterface, QueryRunner, Table, TableColumn, TableIndex } from 'typeorm';

export class AddPurchaseOrderPayments1776102000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'inv_s_purchase_order_batch',
      new TableColumn({
        name: 'payment_currency',
        type: 'enum',
        enum: ['MXN', 'USD'],
        default: "'MXN'",
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'inv_s_purchase_order_payments',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: '(UUID())',
          },
          {
            name: 'tenant_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'purchase_order_batch_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'payment_date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'currency',
            type: 'enum',
            enum: ['MXN', 'USD'],
            default: "'MXN'",
            isNullable: false,
          },
          {
            name: 'payment_method',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'reference_number',
            type: 'varchar',
            length: '100',
            isNullable: true,
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
          },
        ],
        foreignKeys: [
          {
            columnNames: ['purchase_order_batch_id'],
            referencedTableName: 'inv_s_purchase_order_batch',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
            onUpdate: 'NO ACTION',
          },
        ],
      }),
    );

    await queryRunner.createIndex(
      'inv_s_purchase_order_payments',
      new TableIndex({
        name: 'idx_po_payments_tenant',
        columnNames: ['tenant_id'],
      }),
    );
    await queryRunner.createIndex(
      'inv_s_purchase_order_payments',
      new TableIndex({
        name: 'idx_po_payments_po_id',
        columnNames: ['purchase_order_batch_id'],
      }),
    );
    await queryRunner.createIndex(
      'inv_s_purchase_order_payments',
      new TableIndex({
        name: 'idx_po_payments_date',
        columnNames: ['payment_date'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('inv_s_purchase_order_payments', 'idx_po_payments_date');
    await queryRunner.dropIndex('inv_s_purchase_order_payments', 'idx_po_payments_po_id');
    await queryRunner.dropIndex('inv_s_purchase_order_payments', 'idx_po_payments_tenant');
    await queryRunner.dropTable('inv_s_purchase_order_payments');
    await queryRunner.dropColumn('inv_s_purchase_order_batch', 'payment_currency');
  }
}
