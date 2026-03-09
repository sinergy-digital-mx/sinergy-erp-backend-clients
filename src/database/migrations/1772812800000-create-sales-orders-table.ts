import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateSalesOrdersTable1772812800000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create sales_orders table
    await queryRunner.createTable(
      new Table({
        name: 'sales_orders',
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
            name: 'name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['draft', 'confirmed', 'processing', 'completed', 'cancelled'],
            default: "'draft'",
            isNullable: false,
          },
          {
            name: 'metadata',
            type: 'json',
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
      'sales_orders',
      new TableIndex({
        name: 'sales_orders_tenant_idx',
        columnNames: ['tenant_id'],
      }),
    );

    // Create index on status
    await queryRunner.createIndex(
      'sales_orders',
      new TableIndex({
        name: 'sales_orders_status_idx',
        columnNames: ['status'],
      }),
    );

    // Create foreign key to rbac_tenants
    await queryRunner.createForeignKey(
      'sales_orders',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedTableName: 'rbac_tenants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'fk_sales_orders_tenant',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    await queryRunner.dropForeignKey(
      'sales_orders',
      'fk_sales_orders_tenant',
    );

    // Drop indexes
    await queryRunner.dropIndex('sales_orders', 'sales_orders_status_idx');
    await queryRunner.dropIndex('sales_orders', 'sales_orders_tenant_idx');

    // Drop table
    await queryRunner.dropTable('sales_orders');
  }
}
