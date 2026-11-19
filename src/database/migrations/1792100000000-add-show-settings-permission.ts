import { MigrationInterface, QueryRunner } from 'typeorm';

const MODULE_CODE = 'settings';
const ENTITY_CODE = 'settings';

/**
 * Permiso "Mostrar configuración" para el menú de Configuración
 * y la sección Catálogo Productos y Proveedores.
 * Se asigna a los roles existentes para no quitar el acceso actual.
 */
export class AddShowSettingsPermission1792100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO modules (id, name, code, description, category, sort_order, created_at)
      SELECT UUID(), 'Catálogo Productos y Proveedores', '${MODULE_CODE}',
        'Acceso al menú de Configuración y al catálogo de productos y proveedores',
        'settings', 5, NOW()
      WHERE NOT EXISTS (SELECT 1 FROM modules WHERE code = '${MODULE_CODE}')
    `);

    await queryRunner.query(`
      UPDATE modules
      SET
        name = 'Catálogo Productos y Proveedores',
        description = 'Acceso al menú de Configuración y al catálogo de productos y proveedores',
        category = 'settings',
        sort_order = 5
      WHERE code = '${MODULE_CODE}'
    `);

    await queryRunner.query(`
      INSERT INTO entity_registry (code, name)
      SELECT '${ENTITY_CODE}', 'Configuración'
      WHERE NOT EXISTS (SELECT 1 FROM entity_registry WHERE code = '${ENTITY_CODE}')
    `);

    await queryRunner.query(`
      INSERT INTO rbac_permissions (
        id, entity_registry_id, module_id, action, description,
        is_system_permission, created_at, updated_at
      )
      SELECT UUID(), er.id, m.id, 'ViewMenu', 'Mostrar configuración', 1, NOW(), NOW()
      FROM entity_registry er
      JOIN modules m ON m.code = '${MODULE_CODE}'
      WHERE er.code = '${ENTITY_CODE}'
        AND NOT EXISTS (
          SELECT 1
          FROM rbac_permissions p
          WHERE p.module_id = m.id
            AND p.action = 'ViewMenu'
        )
    `);

    await queryRunner.query(`
      INSERT INTO tenant_modules (id, tenant_id, module_id, is_enabled, created_at)
      SELECT UUID(), t.id, m.id, 1, NOW()
      FROM rbac_tenants t
      JOIN modules m ON m.code = '${MODULE_CODE}'
      WHERE NOT EXISTS (
        SELECT 1
        FROM tenant_modules tm
        WHERE tm.tenant_id = t.id
          AND tm.module_id = m.id
      )
    `);

    await queryRunner.query(`
      INSERT INTO rbac_role_permissions (id, role_id, permission_id, created_at)
      SELECT UUID(), r.id, p.id, NOW()
      FROM rbac_roles r
      JOIN rbac_permissions p ON p.module_id = (
        SELECT id FROM modules WHERE code = '${MODULE_CODE}' LIMIT 1
      ) AND p.action = 'ViewMenu'
      WHERE NOT EXISTS (
        SELECT 1
        FROM rbac_role_permissions rp
        WHERE rp.role_id = r.id
          AND rp.permission_id = p.id
      )
    `);

    await queryRunner.query(`
      UPDATE users
      SET permissions_version = COALESCE(permissions_version, 0) + 1
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE rp
      FROM rbac_role_permissions rp
      INNER JOIN rbac_permissions p ON p.id = rp.permission_id
      INNER JOIN modules m ON m.id = p.module_id
      WHERE m.code = '${MODULE_CODE}'
        AND p.action = 'ViewMenu'
    `);

    await queryRunner.query(`
      DELETE p
      FROM rbac_permissions p
      INNER JOIN modules m ON m.id = p.module_id
      WHERE m.code = '${MODULE_CODE}'
        AND p.action = 'ViewMenu'
    `);

    await queryRunner.query(`
      DELETE FROM tenant_modules
      WHERE module_id IN (SELECT id FROM modules WHERE code = '${MODULE_CODE}')
    `);

    await queryRunner.query(`
      DELETE FROM modules WHERE code = '${MODULE_CODE}'
    `);

    await queryRunner.query(`
      DELETE FROM entity_registry WHERE code = '${ENTITY_CODE}'
    `);
  }
}
