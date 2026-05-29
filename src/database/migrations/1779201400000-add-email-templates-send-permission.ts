import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailTemplatesSendPermission1779201400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO rbac_permissions (id, entity_registry_id, module_id, action, description, is_system_permission, created_at, updated_at)
      SELECT UUID(), er.id, m.id, 'Send', 'Send email templates through active tenant mailer configuration', 1, NOW(), NOW()
      FROM modules m
      JOIN entity_registry er ON er.code = 'email-templates'
      WHERE m.code = 'email-templates'
        AND NOT EXISTS (
          SELECT 1
          FROM rbac_permissions p
          WHERE p.entity_registry_id = er.id
            AND p.module_id = m.id
            AND p.action = 'Send'
        );
    `);

    await queryRunner.query(`
      INSERT INTO rbac_role_permissions (id, role_id, permission_id, created_at)
      SELECT UUID(), r.id, p.id, NOW()
      FROM rbac_roles r
      JOIN modules m ON m.code = 'email-templates'
      JOIN rbac_permissions p ON p.module_id = m.id AND p.action = 'Send'
      WHERE r.name = 'Admin'
        AND NOT EXISTS (
          SELECT 1
          FROM rbac_role_permissions rp
          WHERE rp.role_id = r.id
            AND rp.permission_id = p.id
        );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE rp
      FROM rbac_role_permissions rp
      INNER JOIN rbac_permissions p ON p.id = rp.permission_id
      INNER JOIN modules m ON m.id = p.module_id
      WHERE m.code = 'email-templates'
        AND p.action = 'Send';
    `);

    await queryRunner.query(`
      DELETE p
      FROM rbac_permissions p
      INNER JOIN modules m ON m.id = p.module_id
      WHERE m.code = 'email-templates'
        AND p.action = 'Send';
    `);
  }
}
