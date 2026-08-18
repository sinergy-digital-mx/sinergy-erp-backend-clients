import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Liga User:Reset_Password al módulo users para que aparezca en el editor de Roles
 * (Administración → Usuarios) y se pueda asignar a cualquier rol.
 * También lo asigna a todos los roles Admin.
 */
export class AttachUserResetPasswordToUsersModule1785700000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE rbac_permissions p
      INNER JOIN entity_registry er ON er.id = p.entity_registry_id
      INNER JOIN modules m ON m.code = 'users'
      SET p.module_id = m.id, p.updated_at = NOW()
      WHERE p.action = 'Reset_Password'
        AND LOWER(er.code) = 'user'
        AND p.module_id IS NULL
    `);

    await queryRunner.query(`
      INSERT INTO rbac_role_permissions (id, role_id, permission_id, created_at)
      SELECT UUID(), r.id, p.id, NOW()
      FROM rbac_roles r
      JOIN rbac_permissions p ON p.action = 'Reset_Password'
      JOIN entity_registry er ON er.id = p.entity_registry_id AND LOWER(er.code) = 'user'
      WHERE r.name = 'Admin'
        AND NOT EXISTS (
          SELECT 1
          FROM rbac_role_permissions rp
          WHERE rp.role_id = r.id
            AND rp.permission_id = p.id
        )
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
      UPDATE rbac_permissions p
      INNER JOIN entity_registry er ON er.id = p.entity_registry_id
      INNER JOIN modules m ON m.code = 'users'
      SET p.module_id = NULL, p.updated_at = NOW()
      WHERE p.action = 'Reset_Password'
        AND LOWER(er.code) = 'user'
        AND p.module_id = m.id
    `);
  }
}
