import { MigrationInterface, QueryRunner } from 'typeorm';

export class FinkokDualEnvAndRegistration1780300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const stampingCol = await queryRunner.query(`
      SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'finkok_provider_configurations'
        AND COLUMN_NAME = 'is_stamping_default'
    `);
    if (Number(stampingCol[0]?.cnt ?? 0) === 0) {
      await queryRunner.query(`
        ALTER TABLE finkok_provider_configurations
          ADD COLUMN is_stamping_default TINYINT NOT NULL DEFAULT 0 AFTER is_active
      `);
    }

    await queryRunner.query(`
      UPDATE finkok_provider_configurations
      SET is_stamping_default = 1
      WHERE is_stamping_default = 0
    `);

    const compositeIdx = await queryRunner.query(`
      SELECT COUNT(*) AS cnt FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'finkok_provider_configurations'
        AND INDEX_NAME = 'uq_finkok_provider_tenant_env'
    `);
    if (Number(compositeIdx[0]?.cnt ?? 0) === 0) {
      await queryRunner.query(`
        ALTER TABLE finkok_provider_configurations
          ADD UNIQUE INDEX uq_finkok_provider_tenant_env (tenant_id, environment)
      `);
    }

    const oldIdx = await queryRunner.query(`
      SELECT COUNT(*) AS cnt FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'finkok_provider_configurations'
        AND INDEX_NAME = 'uq_finkok_provider_tenant'
    `);
    if (Number(oldIdx[0]?.cnt ?? 0) > 0) {
      await queryRunner.query(`
        ALTER TABLE finkok_provider_configurations
          DROP INDEX uq_finkok_provider_tenant
      `);
    }

    const remoteStatusCol = await queryRunner.query(`
      SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'fiscal_configurations'
        AND COLUMN_NAME = 'finkok_remote_status'
    `);
    if (Number(remoteStatusCol[0]?.cnt ?? 0) === 0) {
      await queryRunner.query(`
        ALTER TABLE fiscal_configurations
          ADD COLUMN finkok_remote_status VARCHAR(10) NULL AFTER finkok_registration_error,
          ADD COLUMN finkok_stamps_counter INT NULL AFTER finkok_remote_status,
          ADD COLUMN finkok_stamps_credit INT NULL AFTER finkok_stamps_counter,
          ADD COLUMN last_finkok_sync_at TIMESTAMP NULL AFTER finkok_stamps_credit
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE fiscal_configurations
        DROP COLUMN last_finkok_sync_at,
        DROP COLUMN finkok_stamps_credit,
        DROP COLUMN finkok_stamps_counter,
        DROP COLUMN finkok_remote_status
    `);

    await queryRunner.query(`
      ALTER TABLE finkok_provider_configurations
        ADD UNIQUE INDEX uq_finkok_provider_tenant (tenant_id)
    `);

    await queryRunner.query(`
      ALTER TABLE finkok_provider_configurations
        DROP INDEX uq_finkok_provider_tenant_env
    `);

    await queryRunner.query(`
      ALTER TABLE finkok_provider_configurations
        DROP COLUMN is_stamping_default
    `);
  }
}
