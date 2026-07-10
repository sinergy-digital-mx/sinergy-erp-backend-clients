import { MigrationInterface, QueryRunner } from 'typeorm';

const MODULE_CODE = 'electronic_invoicing';
const MENU_ENTITY_CODE = 'electronic_invoicing';
const RESOURCE_ENTITY_CODE = 'electronic_invoices';

/**
 * Corrige permisos de facturación electrónica:
 * - ViewMenu debe estar en entity electronic_invoicing (coincide con module.code)
 * - Read/Stamp/Cancel/SyncSat quedan en electronic_invoices (controllers)
 * - Habilita módulo en todos los clientes
 * - Asigna permisos al rol Admin
 */
export class FixElectronicInvoicingPermissions1780200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO entity_registry (code, name)
      SELECT '${MENU_ENTITY_CODE}', 'Electronic Invoicing Menu'
      WHERE NOT EXISTS (
        SELECT 1 FROM entity_registry WHERE code = '${MENU_ENTITY_CODE}'
      );
    `);

    await queryRunner.query(`
      UPDATE rbac_permissions p
      JOIN modules m ON m.id = p.module_id
      JOIN entity_registry er ON er.code = '${MENU_ENTITY_CODE}'
      SET p.entity_registry_id = er.id,
          p.updated_at = NOW()
      WHERE m.code = '${MODULE_CODE}'
        AND p.action = 'ViewMenu'
    `);

    await queryRunner.query(`
      UPDATE tenant_modules tm
      JOIN modules m ON m.id = tm.module_id
      SET tm.is_enabled = 1
      WHERE m.code = '${MODULE_CODE}'
    `);

    await queryRunner.query(`
      INSERT INTO rbac_role_permissions (id, role_id, permission_id, created_at)
      SELECT UUID(), r.id, p.id, NOW()
      FROM rbac_roles r
      JOIN modules m ON m.code = '${MODULE_CODE}'
      JOIN rbac_permissions p ON p.module_id = m.id
      WHERE LOWER(r.name) = 'admin'
        AND NOT EXISTS (
          SELECT 1
          FROM rbac_role_permissions rp
          WHERE rp.role_id = r.id
            AND rp.permission_id = p.id
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE rp
      FROM rbac_role_permissions rp
      INNER JOIN rbac_permissions p ON p.id = rp.permission_id
      INNER JOIN modules m ON m.id = p.module_id
      WHERE m.code = '${MODULE_CODE}'
    `);

    await queryRunner.query(`
      UPDATE tenant_modules tm
      JOIN modules m ON m.id = tm.module_id
      SET tm.is_enabled = 0
      WHERE m.code = '${MODULE_CODE}'
    `);

    await queryRunner.query(`
      UPDATE rbac_permissions p
      JOIN modules m ON m.id = p.module_id
      JOIN entity_registry er ON er.code = '${RESOURCE_ENTITY_CODE}'
      SET p.entity_registry_id = er.id,
          p.updated_at = NOW()
      WHERE m.code = '${MODULE_CODE}'
        AND p.action = 'ViewMenu'
    `);

    await queryRunner.query(`
      DELETE FROM entity_registry WHERE code = '${MENU_ENTITY_CODE}'
    `);
  }
}
