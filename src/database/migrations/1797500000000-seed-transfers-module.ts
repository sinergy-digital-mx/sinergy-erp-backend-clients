import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Transferencias como módulo propio.
 * Quien ya ve inventario o transfiere conserva el acceso.
 * Un rol nuevo puede tener solo Transferencias, sin Inventario.
 */
export class SeedTransfersModule1797500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO modules (id, name, code, description, created_at)
      SELECT UUID(), 'Transferencias', 'transfers',
        'Transferencias de inventario entre sucursales', NOW()
      WHERE NOT EXISTS (SELECT 1 FROM modules WHERE code = 'transfers');
    `);

    await queryRunner.query(`
      INSERT INTO entity_registry (code, name)
      SELECT 'Transfer', 'Transferencias'
      WHERE NOT EXISTS (SELECT 1 FROM entity_registry WHERE code = 'Transfer');
    `);

    await queryRunner.query(`
      INSERT INTO rbac_permissions (
        id, entity_registry_id, module_id, action, description,
        is_system_permission, created_at, updated_at
      )
      SELECT UUID(), er.id, m.id, a.action, a.description, 1, NOW(), NOW()
      FROM entity_registry er
      JOIN modules m ON m.code = 'transfers'
      JOIN (
        SELECT 'ViewMenu' AS action, 'Ver Transferencias en el menú' AS description
        UNION ALL SELECT 'Read', 'Consultar transferencias'
        UNION ALL SELECT 'Create', 'Crear transferencias'
        UNION ALL SELECT 'Update', 'Recibir o cancelar transferencias'
      ) a
      WHERE er.code = 'Transfer'
        AND NOT EXISTS (
          SELECT 1 FROM rbac_permissions p
          WHERE p.module_id = m.id AND p.action = a.action
        );
    `);

    await queryRunner.query(`
      INSERT INTO tenant_modules (id, tenant_id, module_id, is_enabled, created_at)
      SELECT UUID(), t.id, m.id, 1, NOW()
      FROM rbac_tenants t
      JOIN modules m ON m.code = 'transfers'
      WHERE NOT EXISTS (
        SELECT 1 FROM tenant_modules tm
        WHERE tm.tenant_id = t.id AND tm.module_id = m.id
      );
    `);

    await queryRunner.query(`
      INSERT INTO rbac_role_permissions (id, role_id, permission_id, created_at)
      SELECT UUID(), src.role_id, dest.id, NOW()
      FROM rbac_role_permissions src
      JOIN rbac_permissions inv ON inv.id = src.permission_id
      JOIN modules inv_mod ON inv_mod.id = inv.module_id AND inv_mod.code = 'inventory'
      JOIN rbac_permissions dest ON dest.module_id = (
        SELECT id FROM modules WHERE code = 'transfers' LIMIT 1
      )
      WHERE (
        (
          LOWER(inv.action) IN ('read', 'viewmenu')
          AND dest.action IN ('ViewMenu', 'Read')
        ) OR (
          LOWER(inv.action) IN ('transfer', 'create', 'write', 'update')
          AND dest.action IN ('Create', 'Update', 'ViewMenu', 'Read')
        )
      )
      AND NOT EXISTS (
        SELECT 1 FROM rbac_role_permissions rp
        WHERE rp.role_id = src.role_id AND rp.permission_id = dest.id
      );
    `);

    await queryRunner.query(`
      INSERT INTO rbac_role_permissions (id, role_id, permission_id, created_at)
      SELECT UUID(), r.id, p.id, NOW()
      FROM rbac_roles r
      JOIN rbac_permissions p ON p.module_id = (
        SELECT id FROM modules WHERE code = 'transfers' LIMIT 1
      )
      WHERE (r.is_admin = 1 OR r.name = 'Admin' OR r.name = 'Direccion')
        AND NOT EXISTS (
          SELECT 1 FROM rbac_role_permissions rp
          WHERE rp.role_id = r.id AND rp.permission_id = p.id
        );
    `);

    await queryRunner.query(`
      UPDATE users
      SET permissions_version = COALESCE(permissions_version, 0) + 1
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE rp FROM rbac_role_permissions rp
      INNER JOIN rbac_permissions p ON p.id = rp.permission_id
      INNER JOIN modules m ON m.id = p.module_id
      WHERE m.code = 'transfers';
    `);
    await queryRunner.query(`
      DELETE FROM tenant_modules
      WHERE module_id = (SELECT id FROM modules WHERE code = 'transfers' LIMIT 1);
    `);
    await queryRunner.query(`
      DELETE p FROM rbac_permissions p
      INNER JOIN modules m ON m.id = p.module_id
      WHERE m.code = 'transfers';
    `);
    await queryRunner.query(`DELETE FROM modules WHERE code = 'transfers';`);
    await queryRunner.query(`DELETE FROM entity_registry WHERE code = 'Transfer';`);
  }
}
