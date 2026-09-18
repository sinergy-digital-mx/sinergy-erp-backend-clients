import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * El API y la UI piden customers:Update para editar ficha y crédito.
 * Ese permiso no estaba en el catálogo (por eso Admin sí podía: bypass),
 * y en Actividades quedaban leftovers "Customer OLD" que nadie chequea.
 */
export class AddCustomersUpdateAndRemoveOldPermissions1789300000000
  implements MigrationInterface
{
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
              CASE WHEN LOWER(p.action) IN ('create', 'read', 'viewmenu') THEN 0 ELSE 1 END,
              p.created_at
            LIMIT 1
          ),
          (
            SELECT er.id
            FROM entity_registry er
            WHERE LOWER(er.code) = 'customers'
            LIMIT 1
          )
        ),
        m.id,
        'Update',
        'Actualizar clientes',
        1,
        NOW(),
        NOW()
      FROM modules m
      WHERE m.code = 'customers'
        AND NOT EXISTS (
          SELECT 1
          FROM rbac_permissions p
          WHERE p.module_id = m.id
            AND LOWER(p.action) = 'update'
        )
        AND COALESCE(
          (
            SELECT p.entity_registry_id
            FROM rbac_permissions p
            WHERE p.module_id = m.id
            ORDER BY
              CASE WHEN LOWER(p.action) IN ('create', 'read', 'viewmenu') THEN 0 ELSE 1 END,
              p.created_at
            LIMIT 1
          ),
          (
            SELECT er.id
            FROM entity_registry er
            WHERE LOWER(er.code) = 'customers'
            LIMIT 1
          )
        ) IS NOT NULL;
    `);

    await queryRunner.query(`
      INSERT INTO rbac_role_permissions (id, role_id, permission_id, created_at)
      SELECT UUID(), r.id, upd.id, NOW()
      FROM rbac_roles r
      JOIN rbac_permissions upd
        ON upd.module_id = (SELECT id FROM modules WHERE code = 'customers' LIMIT 1)
       AND LOWER(upd.action) = 'update'
      WHERE (
        r.is_admin = 1
        OR r.name = 'Admin'
        OR EXISTS (
          SELECT 1
          FROM rbac_role_permissions rp
          JOIN rbac_permissions p ON p.id = rp.permission_id
          JOIN modules m ON m.id = p.module_id
          WHERE rp.role_id = r.id
            AND m.code = 'customers'
            AND LOWER(p.action) = 'create'
        )
      )
      AND NOT EXISTS (
        SELECT 1
        FROM rbac_role_permissions rp2
        WHERE rp2.role_id = r.id
          AND rp2.permission_id = upd.id
      );
    `);

    await queryRunner.query(`
      DELETE rp
      FROM rbac_role_permissions rp
      INNER JOIN rbac_permissions p ON p.id = rp.permission_id
      INNER JOIN entity_registry er ON er.id = p.entity_registry_id
      WHERE er.code IN ('Customer OLD', 'leadOLD');
    `);

    await queryRunner.query(`
      DELETE p
      FROM rbac_permissions p
      INNER JOIN entity_registry er ON er.id = p.entity_registry_id
      WHERE er.code IN ('Customer OLD', 'leadOLD');
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
      WHERE m.code = 'customers'
        AND LOWER(p.action) = 'update';
    `);

    await queryRunner.query(`
      DELETE p
      FROM rbac_permissions p
      INNER JOIN modules m ON m.id = p.module_id
      WHERE m.code = 'customers'
        AND LOWER(p.action) = 'update';
    `);
  }
}
