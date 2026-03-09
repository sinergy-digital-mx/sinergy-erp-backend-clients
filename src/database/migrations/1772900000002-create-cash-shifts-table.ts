import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateCashShiftsTable1772900000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create cash_shifts table
    await queryRunner.createTable(
      new Table({
        name: 'cash_shifts',
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
            name: 'warehouse_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'cashier_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'initial_cash',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'final_cash',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'expected_cash',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'difference',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['open', 'closed'],
            default: "'open'",
            isNullable: false,
          },
          {
            name: 'opened_at',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'closed_at',
            type: 'timestamp',
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

    // Create index on tenant_id
    await queryRunner.createIndex(
      'cash_shifts',
      new TableIndex({
        name: 'cash_shifts_tenant_idx',
        columnNames: ['tenant_id'],
      }),
    );

    // Create index on warehouse_id
    await queryRunner.createIndex(
      'cash_shifts',
      new TableIndex({
        name: 'cash_shifts_warehouse_idx',
        columnNames: ['warehouse_id'],
      }),
    );

    // Create index on cashier_id
    await queryRunner.createIndex(
      'cash_shifts',
      new TableIndex({
        name: 'cash_shifts_cashier_idx',
        columnNames: ['cashier_id'],
      }),
    );

    // Create index on status
    await queryRunner.createIndex(
      'cash_shifts',
      new TableIndex({
        name: 'cash_shifts_status_idx',
        columnNames: ['status'],
      }),
    );

    // Create foreign key to rbac_tenants
    await queryRunner.createForeignKey(
      'cash_shifts',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedTableName: 'rbac_tenants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'fk_cash_shifts_tenant',
      }),
    );

    // Create foreign key to warehouses
    await queryRunner.createForeignKey(
      'cash_shifts',
      new TableForeignKey({
        columnNames: ['warehouse_id'],
        referencedTableName: 'warehouses',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        name: 'fk_cash_shifts_warehouse',
      }),
    );

    // Create foreign key to users (cashier)
    await queryRunner.createForeignKey(
      'cash_shifts',
      new TableForeignKey({
        columnNames: ['cashier_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        name: 'fk_cash_shifts_cashier',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.dropForeignKey('cash_shifts', 'fk_cash_shifts_cashier');
    await queryRunner.dropForeignKey('cash_shifts', 'fk_cash_shifts_warehouse');
    await queryRunner.dropForeignKey('cash_shifts', 'fk_cash_shifts_tenant');

    // Drop indexes
    await queryRunner.dropIndex('cash_shifts', 'cash_shifts_status_idx');
    await queryRunner.dropIndex('cash_shifts', 'cash_shifts_cashier_idx');
    await queryRunner.dropIndex('cash_shifts', 'cash_shifts_warehouse_idx');
    await queryRunner.dropIndex('cash_shifts', 'cash_shifts_tenant_idx');

    // Drop table
    await queryRunner.dropTable('cash_shifts');
  }
}
