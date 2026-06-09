import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCurrencyToHoaPayments1776210500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE contract_hoa_payments
      ADD COLUMN currency varchar(10) NOT NULL DEFAULT 'MXN' AFTER amount_pending
    `);

    await queryRunner.query(`
      UPDATE contract_hoa_payments h
      INNER JOIN contracts c ON c.id = h.contract_id
      SET h.currency = COALESCE(NULLIF(c.currency, ''), 'MXN')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE contract_hoa_payments
      DROP COLUMN currency
    `);
  }
}
