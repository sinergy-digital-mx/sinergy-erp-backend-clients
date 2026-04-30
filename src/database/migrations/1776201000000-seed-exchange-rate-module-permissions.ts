import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedExchangeRateModulePermissions1776201000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO modules (id, name, code, description, created_at)
      SELECT UUID(), 'Exchange Rate', 'exchange-rate', 'Daily exchange rate management per tenant', NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM modules WHERE code = 'exchange-rate'
      );
    `);

    await queryRunner.query(`
      INSERT INTO entity_registry (code, name)
      SELECT 'ExchangeRate', 'Exchange Rate'
      WHERE NOT EXISTS (
        SELECT 1 FROM entity_registry WHERE code = 'ExchangeRate'
      );
    `);

    await queryRunner.query(`
      INSERT INTO entity_registry (code, name)
      SELECT 'exchange-rate', 'Exchange Rate Module Menu'
      WHERE NOT EXISTS (
        SELECT 1 FROM entity_registry WHERE code = 'exchange-rate'
      );
    `);

    await queryRunner.query(`
      INSERT INTO rbac_permissions (id, entity_registry_id, module_id, action, description, is_system_permission, created_at, updated_at)
      SELECT UUID(), er.id, m.id, a.action, a.description, 1, NOW(), NOW()
      FROM entity_registry er
      JOIN modules m ON m.code = 'exchange-rate'
      JOIN (
        SELECT 'Create' AS action, 'Create exchange rate records' AS description
        UNION ALL
        SELECT 'Read' AS action, 'Read exchange rates'
        UNION ALL
        SELECT 'Update' AS action, 'Create or edit daily exchange rate'
        UNION ALL
        SELECT 'Delete' AS action, 'Delete exchange rates'
      ) a
      WHERE er.code = 'ExchangeRate'
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
      JOIN modules m ON m.code = 'exchange-rate'
      WHERE NOT EXISTS (
        SELECT 1
        FROM tenant_modules tm
        WHERE tm.tenant_id = t.id
          AND tm.module_id = m.id
      );
    `);

    await queryRunner.query(`
      INSERT INTO rbac_permissions (id, entity_registry_id, module_id, action, description, is_system_permission, created_at, updated_at)
      SELECT UUID(), er.id, m.id, 'ViewMenu', 'Show Exchange Rate module in sidebar (legacy)', 1, NOW(), NOW()
      FROM entity_registry er
      JOIN modules m ON m.code = 'exchange-rate'
      WHERE er.code = 'exchange-rate'
        AND NOT EXISTS (
          SELECT 1
          FROM rbac_permissions p
          WHERE p.entity_registry_id = er.id
            AND p.module_id = m.id
            AND p.action = 'ViewMenu'
        );
    `);

    await queryRunner.query(`
      INSERT INTO rbac_role_permissions (id, role_id, permission_id, created_at)
      SELECT UUID(), r.id, p.id, NOW()
      FROM rbac_roles r
      JOIN rbac_permissions p ON p.module_id = (
        SELECT id FROM modules WHERE code = 'exchange-rate' LIMIT 1
      )
      WHERE r.name = 'Admin'
        AND NOT EXISTS (
          SELECT 1
          FROM rbac_role_permissions rp
          WHERE rp.role_id = r.id
            AND rp.permission_id = p.id
        );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE rp
      FROM rbac_role_permissions rp
      INNER JOIN rbac_permissions p ON p.id = rp.permission_id
      INNER JOIN modules m ON m.id = p.module_id
      WHERE m.code = 'exchange-rate';
    `);

    await queryRunner.query(`
      DELETE FROM tenant_modules
      WHERE module_id = (SELECT id FROM modules WHERE code = 'exchange-rate' LIMIT 1);
    `);

    await queryRunner.query(`
      DELETE p
      FROM rbac_permissions p
      INNER JOIN entity_registry er ON er.id = p.entity_registry_id
      WHERE er.code = 'ExchangeRate';
    `);

    await queryRunner.query(`
      DELETE p
      FROM rbac_permissions p
      INNER JOIN entity_registry er ON er.id = p.entity_registry_id
      WHERE er.code = 'exchange-rate'
        AND p.action = 'ViewMenu';
    `);

    await queryRunner.query(`
      DELETE FROM entity_registry WHERE code = 'ExchangeRate';
    `);

    await queryRunner.query(`
      DELETE FROM entity_registry WHERE code = 'exchange-rate';
    `);

    await queryRunner.query(`
      DELETE FROM modules WHERE code = 'exchange-rate';
    `);
  }
}
