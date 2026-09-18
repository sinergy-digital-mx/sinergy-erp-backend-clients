import { MigrationInterface, QueryRunner } from 'typeorm';

/** Madereria Zona Norte: no opera lotes ni contratos inmobiliarios. */
const ORGANIZATION_ID = 'afff1757-dbcf-4715-a756-6b22bb2c59d5';
const MODULE_CODES_SQL = `'properties', 'contracts', 'contract_documents'`;

export class DisableRealEstateModulesMadereria1789800000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE tenant_modules tm
      INNER JOIN modules m ON m.id = tm.module_id
      SET tm.is_enabled = 0
      WHERE tm.tenant_id = '${ORGANIZATION_ID}'
        AND m.code IN (${MODULE_CODES_SQL})
    `);

    await queryRunner.query(`
      INSERT INTO tenant_modules (id, tenant_id, module_id, is_enabled, created_at)
      SELECT UUID(), '${ORGANIZATION_ID}', m.id, 0, NOW()
      FROM modules m
      WHERE m.code IN (${MODULE_CODES_SQL})
        AND EXISTS (SELECT 1 FROM rbac_tenants t WHERE t.id = '${ORGANIZATION_ID}')
        AND NOT EXISTS (
          SELECT 1 FROM tenant_modules tm
          WHERE tm.tenant_id = '${ORGANIZATION_ID}' AND tm.module_id = m.id
        )
    `);

    await queryRunner.query(`
      UPDATE users
      SET permissions_version = permissions_version + 1
      WHERE tenant_id = '${ORGANIZATION_ID}'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE tenant_modules tm
      INNER JOIN modules m ON m.id = tm.module_id
      SET tm.is_enabled = 1
      WHERE tm.tenant_id = '${ORGANIZATION_ID}'
        AND m.code IN (${MODULE_CODES_SQL})
    `);
  }
}
