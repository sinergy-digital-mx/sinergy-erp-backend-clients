import { MigrationInterface, QueryRunner } from 'typeorm';

const MODULE_CODE = 'accounting';
const ENTITY_CODE = 'Accounting';

export class SeedAccountingModulePermissions1779900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO modules (id, name, code, description, created_at)
      SELECT UUID(), 'Cobranza / Contabilidad', '${MODULE_CODE}',
        'Dashboard de POS, cuentas por pagar y cuentas por cobrar', NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM modules WHERE code = '${MODULE_CODE}'
      );
    `);

    await queryRunner.query(`
      INSERT INTO entity_registry (code, name)
      SELECT '${ENTITY_CODE}', 'Accounting'
      WHERE NOT EXISTS (
        SELECT 1 FROM entity_registry WHERE code = '${ENTITY_CODE}'
      );
    `);

    await queryRunner.query(`
      INSERT INTO rbac_permissions (id, entity_registry_id, module_id, action, description, is_system_permission, created_at, updated_at)
      SELECT UUID(), er.id, m.id, a.action, a.description, 1, NOW(), NOW()
      FROM entity_registry er
      JOIN modules m ON m.code = '${MODULE_CODE}'
      JOIN (
        SELECT 'ViewMenu' AS action, 'Show Accounting module in menu' AS description
        UNION ALL SELECT 'Read', 'Read accounting dashboard and reports'
      ) a
      WHERE er.code = '${ENTITY_CODE}'
        AND NOT EXISTS (
          SELECT 1
          FROM rbac_permissions p
          WHERE p.entity_registry_id = er.id
            AND p.module_id = m.id
            AND p.action = a.action
        );
    `);

    await queryRunner.query(`
      INSERT INTO tenant_modules (id, tenant_id, module_id, is_enabled, created_at)
      SELECT UUID(), t.id, m.id, 1, NOW()
      FROM rbac_tenants t
      JOIN modules m ON m.code = '${MODULE_CODE}'
      WHERE NOT EXISTS (
        SELECT 1 FROM tenant_modules tm
        WHERE tm.tenant_id = t.id AND tm.module_id = m.id
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

    await queryRunner.query(`
      DELETE FROM entity_registry WHERE code = '${ENTITY_CODE}';
    `);

    await queryRunner.query(`
      DELETE FROM modules WHERE code = '${MODULE_CODE}';
    `);
  }
}
