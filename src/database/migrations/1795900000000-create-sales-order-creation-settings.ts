import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

/** Configuración del alta de órdenes de venta, una fila por organización. */
export class CreateSalesOrderCreationSettings1795900000000 implements MigrationInterface {
  name = 'CreateSalesOrderCreationSettings1795900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const existing = await queryRunner.getTable('sales_order_creation_settings');
    if (existing) return;

    await queryRunner.createTable(
      new Table({
        name: 'sales_order_creation_settings',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: '(UUID())',
          },
          { name: 'tenant_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'fields', type: 'json', isNullable: false },
          { name: 'updated_by', type: 'varchar', length: '36', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'sales_order_creation_settings',
      new TableIndex({
        name: 'uq_sales_order_creation_settings_tenant',
        columnNames: ['tenant_id'],
        isUnique: true,
      }),
    );

    await queryRunner.createForeignKey(
      'sales_order_creation_settings',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedTableName: 'rbac_tenants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'sales_order_creation_settings',
      new TableForeignKey({
        columnNames: ['updated_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const existing = await queryRunner.getTable('sales_order_creation_settings');
    if (existing) {
      await queryRunner.dropTable('sales_order_creation_settings', true);
    }
  }
}
