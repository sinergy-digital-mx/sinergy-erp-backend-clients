import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Permiso para ver las tarjetas de arriba en inventario, órdenes de compra
 * y órdenes de venta. Clientes ya tiene el suyo (ViewStats).
 * Solo el rol Admin lo recibe. El resto se asigna en Roles.
 */
const LIST_STATS_PERMISSIONS: { moduleCode: string; description: string }[] = [
  {
    moduleCode: 'inventory',
    description: 'Ver las tarjetas de resumen del inventario (lotes, costo, precio y margen)',
  },
  {
    moduleCode: 'purchase_orders',
    description: 'Ver las tarjetas de resumen de órdenes de compra (estado y pago)',
  },
  {
    moduleCode: 'sales_orders',
    description: 'Ver el resumen de órdenes de venta (estado, pago y últimos 12 meses)',
  },
];

export class AddListViewStatsPermissions1794900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const permission of LIST_STATS_PERMISSIONS) {
      await this.insertPermission(queryRunner, permission.moduleCode, permission.description);
      await this.assignToAdmin(queryRunner, permission.moduleCode);
    }

    await queryRunner.query(`
      UPDATE users
      SET permissions_version = COALESCE(permissions_version, 0) + 1
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const codes = LIST_STATS_PERMISSIONS.map((permission) => `'${permission.moduleCode}'`).join(', ');

    await queryRunner.query(`
      DELETE rp
      FROM rbac_role_permissions rp
      INNER JOIN rbac_permissions p ON p.id = rp.permission_id
      INNER JOIN modules m ON m.id = p.module_id
      WHERE m.code IN (${codes})
        AND LOWER(p.action) = 'viewstats';
    `);

    await queryRunner.query(`
      DELETE p
      FROM rbac_permissions p
      INNER JOIN modules m ON m.id = p.module_id
      WHERE m.code IN (${codes})
        AND LOWER(p.action) = 'viewstats';
    `);
  }

  private async insertPermission(
    queryRunner: QueryRunner,
    moduleCode: string,
    description: string,
  ): Promise<void> {
    const module = this.sql(moduleCode);
    const text = this.sql(description);

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
            WHERE LOWER(er.code) = ${module}
            LIMIT 1
          )
        ),
        m.id,
        'ViewStats',
        ${text},
        1,
        NOW(),
        NOW()
      FROM modules m
      WHERE m.code = ${module}
        AND NOT EXISTS (
          SELECT 1
          FROM rbac_permissions p
          WHERE p.module_id = m.id
            AND LOWER(p.action) = 'viewstats'
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
            WHERE LOWER(er.code) = ${module}
            LIMIT 1
          )
        ) IS NOT NULL;
    `);
  }

  private async assignToAdmin(queryRunner: QueryRunner, moduleCode: string): Promise<void> {
    const module = this.sql(moduleCode);

    await queryRunner.query(`
      INSERT INTO rbac_role_permissions (id, role_id, permission_id, created_at)
      SELECT UUID(), r.id, perm.id, NOW()
      FROM rbac_roles r
      JOIN rbac_permissions perm
        ON perm.module_id = (SELECT id FROM modules WHERE code = ${module} LIMIT 1)
       AND LOWER(perm.action) = 'viewstats'
      WHERE (
        r.is_admin = 1
        OR r.name = 'Admin'
      )
      AND NOT EXISTS (
        SELECT 1
        FROM rbac_role_permissions rp
        WHERE rp.role_id = r.id
          AND rp.permission_id = perm.id
      );
    `);
  }

  private sql(value: string): string {
    return `'${value.replace(/'/g, "''")}'`;
  }
}
