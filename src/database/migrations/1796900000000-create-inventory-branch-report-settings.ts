import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

/** Sucursales que se muestran en Inventario > Por sucursal. */
export class CreateInventoryBranchReportSettings1796900000000 implements MigrationInterface {
  name = 'CreateInventoryBranchReportSettings1796900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const existing = await queryRunner.getTable('inventory_branch_report_settings');
    if (existing) return;

    await queryRunner.createTable(
      new Table({
        name: 'inventory_branch_report_settings',
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
          { name: 'visible_branch_ids', type: 'json', isNullable: false },
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
      'inventory_branch_report_settings',
      new TableIndex({
        name: 'uq_inventory_branch_report_settings_tenant',
        columnNames: ['tenant_id'],
        isUnique: true,
      }),
    );

    await queryRunner.createForeignKey(
      'inventory_branch_report_settings',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedTableName: 'rbac_tenants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'inventory_branch_report_settings',
      new TableForeignKey({
        columnNames: ['updated_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const existing = await queryRunner.getTable('inventory_branch_report_settings');
    if (existing) {
      await queryRunner.dropTable('inventory_branch_report_settings', true);
    }
  }
}
