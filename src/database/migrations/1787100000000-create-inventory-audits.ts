import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateInventoryAudits1787100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'inv_s_inventory_audits',
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
            name: 'warehouse_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'product_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'include_empty_lots',
            type: 'tinyint',
            default: 0,
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['draft', 'submitted', 'posted', 'cancelled'],
            default: "'draft'",
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
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'submitted_by',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'submitted_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'authorized_by',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'authorized_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'rejected_by',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'rejected_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'rejection_reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'cancelled_by',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'cancelled_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'cancellation_reason',
            type: 'text',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'inv_s_inventory_audits',
      new TableIndex({
        name: 'idx_audit_tenant',
        columnNames: ['tenant_id'],
      }),
    );

    await queryRunner.createIndex(
      'inv_s_inventory_audits',
      new TableIndex({
        name: 'idx_audit_folio',
        columnNames: ['tenant_id', 'folio'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'inv_s_inventory_audits',
      new TableIndex({
        name: 'idx_audit_warehouse',
        columnNames: ['warehouse_id'],
      }),
    );

    await queryRunner.createIndex(
      'inv_s_inventory_audits',
      new TableIndex({
        name: 'idx_audit_status',
        columnNames: ['tenant_id', 'status'],
      }),
    );

    await queryRunner.createIndex(
      'inv_s_inventory_audits',
      new TableIndex({
        name: 'idx_audit_created_at',
        columnNames: ['created_at'],
      }),
    );

    await queryRunner.createForeignKey(
      'inv_s_inventory_audits',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedTableName: 'rbac_tenants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'fk_inv_audit_tenant',
      }),
    );

    await queryRunner.createForeignKey(
      'inv_s_inventory_audits',
      new TableForeignKey({
        columnNames: ['warehouse_id'],
        referencedTableName: 'warehouses',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        name: 'fk_inv_audit_warehouse',
      }),
    );

    await queryRunner.createForeignKey(
      'inv_s_inventory_audits',
      new TableForeignKey({
        columnNames: ['product_id'],
        referencedTableName: 'products',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        name: 'fk_inv_audit_product',
      }),
    );

    await queryRunner.createForeignKey(
      'inv_s_inventory_audits',
      new TableForeignKey({
        columnNames: ['created_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        name: 'fk_inv_audit_created_by',
      }),
    );

    await queryRunner.createForeignKey(
      'inv_s_inventory_audits',
      new TableForeignKey({
        columnNames: ['submitted_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        name: 'fk_inv_audit_submitted_by',
      }),
    );

    await queryRunner.createForeignKey(
      'inv_s_inventory_audits',
      new TableForeignKey({
        columnNames: ['authorized_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        name: 'fk_inv_audit_authorized_by',
      }),
    );

    await queryRunner.createForeignKey(
      'inv_s_inventory_audits',
      new TableForeignKey({
        columnNames: ['rejected_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        name: 'fk_inv_audit_rejected_by',
      }),
    );

    await queryRunner.createForeignKey(
      'inv_s_inventory_audits',
      new TableForeignKey({
        columnNames: ['cancelled_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        name: 'fk_inv_audit_cancelled_by',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'inv_s_inventory_audit_lines',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'inventory_audit_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'inventory_batch_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'system_quantity',
            type: 'decimal',
            precision: 12,
            scale: 3,
            isNullable: false,
          },
          {
            name: 'counted_quantity',
            type: 'decimal',
            precision: 12,
            scale: 3,
            isNullable: true,
          },
          {
            name: 'variance',
            type: 'decimal',
            precision: 12,
            scale: 3,
            isNullable: true,
          },
          {
            name: 'reason',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'is_additional',
            type: 'tinyint',
            default: 0,
            isNullable: false,
          },
          {
            name: 'counted_by',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'counted_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'quantity_before_post',
            type: 'decimal',
            precision: 12,
            scale: 3,
            isNullable: true,
          },
          {
            name: 'quantity_after_post',
            type: 'decimal',
            precision: 12,
            scale: 3,
            isNullable: true,
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

    await queryRunner.createIndex(
      'inv_s_inventory_audit_lines',
      new TableIndex({
        name: 'idx_audit_line_audit',
        columnNames: ['inventory_audit_id'],
      }),
    );

    await queryRunner.createIndex(
      'inv_s_inventory_audit_lines',
      new TableIndex({
        name: 'idx_audit_line_batch',
        columnNames: ['inventory_batch_id'],
      }),
    );

    await queryRunner.createIndex(
      'inv_s_inventory_audit_lines',
      new TableIndex({
        name: 'uq_audit_line_batch',
        columnNames: ['inventory_audit_id', 'inventory_batch_id'],
        isUnique: true,
      }),
    );

    await queryRunner.createForeignKey(
      'inv_s_inventory_audit_lines',
      new TableForeignKey({
        columnNames: ['inventory_audit_id'],
        referencedTableName: 'inv_s_inventory_audits',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'fk_inv_audit_line_audit',
      }),
    );

    await queryRunner.createForeignKey(
      'inv_s_inventory_audit_lines',
      new TableForeignKey({
        columnNames: ['inventory_batch_id'],
        referencedTableName: 'inv_s_batches',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        name: 'fk_inv_audit_line_batch',
      }),
    );

    await queryRunner.createForeignKey(
      'inv_s_inventory_audit_lines',
      new TableForeignKey({
        columnNames: ['counted_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        name: 'fk_inv_audit_line_counted_by',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('inv_s_inventory_audit_lines');
    await queryRunner.dropTable('inv_s_inventory_audits');
  }
}
