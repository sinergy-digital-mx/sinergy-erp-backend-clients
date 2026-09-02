import { MigrationInterface, QueryRunner } from 'typeorm';

const MODULE_CODE = 'warehouse_control';
const DIVINO_TENANT_ID = '54481b63-5516-458d-9bb3-d4e5cb028864';

/** Divino es inmobiliario: no usa picking ni Mesa de Control. */
export class DisableWarehouseControlDivino1788200000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE tenant_modules tm
      JOIN modules m ON m.id = tm.module_id
      SET tm.is_enabled = 0
      WHERE tm.tenant_id = '${DIVINO_TENANT_ID}'
        AND m.code = '${MODULE_CODE}'
    `);

    await queryRunner.query(`
      DELETE rp FROM rbac_role_permissions rp
      INNER JOIN rbac_roles r ON r.id = rp.role_id
      INNER JOIN rbac_permissions p ON p.id = rp.permission_id
      INNER JOIN modules m ON m.id = p.module_id
      WHERE r.tenant_id = '${DIVINO_TENANT_ID}'
        AND m.code = '${MODULE_CODE}'
    `);

    await queryRunner.query(`
      UPDATE users
      SET permissions_version = permissions_version + 1
      WHERE tenant_id = '${DIVINO_TENANT_ID}'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE tenant_modules tm
      JOIN modules m ON m.id = tm.module_id
      SET tm.is_enabled = 1
      WHERE tm.tenant_id = '${DIVINO_TENANT_ID}'
        AND m.code = '${MODULE_CODE}'
    `);
  }
}
