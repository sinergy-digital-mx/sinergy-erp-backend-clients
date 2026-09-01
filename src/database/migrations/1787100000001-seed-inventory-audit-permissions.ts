import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Permisos de auditoría de inventario por lote.
 * Count: crear conteo y capturar cantidades.
 * Authorize: aprobar/rechazar y aplicar corrección al lote.
 * Se asignan a todos los roles Admin.
 */
export class SeedInventoryAuditPermissions1787100000001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.insertPermission(
      queryRunner,
      'Count',
      'Realizar conteo físico de inventario por lote',
    );
    await this.insertPermission(
      queryRunner,
      'Authorize',
      'Autorizar y aplicar correcciones de auditoría de inventario',
    );

    await queryRunner.query(`
      INSERT INTO rbac_role_permissions (id, role_id, permission_id, created_at)
      SELECT UUID(), r.id, p.id, NOW()
      FROM rbac_roles r
      JOIN rbac_permissions p
        ON p.action IN ('Count', 'Authorize')
        AND p.module_id = (SELECT id FROM modules WHERE code = 'inventory' LIMIT 1)
      WHERE r.name = 'Admin'
        AND NOT EXISTS (
          SELECT 1
          FROM rbac_role_permissions rp
          WHERE rp.role_id = r.id
            AND rp.permission_id = p.id
        );
    `);

    await queryRunner.query(`
      UPDATE users u
      INNER JOIN rbac_user_roles ur ON ur.user_id = u.id
      INNER JOIN rbac_roles r ON r.id = ur.role_id AND r.name = 'Admin'
      SET u.permissions_version = COALESCE(u.permissions_version, 0) + 1
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE rp
      FROM rbac_role_permissions rp
      INNER JOIN rbac_permissions p ON p.id = rp.permission_id
      INNER JOIN modules m ON m.id = p.module_id
      WHERE m.code = 'inventory'
        AND p.action IN ('Count', 'Authorize');
    `);

    await queryRunner.query(`
      DELETE p
      FROM rbac_permissions p
      INNER JOIN modules m ON m.id = p.module_id
      WHERE m.code = 'inventory'
        AND p.action IN ('Count', 'Authorize');
    `);
  }

  private async insertPermission(
    queryRunner: QueryRunner,
    action: string,
    description: string,
  ): Promise<void> {
    await queryRunner.query(
      `
      INSERT INTO rbac_permissions (
        id, entity_registry_id, module_id, action, description,
        is_system_permission, created_at, updated_at
      )
      SELECT
        UUID(),
        er.id,
        m.id,
        ?,
        ?,
        1,
        NOW(),
        NOW()
      FROM entity_registry er
      JOIN modules m ON m.code = 'inventory'
      WHERE er.code = 'Inventory'
        AND NOT EXISTS (
          SELECT 1
          FROM rbac_permissions p
          WHERE p.module_id = m.id
            AND p.action = ?
        );
    `,
      [action, description, action],
    );

    await queryRunner.query(
      `
      INSERT INTO rbac_permissions (
        id, entity_registry_id, module_id, action, description,
        is_system_permission, created_at, updated_at
      )
      SELECT
        UUID(),
        er.id,
        m.id,
        ?,
        ?,
        1,
        NOW(),
        NOW()
      FROM entity_registry er
      JOIN modules m ON m.code = 'inventory'
      WHERE LOWER(er.code) = 'inventory'
        AND NOT EXISTS (
          SELECT 1
          FROM rbac_permissions p
          WHERE p.module_id = m.id
            AND p.action = ?
        );
    `,
      [action, description, action],
    );
  }
}
