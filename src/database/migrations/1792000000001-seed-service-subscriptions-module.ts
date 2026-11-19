import { MigrationInterface, QueryRunner } from 'typeorm';

const MODULE_CODE = 'service_subscriptions';
const ENTITY_CODE = 'service_subscriptions';
const TENANT_ID = '2ea15d17-85da-4b7e-a94c-1243c5c24363';

export class SeedServiceSubscriptionsModule1792000000001 implements MigrationInterface {
  name = 'SeedServiceSubscriptionsModule1792000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO modules (id, name, code, description, category, sort_order, created_at)
      SELECT UUID(), 'Suscripciones de servicio', '${MODULE_CODE}',
        'Cobro mensual de un servicio: orden de venta y factura por mes',
        'sales', 9, NOW()
      WHERE NOT EXISTS (SELECT 1 FROM modules WHERE code = '${MODULE_CODE}')
    `);

    await queryRunner.query(`
      INSERT INTO entity_registry (code, name)
      SELECT '${ENTITY_CODE}', 'Suscripciones de servicio'
      WHERE NOT EXISTS (SELECT 1 FROM entity_registry WHERE code = '${ENTITY_CODE}')
    `);

    await queryRunner.query(`
      INSERT INTO rbac_permissions (id, entity_registry_id, module_id, action, description, is_system_permission, created_at, updated_at)
      SELECT UUID(), er.id, m.id, a.action, a.description, 1, NOW(), NOW()
      FROM entity_registry er
      JOIN modules m ON m.code = '${MODULE_CODE}'
      JOIN (
        SELECT 'ViewMenu' AS action, 'Ver Suscripciones en el menú' AS description
        UNION ALL SELECT 'Read', 'Consultar suscripciones de servicio'
        UNION ALL SELECT 'Create', 'Crear y renovar suscripciones de servicio'
        UNION ALL SELECT 'Update', 'Editar, vincular y generar el mes de una suscripción'
      ) a
      WHERE er.code = '${ENTITY_CODE}'
        AND NOT EXISTS (
          SELECT 1 FROM rbac_permissions p
          WHERE p.module_id = m.id AND p.action = a.action
        )
    `);

    await queryRunner.query(`
      INSERT INTO tenant_modules (id, tenant_id, module_id, is_enabled, created_at)
      SELECT UUID(), '${TENANT_ID}', m.id, 1, NOW()
      FROM modules m
      WHERE m.code = '${MODULE_CODE}'
        AND EXISTS (SELECT 1 FROM rbac_tenants t WHERE t.id = '${TENANT_ID}')
        AND NOT EXISTS (
          SELECT 1 FROM tenant_modules tm
          WHERE tm.tenant_id = '${TENANT_ID}' AND tm.module_id = m.id
        )
    `);

    await queryRunner.query(`
      INSERT INTO rbac_role_permissions (id, role_id, permission_id, created_at)
      SELECT UUID(), r.id, p.id, NOW()
      FROM rbac_roles r
      JOIN rbac_permissions p ON p.module_id = (
        SELECT id FROM modules WHERE code = '${MODULE_CODE}' LIMIT 1
      )
      WHERE r.tenant_id = '${TENANT_ID}'
        AND (r.name = 'Admin' OR r.is_admin = 1)
        AND NOT EXISTS (
          SELECT 1 FROM rbac_role_permissions rp
          WHERE rp.role_id = r.id AND rp.permission_id = p.id
        )
    `);

    await queryRunner.query(`
      UPDATE users
      SET permissions_version = permissions_version + 1
      WHERE tenant_id = '${TENANT_ID}'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE rp FROM rbac_role_permissions rp
      JOIN rbac_permissions p ON p.id = rp.permission_id
      JOIN modules m ON m.id = p.module_id
      WHERE m.code = '${MODULE_CODE}'
    `);
    await queryRunner.query(`
      DELETE FROM tenant_modules
      WHERE module_id IN (SELECT id FROM modules WHERE code = '${MODULE_CODE}')
    `);
    await queryRunner.query(`
      DELETE FROM rbac_permissions
      WHERE module_id IN (SELECT id FROM modules WHERE code = '${MODULE_CODE}')
    `);
    await queryRunner.query(`DELETE FROM modules WHERE code = '${MODULE_CODE}'`);
    await queryRunner.query(`DELETE FROM entity_registry WHERE code = '${ENTITY_CODE}'`);
  }
}
