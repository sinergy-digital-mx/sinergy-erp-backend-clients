import { MigrationInterface, QueryRunner } from 'typeorm';

const MODULE_CODE = 'electronic_invoicing';
const ENTITY_CODE = 'ElectronicInvoice';

export class SeedElectronicInvoicingPermissions1780000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO modules (id, name, code, description, created_at)
      SELECT UUID(), 'Facturación electrónica', '${MODULE_CODE}',
        'Timbrado, cancelación y sync SAT vía Finkok', NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM modules WHERE code = '${MODULE_CODE}'
      );
    `);

    await queryRunner.query(`
      INSERT INTO entity_registry (code, name)
      SELECT '${MODULE_CODE}', 'Electronic Invoicing Menu'
      WHERE NOT EXISTS (
        SELECT 1 FROM entity_registry WHERE code = '${MODULE_CODE}'
      );
    `);

    await queryRunner.query(`
      INSERT INTO entity_registry (code, name)
      SELECT 'electronic_invoices', 'Electronic Invoices'
      WHERE NOT EXISTS (
        SELECT 1 FROM entity_registry WHERE code = 'electronic_invoices'
      );
    `);

    await queryRunner.query(`
      INSERT INTO rbac_permissions (id, entity_registry_id, module_id, action, description, is_system_permission, created_at, updated_at)
      SELECT UUID(), er.id, m.id, 'ViewMenu', 'Show Electronic Invoicing in menu', 1, NOW(), NOW()
      FROM entity_registry er
      JOIN modules m ON m.code = '${MODULE_CODE}'
      WHERE er.code = '${MODULE_CODE}'
        AND NOT EXISTS (
          SELECT 1 FROM rbac_permissions p
          WHERE p.module_id = m.id AND p.action = 'ViewMenu'
        );
    `);

    await queryRunner.query(`
      INSERT INTO rbac_permissions (id, entity_registry_id, module_id, action, description, is_system_permission, created_at, updated_at)
      SELECT UUID(), er.id, m.id, a.action, a.description, 1, NOW(), NOW()
      FROM entity_registry er
      JOIN modules m ON m.code = '${MODULE_CODE}'
      JOIN (
        SELECT 'Read' AS action, 'Read electronic invoices' AS description
        UNION ALL SELECT 'Stamp', 'Stamp CFDI via Finkok'
        UNION ALL SELECT 'Cancel', 'Cancel stamped CFDI'
        UNION ALL SELECT 'SyncSat', 'Sync CFDI status with SAT'
      ) a
      WHERE er.code = 'electronic_invoices'
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

    await queryRunner.query(`
      INSERT INTO rbac_role_permissions (id, role_id, permission_id, created_at)
      SELECT UUID(), r.id, p.id, NOW()
      FROM rbac_roles r
      JOIN modules m ON m.code = '${MODULE_CODE}'
      JOIN rbac_permissions p ON p.module_id = m.id
      WHERE LOWER(r.name) = 'admin'
        AND NOT EXISTS (
          SELECT 1 FROM rbac_role_permissions rp
          WHERE rp.role_id = r.id AND rp.permission_id = p.id
        );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE rp FROM rbac_role_permissions rp
      JOIN rbac_permissions p ON p.id = rp.permission_id
      JOIN modules m ON m.id = p.module_id
      WHERE m.code = '${MODULE_CODE}';
    `);

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
      DELETE FROM entity_registry WHERE code IN ('${ENTITY_CODE}', 'electronic_invoices', '${MODULE_CODE}');
    `);

    await queryRunner.query(`
      DELETE FROM modules WHERE code = '${MODULE_CODE}';
    `);
  }
}
