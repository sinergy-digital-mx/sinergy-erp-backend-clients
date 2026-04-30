import { MigrationInterface, QueryRunner } from 'typeorm';

export class AllowExchangeRateHistoryPerDay1776201300000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX UQ_exchange_rates_tenant_date ON exchange_rates;
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_exchange_rates_tenant_date ON exchange_rates (tenant_id, rate_date);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IDX_exchange_rates_tenant_date ON exchange_rates;
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX UQ_exchange_rates_tenant_date ON exchange_rates (tenant_id, rate_date);
    `);
  }
}
