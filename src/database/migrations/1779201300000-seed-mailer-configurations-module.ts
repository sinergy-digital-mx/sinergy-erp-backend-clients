import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedMailerConfigurationsModule1779201300000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO modules (id, name, code, description, created_at)
      SELECT UUID(), 'Mailer Configurations', 'mailer_configurations', 'Tenant mailer provider configurations', NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM modules WHERE code = 'mailer_configurations'
      );
    `);

    await queryRunner.query(`
      INSERT INTO entity_registry (code, name)
      SELECT 'mailer_configurations', 'Mailer Configurations'
      WHERE NOT EXISTS (
        SELECT 1 FROM entity_registry WHERE code = 'mailer_configurations'
      );
    `);

    await queryRunner.query(`
      INSERT INTO rbac_permissions (id, entity_registry_id, module_id, action, description, is_system_permission, created_at, updated_at)
      SELECT UUID(), er.id, m.id, a.action, a.description, 1, NOW(), NOW()
      FROM entity_registry er
      JOIN modules m ON m.code = 'mailer_configurations'
      JOIN (
        SELECT 'ViewMenu' AS action, 'Show Mailer Configurations module in sidebar' AS description
        UNION ALL
        SELECT 'Create' AS action, 'Create mailer configurations' AS description
        UNION ALL
        SELECT 'Read' AS action, 'Read mailer configurations' AS description
        UNION ALL
        SELECT 'Update' AS action, 'Update and activate mailer configurations' AS description
        UNION ALL
        SELECT 'Delete' AS action, 'Delete mailer configurations' AS description
      ) a
      WHERE er.code = 'mailer_configurations'
        AND NOT EXISTS (
          SELECT 1
          FROM rbac_permissions p
          WHERE p.entity_registry_id = er.id
            AND p.module_id = m.id
            AND p.action = a.action
        );
    `);

    await queryRunner.query(`
      INSERT INTO tenant_modules (id, tenant_id, module_id, is_enabled, created_at)
      SELECT UUID(), t.id, m.id, 1, NOW()
      FROM rbac_tenants t
      JOIN modules m ON m.code = 'mailer_configurations'
      WHERE NOT EXISTS (
        SELECT 1
        FROM tenant_modules tm
        WHERE tm.tenant_id = t.id
          AND tm.module_id = m.id
      );
    `);

    await queryRunner.query(`
      INSERT INTO rbac_role_permissions (id, role_id, permission_id, created_at)
      SELECT UUID(), r.id, p.id, NOW()
      FROM rbac_roles r
      JOIN rbac_permissions p ON p.module_id = (
        SELECT id FROM modules WHERE code = 'mailer_configurations' LIMIT 1
      )
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
      WHERE m.code = 'mailer_configurations';
    `);

    await queryRunner.query(`
      DELETE FROM tenant_modules
      WHERE module_id = (SELECT id FROM modules WHERE code = 'mailer_configurations' LIMIT 1);
    `);

    await queryRunner.query(`
      DELETE p
      FROM rbac_permissions p
      INNER JOIN modules m ON m.id = p.module_id
      WHERE m.code = 'mailer_configurations';
    `);

    await queryRunner.query(`
      DELETE FROM entity_registry WHERE code = 'mailer_configurations';
    `);

    await queryRunner.query(`
      DELETE FROM modules WHERE code = 'mailer_configurations';
    `);
  }
}
