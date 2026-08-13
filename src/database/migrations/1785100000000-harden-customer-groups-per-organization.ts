import { MigrationInterface, QueryRunner } from 'typeorm';

const MODULE_CODE = 'customer-groups';
const ENTITY_CODE = 'CustomerGroup';
/** Organización Divino: no alterar UUIDs de sus grupos existentes. */
const DIVINO_ORGANIZATION_ID = '54481b63-5516-458d-9bb3-d4e5cb028864';

/**
 * Aísla grupos de clientes por organización, mueve el módulo a Configuración
 * y alinea permisos CRUD. No modifica IDs de customer_groups (Divino los usa).
 */
export class HardenCustomerGroupsPerOrganization1785100000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const isSystemColumn = await queryRunner.query(`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'customer_groups'
        AND COLUMN_NAME = 'is_system'
    `);

    if (!isSystemColumn.length) {
      await queryRunner.query(`
        ALTER TABLE customer_groups
        ADD COLUMN is_system TINYINT(1) NOT NULL DEFAULT 0
        AFTER description
      `);
    }

    // Proteger solo grupos de Divino que ya tienen clientes. No toca los UUID.
    await queryRunner.query(
      `
      UPDATE customer_groups cg
      SET cg.is_system = 1
      WHERE cg.tenant_id = ?
        AND EXISTS (
          SELECT 1 FROM customers c WHERE c.group_id = cg.id
        )
      `,
      [DIVINO_ORGANIZATION_ID],
    );

    await queryRunner.query(`
      INSERT INTO modules (id, name, code, description, category, sort_order, created_at)
      SELECT UUID(), 'Grupos de Clientes', '${MODULE_CODE}',
        'Catálogo de grupos de clientes por organización', 'settings', 4, NOW()
      WHERE NOT EXISTS (SELECT 1 FROM modules WHERE code = '${MODULE_CODE}')
    `);

    await queryRunner.query(`
      UPDATE modules
      SET
        name = 'Grupos de Clientes',
        description = 'Catálogo de grupos de clientes por organización',
        category = 'settings',
        sort_order = 4
      WHERE code = '${MODULE_CODE}'
    `);

    await queryRunner.query(`
      INSERT INTO entity_registry (code, name)
      SELECT '${ENTITY_CODE}', 'Grupos de Clientes'
      WHERE NOT EXISTS (
        SELECT 1 FROM entity_registry WHERE code = '${ENTITY_CODE}'
      )
    `);

    await queryRunner.query(`
      INSERT INTO rbac_permissions (
        id, entity_registry_id, module_id, action, description,
        is_system_permission, created_at, updated_at
      )
      SELECT UUID(), er.id, m.id, a.action, a.description, 1, NOW(), NOW()
      FROM entity_registry er
      JOIN modules m ON m.code = '${MODULE_CODE}'
      JOIN (
        SELECT 'ViewMenu' AS action, 'Ver Grupos de Clientes en Configuración' AS description
        UNION ALL SELECT 'Create', 'Crear grupos de clientes'
        UNION ALL SELECT 'Read', 'Ver grupos de clientes'
        UNION ALL SELECT 'Update', 'Actualizar grupos de clientes'
        UNION ALL SELECT 'Delete', 'Eliminar grupos de clientes'
      ) a
      WHERE er.code = '${ENTITY_CODE}'
        AND NOT EXISTS (
          SELECT 1
          FROM rbac_permissions p
          WHERE p.module_id = m.id
            AND LOWER(p.action) = LOWER(a.action)
        )
    `);

    // write (legacy) cubría crear + editar
    await queryRunner.query(`
      INSERT INTO rbac_role_permissions (id, role_id, permission_id, created_at)
      SELECT UUID(), rp.role_id, new_p.id, NOW()
      FROM rbac_role_permissions rp
      INNER JOIN rbac_permissions old_p ON old_p.id = rp.permission_id
      INNER JOIN modules m ON m.id = old_p.module_id AND m.code = '${MODULE_CODE}'
      INNER JOIN rbac_permissions new_p
        ON new_p.module_id = m.id
       AND new_p.action IN ('Create', 'Update')
      WHERE LOWER(old_p.action) = 'write'
        AND NOT EXISTS (
          SELECT 1
          FROM rbac_role_permissions existing
          WHERE existing.role_id = rp.role_id
            AND existing.permission_id = new_p.id
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
      )
      WHERE r.name = 'Admin'
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
      UPDATE modules
      SET category = 'crm', sort_order = 3
      WHERE code = '${MODULE_CODE}'
    `);

    const isSystemColumn = await queryRunner.query(`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'customer_groups'
        AND COLUMN_NAME = 'is_system'
    `);

    if (isSystemColumn.length) {
      await queryRunner.query(`
        ALTER TABLE customer_groups DROP COLUMN is_system
      `);
    }
  }
}
