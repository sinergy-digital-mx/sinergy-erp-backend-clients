import { MigrationInterface, QueryRunner } from 'typeorm';

const TENANT_ID = '54481b63-5516-458d-9bb3-d4e5cb028864';
const MODULE_CODE = 'sales_dashboard';

export class SeedSalesDashboardModule1776210100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO modules (id, name, code, description, created_at)
      SELECT UUID(), 'Dashboard de Ventas', '${MODULE_CODE}',
        'Dashboard analítico de ventas de lotes (tenant exclusivo)', NOW()
      WHERE NOT EXISTS (SELECT 1 FROM modules WHERE code = '${MODULE_CODE}')
    `);

    await queryRunner.query(`
      INSERT INTO entity_registry (code, name)
      SELECT 'SalesDashboard', 'Sales Dashboard'
      WHERE NOT EXISTS (SELECT 1 FROM entity_registry WHERE code = 'SalesDashboard')
    `);

    await queryRunner.query(`
      INSERT INTO entity_registry (code, name)
      SELECT '${MODULE_CODE}', 'Sales Dashboard Menu'
      WHERE NOT EXISTS (SELECT 1 FROM entity_registry WHERE code = '${MODULE_CODE}')
    `);

    await queryRunner.query(`
      INSERT INTO rbac_permissions (id, entity_registry_id, module_id, action, description, is_system_permission, created_at, updated_at)
      SELECT UUID(), er.id, m.id, 'Read', 'Read sales dashboard data', 1, NOW(), NOW()
      FROM entity_registry er
      JOIN modules m ON m.code = '${MODULE_CODE}'
      WHERE er.code = 'SalesDashboard'
        AND NOT EXISTS (
          SELECT 1 FROM rbac_permissions p
          WHERE p.module_id = m.id AND p.action = 'Read'
        )
    `);

    await queryRunner.query(`
      INSERT INTO rbac_permissions (id, entity_registry_id, module_id, action, description, is_system_permission, created_at, updated_at)
      SELECT UUID(), er.id, m.id, 'ViewMenu', 'Show Sales Dashboard in sidebar', 1, NOW(), NOW()
      FROM entity_registry er
      JOIN modules m ON m.code = '${MODULE_CODE}'
      WHERE er.code = '${MODULE_CODE}'
        AND NOT EXISTS (
          SELECT 1 FROM rbac_permissions p
          WHERE p.module_id = m.id AND p.action = 'ViewMenu'
        )
    `);

    await queryRunner.query(`
      INSERT INTO tenant_modules (id, tenant_id, module_id, is_enabled, created_at)
      SELECT UUID(), '${TENANT_ID}', m.id, 1, NOW()
      FROM modules m
      WHERE m.code = '${MODULE_CODE}'
        AND NOT EXISTS (
          SELECT 1 FROM tenant_modules tm
          WHERE tm.tenant_id = '${TENANT_ID}' AND tm.module_id = m.id
        )
    `);

    await queryRunner.query(`
      INSERT INTO rbac_role_permissions (id, role_id, permission_id, created_at)
      SELECT UUID(), r.id, p.id, NOW()
      FROM rbac_roles r
      JOIN rbac_permissions p ON p.module_id = (SELECT id FROM modules WHERE code = '${MODULE_CODE}' LIMIT 1)
      WHERE r.tenant_id = '${TENANT_ID}'
        AND r.name = 'Admin'
        AND NOT EXISTS (
          SELECT 1 FROM rbac_role_permissions rp
          WHERE rp.role_id = r.id AND rp.permission_id = p.id
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE rp FROM rbac_role_permissions rp
      JOIN rbac_permissions p ON p.id = rp.permission_id
      JOIN modules m ON m.id = p.module_id
      WHERE m.code = '${MODULE_CODE}'
    `);
    await queryRunner.query(`
      DELETE FROM tenant_modules
      WHERE tenant_id = '${TENANT_ID}'
        AND module_id IN (SELECT id FROM modules WHERE code = '${MODULE_CODE}')
    `);
    await queryRunner.query(`
      DELETE FROM rbac_permissions
      WHERE module_id IN (SELECT id FROM modules WHERE code = '${MODULE_CODE}')
    `);
    await queryRunner.query(`DELETE FROM modules WHERE code = '${MODULE_CODE}'`);
    await queryRunner.query(`
      DELETE FROM entity_registry WHERE code IN ('SalesDashboard', '${MODULE_CODE}')
    `);
  }
}
