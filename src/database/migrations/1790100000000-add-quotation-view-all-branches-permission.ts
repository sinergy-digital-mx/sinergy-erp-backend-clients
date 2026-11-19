import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Alcance de sucursal en cotizaciones por permiso, no por rol Admin.
 * Quotation:ViewAllBranches = ver cotizaciones de todas las sucursales.
 * Sin ese permiso, solo las sucursales asignadas al usuario.
 */
export class AddQuotationViewAllBranchesPermission1790100000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO rbac_permissions (
        id, entity_registry_id, module_id, action, description,
        is_system_permission, created_at, updated_at
      )
      SELECT UUID(), er.id, m.id, 'ViewAllBranches',
        'Ver cotizaciones de todas las sucursales (no solo las asignadas al usuario)',
        1, NOW(), NOW()
      FROM entity_registry er
      JOIN modules m ON m.code = 'quotations'
      WHERE er.code = 'Quotation'
        AND NOT EXISTS (
          SELECT 1 FROM rbac_permissions p
          WHERE p.module_id = m.id AND LOWER(p.action) = 'viewallbranches'
        )
    `);

    await queryRunner.query(`
      INSERT INTO rbac_role_permissions (id, role_id, permission_id, created_at)
      SELECT UUID(), r.id, p.id, NOW()
      FROM rbac_roles r
      JOIN rbac_permissions p ON p.module_id = (
        SELECT id FROM modules WHERE code = 'quotations' LIMIT 1
      ) AND LOWER(p.action) = 'viewallbranches'
      WHERE (r.is_admin = 1 OR r.name = 'Admin')
        AND NOT EXISTS (
          SELECT 1 FROM rbac_role_permissions rp
          WHERE rp.role_id = r.id AND rp.permission_id = p.id
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
      WHERE m.code = 'quotations' AND LOWER(p.action) = 'viewallbranches'
    `);

    await queryRunner.query(`
      DELETE p
      FROM rbac_permissions p
      INNER JOIN modules m ON m.id = p.module_id
      WHERE m.code = 'quotations' AND LOWER(p.action) = 'viewallbranches'
    `);
  }
}
