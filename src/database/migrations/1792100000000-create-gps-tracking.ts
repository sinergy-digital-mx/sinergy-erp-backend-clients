import { MigrationInterface, QueryRunner } from 'typeorm';

const MODULE_CODE = 'gps_tracking';
const ENTITY_CODE = 'gps_tracking';
const MADERERIA_ORGANIZATION_ID = 'afff1757-dbcf-4715-a756-6b22bb2c59d5';

/**
 * Rastreo GPS (3D Tracking). Módulo único, habilitado solo en Verdulería y Maderería.
 */
export class CreateGpsTracking1792100000000 implements MigrationInterface {
  name = 'CreateGpsTracking1792100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS gps_tracking_configurations (
        id varchar(36) NOT NULL,
        tenant_id varchar(36) NOT NULL,
        name varchar(255) NOT NULL,
        username varchar(255) NOT NULL,
        encrypted_password text NOT NULL,
        password_iv varchar(64) NOT NULL,
        is_active tinyint NOT NULL DEFAULT 0,
        is_valid tinyint NOT NULL DEFAULT 0,
        last_test_result json NULL,
        last_test_at timestamp NULL,
        created_by varchar(36) NOT NULL,
        updated_by varchar(36) NOT NULL,
        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_gps_tracking_configurations_tenant (tenant_id),
        KEY idx_gps_tracking_configurations_tenant_active (tenant_id, is_active),
        CONSTRAINT fk_gps_tracking_configurations_tenant
          FOREIGN KEY (tenant_id) REFERENCES rbac_tenants(id) ON DELETE CASCADE
      )
    `);

    const truckColumns: Array<{ name: string }> = await queryRunner.query(`
      SHOW COLUMNS FROM trucks LIKE 'gps_unit_uid'
    `);
    if (!truckColumns.length) {
      await queryRunner.query(`
        ALTER TABLE trucks
          ADD COLUMN gps_unit_uid varchar(80) NULL,
          ADD COLUMN gps_unit_name varchar(120) NULL
      `);
    }

    const indexes: Array<{ Key_name: string }> = await queryRunner.query(`
      SHOW INDEX FROM trucks WHERE Key_name = 'uq_trucks_tenant_gps_unit'
    `);
    if (!indexes.length) {
      await queryRunner.query(`
        CREATE UNIQUE INDEX uq_trucks_tenant_gps_unit ON trucks (tenant_id, gps_unit_uid)
      `);
    }

    await queryRunner.query(`
      INSERT INTO modules (id, name, code, description, category, sort_order, created_at)
      SELECT UUID(), 'Rastreo GPS', '${MODULE_CODE}',
        'Posición en vivo de la flota con 3D Tracking',
        'logistics', 30, NOW()
      WHERE NOT EXISTS (SELECT 1 FROM modules WHERE code = '${MODULE_CODE}')
    `);

    await queryRunner.query(`
      INSERT INTO entity_registry (code, name)
      SELECT '${ENTITY_CODE}', 'Rastreo GPS'
      WHERE NOT EXISTS (SELECT 1 FROM entity_registry WHERE code = '${ENTITY_CODE}')
    `);

    await queryRunner.query(`
      INSERT INTO rbac_permissions (id, entity_registry_id, module_id, action, description, is_system_permission, created_at, updated_at)
      SELECT UUID(), er.id, m.id, a.action, a.description, 1, NOW(), NOW()
      FROM entity_registry er
      JOIN modules m ON m.code = '${MODULE_CODE}'
      JOIN (
        SELECT 'ViewMenu' AS action, 'Ver Rastreo GPS en el menú' AS description
        UNION ALL SELECT 'Read', 'Consultar posiciones y unidades GPS'
        UNION ALL SELECT 'Create', 'Crear la configuración de rastreo GPS'
        UNION ALL SELECT 'Update', 'Editar, activar y probar la configuración de rastreo GPS'
        UNION ALL SELECT 'Delete', 'Eliminar la configuración de rastreo GPS'
      ) a
      WHERE er.code = '${ENTITY_CODE}'
        AND NOT EXISTS (
          SELECT 1 FROM rbac_permissions p
          WHERE p.module_id = m.id AND p.action = a.action
        )
    `);

    await queryRunner.query(`
      INSERT INTO tenant_modules (id, tenant_id, module_id, is_enabled, created_at)
      SELECT UUID(), t.id, m.id, 1, NOW()
      FROM rbac_tenants t
      JOIN modules m ON m.code = '${MODULE_CODE}'
      WHERE (
        t.id = '${MADERERIA_ORGANIZATION_ID}'
        OR LOWER(t.subdomain) IN ('verduleria', 'madereria')
        OR LOWER(t.name) LIKE '%verduleria%'
        OR LOWER(t.name) LIKE '%madereria%'
      )
        AND NOT EXISTS (
          SELECT 1 FROM tenant_modules tm
          WHERE tm.tenant_id = t.id AND tm.module_id = m.id
        )
    `);

    await queryRunner.query(`
      INSERT INTO rbac_role_permissions (id, role_id, permission_id, created_at)
      SELECT UUID(), r.id, p.id, NOW()
      FROM rbac_roles r
      JOIN rbac_tenants t ON t.id = r.tenant_id
      JOIN rbac_permissions p ON p.module_id = (
        SELECT id FROM modules WHERE code = '${MODULE_CODE}' LIMIT 1
      )
      WHERE (r.name = 'Admin' OR r.is_admin = 1)
        AND (
          t.id = '${MADERERIA_ORGANIZATION_ID}'
          OR LOWER(t.subdomain) IN ('verduleria', 'madereria')
          OR LOWER(t.name) LIKE '%verduleria%'
          OR LOWER(t.name) LIKE '%madereria%'
        )
        AND NOT EXISTS (
          SELECT 1 FROM rbac_role_permissions rp
          WHERE rp.role_id = r.id AND rp.permission_id = p.id
        )
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
      WHERE module_id IN (SELECT id FROM modules WHERE code = '${MODULE_CODE}')
    `);
    await queryRunner.query(`
      DELETE p
      FROM rbac_permissions p
      INNER JOIN modules m ON m.id = p.module_id
      WHERE m.code = '${MODULE_CODE}'
    `);
    await queryRunner.query(`DELETE FROM modules WHERE code = '${MODULE_CODE}'`);
    await queryRunner.query(`DELETE FROM entity_registry WHERE code = '${ENTITY_CODE}'`);
    await queryRunner.query(`DROP TABLE IF EXISTS gps_tracking_configurations`);
    await queryRunner.query(`DROP INDEX uq_trucks_tenant_gps_unit ON trucks`);
    await queryRunner.query(`
      ALTER TABLE trucks
        DROP COLUMN gps_unit_uid,
        DROP COLUMN gps_unit_name
    `);
  }
}
