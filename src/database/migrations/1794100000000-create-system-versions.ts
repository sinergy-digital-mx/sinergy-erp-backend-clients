import { MigrationInterface, QueryRunner } from 'typeorm';

const MODULE_CODE = 'system-versions';
const ENTITY_CODE = 'system-versions';

/**
 * Historial de versiones por organización.
 * Se habilita en todos los tenants; la pantalla solo aparece si el módulo sigue activo
 * y el rol tiene el permiso.
 */
export class CreateSystemVersions1794100000000 implements MigrationInterface {
  name = 'CreateSystemVersions1794100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tenantIdDefinition = await this.getColumnDefinition(
      queryRunner,
      'rbac_tenants',
      'id',
      'varchar(36)',
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS system_versions (
        id varchar(36) NOT NULL,
        tenant_id ${tenantIdDefinition} NOT NULL,
        release_key varchar(160) NOT NULL,
        version varchar(32) NOT NULL,
        build_id varchar(80) NULL,
        channel varchar(16) NOT NULL,
        title varchar(180) NOT NULL,
        changes json NOT NULL,
        released_at datetime NOT NULL,
        created_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        UNIQUE KEY uq_system_versions_tenant_release (tenant_id, release_key),
        KEY idx_system_versions_tenant_released (tenant_id, released_at),
        CONSTRAINT fk_system_versions_tenant
          FOREIGN KEY (tenant_id) REFERENCES rbac_tenants(id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      INSERT INTO modules (id, name, code, description, category, sort_order, created_at)
      SELECT UUID(), 'Versiones', '${MODULE_CODE}',
        'Historial de actualizaciones del sistema por organización',
        'settings', 20, NOW()
      WHERE NOT EXISTS (SELECT 1 FROM modules WHERE code = '${MODULE_CODE}')
    `);

    await queryRunner.query(`
      UPDATE modules
      SET
        name = 'Versiones',
        description = 'Historial de actualizaciones del sistema por organización',
        category = 'settings',
        sort_order = 20
      WHERE code = '${MODULE_CODE}'
    `);

    await queryRunner.query(`
      INSERT INTO entity_registry (code, name)
      SELECT '${ENTITY_CODE}', 'Versiones'
      WHERE NOT EXISTS (SELECT 1 FROM entity_registry WHERE code = '${ENTITY_CODE}')
    `);

    await queryRunner.query(`
      INSERT INTO rbac_permissions (
        id, entity_registry_id, module_id, action, description,
        is_system_permission, created_at, updated_at
      )
      SELECT UUID(), er.id, m.id, a.action, a.description, 1, NOW(), NOW()
      FROM entity_registry er
      JOIN modules m ON m.code = '${MODULE_CODE}'
      JOIN (
        SELECT 'ViewMenu' AS action, 'Ver versiones en configuración' AS description
        UNION ALL
        SELECT 'Read' AS action, 'Consultar el historial de versiones' AS description
      ) a
      WHERE er.code = '${ENTITY_CODE}'
        AND NOT EXISTS (
          SELECT 1
          FROM rbac_permissions p
          WHERE p.entity_registry_id = er.id
            AND p.module_id = m.id
            AND p.action = a.action
        )
    `);

    await queryRunner.query(`
      INSERT INTO tenant_modules (id, tenant_id, module_id, is_enabled, created_at)
      SELECT UUID(), t.id, m.id, 1, NOW()
      FROM rbac_tenants t
      JOIN modules m ON m.code = '${MODULE_CODE}'
      WHERE NOT EXISTS (
        SELECT 1
        FROM tenant_modules tm
        WHERE tm.tenant_id = t.id
          AND tm.module_id = m.id
      )
    `);

    await queryRunner.query(`
      INSERT INTO rbac_role_permissions (id, role_id, permission_id, created_at)
      SELECT UUID(), r.id, p.id, NOW()
      FROM rbac_roles r
      JOIN rbac_permissions p ON p.module_id = (
        SELECT id FROM modules WHERE code = '${MODULE_CODE}' LIMIT 1
      )
      WHERE (r.name = 'Admin' OR r.is_admin = 1)
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
      INNER JOIN rbac_roles r ON r.id = ur.role_id
      SET u.permissions_version = COALESCE(u.permissions_version, 0) + 1
      WHERE r.name = 'Admin' OR r.is_admin = 1
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE rp
      FROM rbac_role_permissions rp
      INNER JOIN rbac_permissions p ON p.id = rp.permission_id
      INNER JOIN modules m ON m.id = p.module_id
      WHERE m.code = '${MODULE_CODE}'
    `);

    await queryRunner.query(`
      DELETE FROM tenant_modules
      WHERE module_id = (SELECT id FROM modules WHERE code = '${MODULE_CODE}' LIMIT 1)
    `);

    await queryRunner.query(`
      DELETE p
      FROM rbac_permissions p
      INNER JOIN modules m ON m.id = p.module_id
      WHERE m.code = '${MODULE_CODE}'
    `);

    await queryRunner.query(`
      DELETE FROM entity_registry WHERE code = '${ENTITY_CODE}'
    `);

    await queryRunner.query(`
      DELETE FROM modules WHERE code = '${MODULE_CODE}'
    `);

    await queryRunner.query(`DROP TABLE IF EXISTS system_versions`);
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
