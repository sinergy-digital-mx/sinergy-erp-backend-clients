import { MigrationInterface, QueryRunner } from 'typeorm';

const MODULE_CODE = 'warehouse_control';
const TENANT_ID = 'afff1757-dbcf-4715-a756-6b22bb2c59d5';

export class EnableWarehouseControlMaderia1787900000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
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
      UPDATE tenant_modules tm
      JOIN modules m ON m.id = tm.module_id
      SET tm.is_enabled = 1
      WHERE tm.tenant_id = '${TENANT_ID}'
        AND m.code = '${MODULE_CODE}'
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
      INNER JOIN rbac_roles r ON r.id = rp.role_id
      INNER JOIN rbac_permissions p ON p.id = rp.permission_id
      INNER JOIN modules m ON m.id = p.module_id
      WHERE r.tenant_id = '${TENANT_ID}'
        AND m.code = '${MODULE_CODE}'
    `);

    await queryRunner.query(`
      DELETE tm FROM tenant_modules tm
      INNER JOIN modules m ON m.id = tm.module_id
      WHERE tm.tenant_id = '${TENANT_ID}'
        AND m.code = '${MODULE_CODE}'
    `);
  }
}
