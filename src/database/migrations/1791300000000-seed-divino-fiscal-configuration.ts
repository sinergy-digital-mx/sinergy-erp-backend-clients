import { MigrationInterface, QueryRunner } from 'typeorm';

const DIVINO_ORGANIZATION_ID = '54481b63-5516-458d-9bb3-d4e5cb028864';
const FISCAL_CONFIGURATION_ID = '8f6e4c2a-1b70-4d9e-a3c5-0e7b91d4f6a2';
const RAZON_SOCIAL = 'Valdetierra SA de CV';

/** Razón social que ya usaban los formatos de reservación, ahora como registro. */
export class SeedDivinoFiscalConfiguration1791300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
      INSERT INTO fiscal_configurations (
        id, tenant_id, razon_social, rfc, prefix, persona_type, fiscal_regime, status, created_at, updated_at
      )
      SELECT ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), NOW()
      FROM DUAL
      WHERE EXISTS (SELECT 1 FROM rbac_tenants t WHERE t.id = ?)
        AND NOT EXISTS (
          SELECT 1 FROM fiscal_configurations fc
          WHERE fc.tenant_id = ? AND fc.razon_social = ?
        )
      `,
      [
        FISCAL_CONFIGURATION_ID,
        DIVINO_ORGANIZATION_ID,
        RAZON_SOCIAL,
        'VAL010101AAA',
        'DIV',
        'Persona Moral',
        '601',
        DIVINO_ORGANIZATION_ID,
        DIVINO_ORGANIZATION_ID,
        RAZON_SOCIAL,
      ],
    );

    await queryRunner.query(
      `
      UPDATE divino_reservation_formats f
      INNER JOIN fiscal_configurations fc
        ON fc.tenant_id = f.tenant_id AND fc.razon_social = ?
      SET f.fiscal_configuration_id = fc.id,
          f.payable_to = CASE
            WHEN f.payable_to IS NULL OR TRIM(f.payable_to) = '' OR f.payable_to = ?
              THEN fc.razon_social
            ELSE f.payable_to
          END
      WHERE f.tenant_id = ?
        AND f.fiscal_configuration_id IS NULL
      `,
      [RAZON_SOCIAL, RAZON_SOCIAL, DIVINO_ORGANIZATION_ID],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
      UPDATE divino_reservation_formats
      SET fiscal_configuration_id = NULL
      WHERE tenant_id = ? AND fiscal_configuration_id = ?
      `,
      [DIVINO_ORGANIZATION_ID, FISCAL_CONFIGURATION_ID],
    );

    await queryRunner.query(
      `DELETE FROM fiscal_configurations WHERE id = ? AND tenant_id = ?`,
      [FISCAL_CONFIGURATION_ID, DIVINO_ORGANIZATION_ID],
    );
  }
}
