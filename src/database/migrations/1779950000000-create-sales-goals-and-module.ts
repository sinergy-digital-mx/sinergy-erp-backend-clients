import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

const MODULE_CODE = 'goals';
const ENTITY_CODE = 'Goals';
const TENANT_ID = 'afff1757-dbcf-4715-a756-6b22bb2c59d5';

export class CreateSalesGoalsAndModule1779950000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'sales_goals',
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
          {
            name: 'goal_scope',
            type: 'enum',
            enum: ['branch', 'user_role'],
            isNullable: false,
          },
          { name: 'billing_branch_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'role_id', type: 'varchar', length: '36', isNullable: true },
          {
            name: 'metric_type',
            type: 'enum',
            enum: ['sales_count', 'amount'],
            isNullable: false,
          },
          {
            name: 'target_value',
            type: 'decimal',
            precision: 14,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'period_type',
            type: 'enum',
            enum: ['month', 'week', 'year', 'custom'],
            default: "'month'",
            isNullable: false,
          },
          { name: 'period_year', type: 'int', isNullable: true },
          { name: 'period_month', type: 'int', isNullable: true },
          { name: 'period_start', type: 'date', isNullable: true },
          { name: 'period_end', type: 'date', isNullable: true },
          { name: 'is_active', type: 'boolean', default: true, isNullable: false },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'created_by', type: 'varchar', length: '36', isNullable: true },
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
      }),
      true,
    );

    await queryRunner.createIndex(
      'sales_goals',
      new TableIndex({ name: 'idx_sales_goals_tenant', columnNames: ['tenant_id'] }),
    );
    await queryRunner.createIndex(
      'sales_goals',
      new TableIndex({ name: 'idx_sales_goals_branch', columnNames: ['billing_branch_id'] }),
    );
    await queryRunner.createIndex(
      'sales_goals',
      new TableIndex({
        name: 'idx_sales_goals_period',
        columnNames: ['period_type', 'period_year', 'period_month'],
      }),
    );

    await queryRunner.createForeignKey(
      'sales_goals',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedTableName: 'rbac_tenants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'sales_goals',
      new TableForeignKey({
        columnNames: ['billing_branch_id'],
        referencedTableName: 'billing_branches',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'sales_goals',
      new TableForeignKey({
        columnNames: ['role_id'],
        referencedTableName: 'rbac_roles',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
    await queryRunner.createForeignKey(
      'sales_goals',
      new TableForeignKey({
        columnNames: ['created_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.query(`
      INSERT INTO modules (id, name, code, description, created_at)
      SELECT UUID(), 'Metas', '${MODULE_CODE}',
        'Metas de ventas por sucursal y por rol de usuario', NOW()
      WHERE NOT EXISTS (SELECT 1 FROM modules WHERE code = '${MODULE_CODE}');
    `);

    await queryRunner.query(`
      INSERT INTO entity_registry (code, name)
      SELECT '${ENTITY_CODE}', 'Goals'
      WHERE NOT EXISTS (SELECT 1 FROM entity_registry WHERE code = '${ENTITY_CODE}');
    `);

    await queryRunner.query(`
      INSERT INTO rbac_permissions (id, entity_registry_id, module_id, action, description, is_system_permission, created_at, updated_at)
      SELECT UUID(), er.id, m.id, a.action, a.description, 1, NOW(), NOW()
      FROM entity_registry er
      JOIN modules m ON m.code = '${MODULE_CODE}'
      JOIN (
        SELECT 'ViewMenu' AS action, 'Show Goals module in menu' AS description
        UNION ALL SELECT 'Read', 'Read sales goals'
        UNION ALL SELECT 'Create', 'Create sales goals'
        UNION ALL SELECT 'Update', 'Update sales goals'
        UNION ALL SELECT 'Delete', 'Delete sales goals'
      ) a
      WHERE er.code = '${ENTITY_CODE}'
        AND NOT EXISTS (
          SELECT 1 FROM rbac_permissions p
          WHERE p.entity_registry_id = er.id AND p.module_id = m.id AND p.action = a.action
        );
    `);

    await queryRunner.query(`
      INSERT INTO tenant_modules (id, tenant_id, module_id, is_enabled, created_at)
      SELECT UUID(), '${TENANT_ID}', m.id, 1, NOW()
      FROM modules m
      WHERE m.code = '${MODULE_CODE}'
        AND NOT EXISTS (
          SELECT 1 FROM tenant_modules tm
          WHERE tm.tenant_id = '${TENANT_ID}' AND tm.module_id = m.id
        );
    `);

    await queryRunner.query(`
      INSERT INTO rbac_role_permissions (id, role_id, permission_id, created_at)
      SELECT UUID(), r.id, p.id, NOW()
      FROM rbac_roles r
      JOIN rbac_permissions p ON p.module_id = (
        SELECT id FROM modules WHERE code = '${MODULE_CODE}' LIMIT 1
      )
      WHERE r.tenant_id = '${TENANT_ID}'
        AND (r.name = 'Admin' OR r.is_admin = 1)
        AND NOT EXISTS (
          SELECT 1 FROM rbac_role_permissions rp
          WHERE rp.role_id = r.id AND rp.permission_id = p.id
        );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE tm FROM tenant_modules tm
      JOIN modules m ON tm.module_id = m.id
      WHERE m.code = '${MODULE_CODE}';
    `);
    await queryRunner.query(`
      DELETE p FROM rbac_permissions p
      JOIN modules m ON p.module_id = m.id
      WHERE m.code = '${MODULE_CODE}';
    `);
    await queryRunner.query(`DELETE FROM entity_registry WHERE code = '${ENTITY_CODE}'`);
    await queryRunner.query(`DELETE FROM modules WHERE code = '${MODULE_CODE}'`);
    await queryRunner.dropTable('sales_goals', true);
  }
}
