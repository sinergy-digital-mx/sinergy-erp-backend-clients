import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Productos y proveedores pasan al menú principal.
 * Asegura ViewMenu (como el resto de vistas) y lo asigna a admin
 * y a los roles que ya tenían algún permiso del módulo.
 * Configuración deja de llamarse catálogo de productos y proveedores.
 */
const MENU_PERMISSIONS: { moduleCode: string; description: string }[] = [
  { moduleCode: 'products', description: 'Ver menú de Productos' },
  { moduleCode: 'vendors', description: 'Ver menú de Proveedores' },
];

export class SeedProductsVendorsViewMenu1795000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const permission of MENU_PERMISSIONS) {
      await this.insertViewMenu(queryRunner, permission.moduleCode, permission.description);
      await this.assignViewMenu(queryRunner, permission.moduleCode);
    }

    await queryRunner.query(`
      UPDATE modules
      SET
        name = 'Configuración',
        description = 'Acceso al menú de Configuración'
      WHERE code = 'settings'
    `);

    await queryRunner.query(`
      UPDATE users
      SET permissions_version = COALESCE(permissions_version, 0) + 1
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const codes = MENU_PERMISSIONS.map((permission) => this.sql(permission.moduleCode)).join(', ');

    await queryRunner.query(`
      DELETE rp
      FROM rbac_role_permissions rp
      INNER JOIN rbac_permissions p ON p.id = rp.permission_id
      INNER JOIN modules m ON m.id = p.module_id
      WHERE m.code IN (${codes})
        AND LOWER(p.action) = 'viewmenu'
    `);

    await queryRunner.query(`
      DELETE p
      FROM rbac_permissions p
      INNER JOIN modules m ON m.id = p.module_id
      WHERE m.code IN (${codes})
        AND LOWER(p.action) = 'viewmenu'
    `);

    await queryRunner.query(`
      UPDATE modules
      SET
        name = 'Catálogo Productos y Proveedores',
        description = 'Acceso al menú de Configuración y al catálogo de productos y proveedores'
      WHERE code = 'settings'
    `);
  }

  private async insertViewMenu(
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
            WHERE LOWER(er.code) IN (${module}, ${this.sql(moduleCode.replace(/s$/, ''))})
            LIMIT 1
          )
        ),
        m.id,
        'ViewMenu',
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
            AND LOWER(p.action) = 'viewmenu'
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
            WHERE LOWER(er.code) IN (${module}, ${this.sql(moduleCode.replace(/s$/, ''))})
            LIMIT 1
          )
        ) IS NOT NULL
    `);
  }

  private async assignViewMenu(queryRunner: QueryRunner, moduleCode: string): Promise<void> {
    const module = this.sql(moduleCode);

    await queryRunner.query(`
      INSERT INTO rbac_role_permissions (id, role_id, permission_id, created_at)
      SELECT UUID(), r.id, perm.id, NOW()
      FROM rbac_roles r
      JOIN rbac_permissions perm
        ON perm.module_id = (SELECT id FROM modules WHERE code = ${module} LIMIT 1)
       AND LOWER(perm.action) = 'viewmenu'
      WHERE (
        r.is_admin = 1
        OR r.name = 'Admin'
        OR EXISTS (
          SELECT 1
          FROM rbac_role_permissions rp
          INNER JOIN rbac_permissions existing ON existing.id = rp.permission_id
          WHERE rp.role_id = r.id
            AND existing.module_id = perm.module_id
            AND LOWER(existing.action) <> 'viewmenu'
        )
      )
      AND NOT EXISTS (
        SELECT 1
        FROM rbac_role_permissions rp
        WHERE rp.role_id = r.id
          AND rp.permission_id = perm.id
      )
    `);
  }

  private sql(value: string): string {
    return `'${value.replace(/'/g, "''")}'`;
  }
}
