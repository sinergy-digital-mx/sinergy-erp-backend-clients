import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreatePosTablesTable1772900000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create pos_tables table
    await queryRunner.createTable(
      new Table({
        name: 'pos_tables',
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
            name: 'table_number',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'zone',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'capacity',
            type: 'int',
            default: 4,
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['available', 'occupied', 'reserved', 'cleaning'],
            default: "'available'",
            isNullable: false,
          },
          {
            name: 'current_order_id',
            type: 'varchar',
            length: '36',
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
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create index on tenant_id
    await queryRunner.createIndex(
      'pos_tables',
      new TableIndex({
        name: 'pos_tables_tenant_idx',
        columnNames: ['tenant_id'],
      }),
    );

    // Create index on warehouse_id
    await queryRunner.createIndex(
      'pos_tables',
      new TableIndex({
        name: 'pos_tables_warehouse_idx',
        columnNames: ['warehouse_id'],
      }),
    );

    // Create index on status
    await queryRunner.createIndex(
      'pos_tables',
      new TableIndex({
        name: 'pos_tables_status_idx',
        columnNames: ['status'],
      }),
    );

    // Create unique index on (tenant_id, warehouse_id, table_number)
    await queryRunner.createIndex(
      'pos_tables',
      new TableIndex({
        name: 'pos_tables_unique_idx',
        columnNames: ['tenant_id', 'warehouse_id', 'table_number'],
        isUnique: true,
      }),
    );

    // Create foreign key to rbac_tenants
    await queryRunner.createForeignKey(
      'pos_tables',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedTableName: 'rbac_tenants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'fk_pos_tables_tenant',
      }),
    );

    // Create foreign key to warehouses
    await queryRunner.createForeignKey(
      'pos_tables',
      new TableForeignKey({
        columnNames: ['warehouse_id'],
        referencedTableName: 'warehouses',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        name: 'fk_pos_tables_warehouse',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.dropForeignKey('pos_tables', 'fk_pos_tables_warehouse');
    await queryRunner.dropForeignKey('pos_tables', 'fk_pos_tables_tenant');

    // Drop indexes
    await queryRunner.dropIndex('pos_tables', 'pos_tables_unique_idx');
    await queryRunner.dropIndex('pos_tables', 'pos_tables_status_idx');
    await queryRunner.dropIndex('pos_tables', 'pos_tables_warehouse_idx');
    await queryRunner.dropIndex('pos_tables', 'pos_tables_tenant_idx');

    // Drop table
    await queryRunner.dropTable('pos_tables');
  }
}
