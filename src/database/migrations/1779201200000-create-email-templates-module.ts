import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEmailTemplatesModule1779201200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tenantIdDefinition = await this.getColumnDefinition(
      queryRunner,
      'rbac_tenants',
      'id',
      'varchar(36)',
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS email_templates (
        id varchar(36) NOT NULL,
        tenant_id ${tenantIdDefinition} NOT NULL,
        name varchar(150) NOT NULL,
        subject varchar(255) NOT NULL,
        body_html longtext NOT NULL,
        variables json NULL,
        custom_variables json NULL,
        is_active tinyint(1) NOT NULL DEFAULT 1,
        created_by varchar(36) NULL,
        updated_by varchar(36) NULL,
        deleted_at timestamp NULL DEFAULT NULL,
        deleted_by varchar(36) NULL,
        created_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        INDEX idx_email_templates_tenant_active (tenant_id, is_active),
        INDEX idx_email_templates_tenant_name (tenant_id, name),
        CONSTRAINT fk_email_templates_tenant
          FOREIGN KEY (tenant_id) REFERENCES rbac_tenants(id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await queryRunner.query(`
      INSERT INTO modules (id, name, code, description, created_at)
      SELECT UUID(), 'Email Templates', 'email-templates', 'Tenant email template management', NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM modules WHERE code = 'email-templates'
      );
    `);

    await queryRunner.query(`
      INSERT INTO entity_registry (code, name)
      SELECT 'email-templates', 'Email Templates'
      WHERE NOT EXISTS (
        SELECT 1 FROM entity_registry WHERE code = 'email-templates'
      );
    `);

    await queryRunner.query(`
      INSERT INTO rbac_permissions (id, entity_registry_id, module_id, action, description, is_system_permission, created_at, updated_at)
      SELECT UUID(), er.id, m.id, a.action, a.description, 1, NOW(), NOW()
      FROM entity_registry er
      JOIN modules m ON m.code = 'email-templates'
      JOIN (
        SELECT 'ViewMenu' AS action, 'Show Email Templates module in sidebar' AS description
        UNION ALL
        SELECT 'Create' AS action, 'Create email templates' AS description
        UNION ALL
        SELECT 'Read' AS action, 'Read email templates and available variables' AS description
        UNION ALL
        SELECT 'Update' AS action, 'Update email templates' AS description
        UNION ALL
        SELECT 'Delete' AS action, 'Delete email templates' AS description
      ) a
      WHERE er.code = 'email-templates'
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
      JOIN modules m ON m.code = 'email-templates'
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
        SELECT id FROM modules WHERE code = 'email-templates' LIMIT 1
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
      WHERE m.code = 'email-templates';
    `);

    await queryRunner.query(`
      DELETE FROM tenant_modules
      WHERE module_id = (SELECT id FROM modules WHERE code = 'email-templates' LIMIT 1);
    `);

    await queryRunner.query(`
      DELETE p
      FROM rbac_permissions p
      INNER JOIN modules m ON m.id = p.module_id
      WHERE m.code = 'email-templates';
    `);

    await queryRunner.query(`
      DELETE FROM entity_registry WHERE code = 'email-templates';
    `);

    await queryRunner.query(`
      DELETE FROM modules WHERE code = 'email-templates';
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS email_templates;
    `);
  }

  private async getColumnDefinition(
    queryRunner: QueryRunner,
    tableName: string,
    columnName: string,
    fallbackType: string,
  ): Promise<string> {
    const databaseNameResult = await queryRunner.query(`SELECT DATABASE() as db`);
    const databaseName = databaseNameResult?.[0]?.db;

    if (!databaseName) {
      return fallbackType;
    }

    const columnMeta = await queryRunner.query(
      `
        SELECT COLUMN_TYPE, CHARACTER_SET_NAME, COLLATION_NAME
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = ?
          AND TABLE_NAME = ?
          AND COLUMN_NAME = ?
      `,
      [databaseName, tableName, columnName],
    );

    if (!columnMeta?.length) {
      return fallbackType;
    }

    const { COLUMN_TYPE, CHARACTER_SET_NAME, COLLATION_NAME } = columnMeta[0];
    let definition = COLUMN_TYPE || fallbackType;

    if (CHARACTER_SET_NAME) {
      definition += ` CHARACTER SET ${CHARACTER_SET_NAME}`;
    }

    if (COLLATION_NAME) {
      definition += ` COLLATE ${COLLATION_NAME}`;
    }

    return definition;
  }
}
