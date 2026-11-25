import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Precio, costo y margen de inventario. No lo reciben los operadores.
 * Los roles administrador sí, para no quitarlo en las otras empresas.
 * En la maderería el administrador es el rol Direccion.
 */
export class AddInventoryViewMarginPermission1797200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO rbac_permissions (
        id, entity_registry_id, module_id, action, description,
        is_system_permission, created_at, updated_at
      )
      SELECT
        UUID(),
        COALESCE(
          (
            SELECT p.entity_registry_id
            FROM rbac_permissions p
            WHERE p.module_id = m.id
            ORDER BY
              CASE WHEN LOWER(p.action) IN ('read', 'viewmenu', 'viewstats') THEN 0 ELSE 1 END,
              p.created_at
            LIMIT 1
          ),
          (
            SELECT er.id
            FROM entity_registry er
            WHERE LOWER(er.code) = 'inventory'
            LIMIT 1
          )
        ),
        m.id,
        'ViewMargin',
        'Ver precio, costo y margen en inventario',
        1,
        NOW(),
        NOW()
      FROM modules m
      WHERE m.code = 'inventory'
        AND NOT EXISTS (
          SELECT 1
          FROM rbac_permissions p
          WHERE p.module_id = m.id
            AND LOWER(p.action) = 'viewmargin'
        )
        AND COALESCE(
          (
            SELECT p.entity_registry_id
            FROM rbac_permissions p
            WHERE p.module_id = m.id
            ORDER BY
              CASE WHEN LOWER(p.action) IN ('read', 'viewmenu', 'viewstats') THEN 0 ELSE 1 END,
              p.created_at
            LIMIT 1
          ),
          (
            SELECT er.id
            FROM entity_registry er
            WHERE LOWER(er.code) = 'inventory'
            LIMIT 1
          )
        ) IS NOT NULL;
    `);

    await queryRunner.query(`
      INSERT INTO rbac_role_permissions (id, role_id, permission_id, created_at)
      SELECT UUID(), r.id, perm.id, NOW()
      FROM rbac_roles r
      JOIN rbac_permissions perm
        ON perm.module_id = (SELECT id FROM modules WHERE code = 'inventory' LIMIT 1)
       AND LOWER(perm.action) = 'viewmargin'
      WHERE (
        r.is_admin = 1
        OR r.name = 'Admin'
        OR r.name = 'Direccion'
      )
      AND NOT EXISTS (
        SELECT 1
        FROM rbac_role_permissions rp
        WHERE rp.role_id = r.id
          AND rp.permission_id = perm.id
      );
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
      WHERE m.code = 'inventory'
        AND LOWER(p.action) = 'viewmargin';
    `);

    await queryRunner.query(`
      DELETE p
      FROM rbac_permissions p
      INNER JOIN modules m ON m.id = p.module_id
      WHERE m.code = 'inventory'
        AND LOWER(p.action) = 'viewmargin';
    `);
  }
}
