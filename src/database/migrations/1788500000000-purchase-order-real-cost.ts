import { MigrationInterface, QueryRunner, Table, TableColumn, TableIndex } from 'typeorm';

export class PurchaseOrderRealCost1788500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'inv_s_purchase_order_batch',
      new TableColumn({
        name: 'customs_date',
        type: 'date',
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      'inv_s_purchase_order_batch',
      new TableColumn({
        name: 'customs_exchange_rate',
        type: 'decimal',
        precision: 10,
        scale: 4,
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      'inv_s_purchase_order_batch',
      new TableColumn({
        name: 'landed_increment_percentage',
        type: 'decimal',
        precision: 8,
        scale: 4,
        default: '0',
      }),
    );
    await queryRunner.addColumn(
      'inv_s_purchase_order_batch',
      new TableColumn({
        name: 'landed_merchandise_mxn',
        type: 'decimal',
        precision: 14,
        scale: 2,
        default: '0',
      }),
    );
    await queryRunner.addColumn(
      'inv_s_purchase_order_batch',
      new TableColumn({
        name: 'landed_extras_mxn',
        type: 'decimal',
        precision: 14,
        scale: 2,
        default: '0',
      }),
    );

    await queryRunner.addColumn(
      'inv_s_purchase_order_batch_detail',
      new TableColumn({
        name: 'igi_percentage',
        type: 'decimal',
        precision: 5,
        scale: 2,
        default: '0',
      }),
    );
    await queryRunner.addColumn(
      'inv_s_purchase_order_batch_detail',
      new TableColumn({
        name: 'real_unit_cost_usd',
        type: 'decimal',
        precision: 16,
        scale: 4,
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      'inv_s_purchase_order_batch_detail',
      new TableColumn({
        name: 'real_unit_cost_mxn',
        type: 'decimal',
        precision: 16,
        scale: 4,
        isNullable: true,
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'inv_s_purchase_order_landed_cost_line',
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
            name: 'concept',
            type: 'varchar',
            length: '120',
            isNullable: false,
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 14,
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
            name: 'sort_order',
            type: 'int',
            default: 0,
            isNullable: false,
          },
          {
            name: 'created_by',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'updated_by',
            type: 'varchar',
            length: '36',
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
      'inv_s_purchase_order_landed_cost_line',
      new TableIndex({
        name: 'idx_po_landed_cost_tenant',
        columnNames: ['tenant_id'],
      }),
    );
    await queryRunner.createIndex(
      'inv_s_purchase_order_landed_cost_line',
      new TableIndex({
        name: 'idx_po_landed_cost_po_id',
        columnNames: ['purchase_order_batch_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      'inv_s_purchase_order_landed_cost_line',
      'idx_po_landed_cost_po_id',
    );
    await queryRunner.dropIndex(
      'inv_s_purchase_order_landed_cost_line',
      'idx_po_landed_cost_tenant',
    );
    await queryRunner.dropTable('inv_s_purchase_order_landed_cost_line');

    await queryRunner.dropColumn('inv_s_purchase_order_batch_detail', 'real_unit_cost_mxn');
    await queryRunner.dropColumn('inv_s_purchase_order_batch_detail', 'real_unit_cost_usd');
    await queryRunner.dropColumn('inv_s_purchase_order_batch_detail', 'igi_percentage');

    await queryRunner.dropColumn('inv_s_purchase_order_batch', 'landed_extras_mxn');
    await queryRunner.dropColumn('inv_s_purchase_order_batch', 'landed_merchandise_mxn');
    await queryRunner.dropColumn('inv_s_purchase_order_batch', 'landed_increment_percentage');
    await queryRunner.dropColumn('inv_s_purchase_order_batch', 'customs_exchange_rate');
    await queryRunner.dropColumn('inv_s_purchase_order_batch', 'customs_date');
  }
}
