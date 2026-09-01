import { MigrationInterface, QueryRunner } from 'typeorm';

/** Organización Divino: contratos y lotes se capturaron en USD y quedaron etiquetados MXN. */
const DIVINO_ORGANIZATION_ID = '54481b63-5516-458d-9bb3-d4e5cb028864';

export class SetDivinoContractCurrencyUsd1787700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE contracts
      MODIFY COLUMN currency varchar(10) NOT NULL DEFAULT 'USD'
    `);

    if (await queryRunner.hasTable('contract_hoa_payments')) {
      await queryRunner.query(`
        ALTER TABLE contract_hoa_payments
        MODIFY COLUMN currency varchar(10) NOT NULL DEFAULT 'USD'
      `);
    }

    await queryRunner.query(
      `
      UPDATE contracts
      SET currency = 'USD'
      WHERE tenant_id = ?
        AND UPPER(TRIM(COALESCE(currency, ''))) <> 'USD'
      `,
      [DIVINO_ORGANIZATION_ID],
    );

    if (await queryRunner.hasTable('contract_hoa_payments')) {
      await queryRunner.query(
        `
        UPDATE contract_hoa_payments
        SET currency = 'USD'
        WHERE tenant_id = ?
          AND UPPER(TRIM(COALESCE(currency, ''))) <> 'USD'
        `,
        [DIVINO_ORGANIZATION_ID],
      );
    }

    if (await queryRunner.hasTable('properties')) {
      await queryRunner.query(
        `
        UPDATE properties
        SET currency = 'USD'
        WHERE tenant_id = ?
          AND UPPER(TRIM(COALESCE(currency, ''))) <> 'USD'
        `,
        [DIVINO_ORGANIZATION_ID],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE contracts
      MODIFY COLUMN currency varchar(10) NOT NULL DEFAULT 'MXN'
    `);

    if (await queryRunner.hasTable('contract_hoa_payments')) {
      await queryRunner.query(`
        ALTER TABLE contract_hoa_payments
        MODIFY COLUMN currency varchar(10) NOT NULL DEFAULT 'MXN'
      `);
    }
  }
}
