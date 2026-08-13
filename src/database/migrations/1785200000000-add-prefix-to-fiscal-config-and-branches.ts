import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPrefixToFiscalConfigAndBranches1785200000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const fiscalHasPrefix = await queryRunner.query(`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'fiscal_configurations'
        AND COLUMN_NAME = 'prefix'
    `);

    if (!fiscalHasPrefix.length) {
      await queryRunner.query(`
        ALTER TABLE fiscal_configurations
        ADD COLUMN prefix VARCHAR(10) NULL AFTER rfc
      `);
    }

    const branchHasPrefix = await queryRunner.query(`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'billing_branches'
        AND COLUMN_NAME = 'prefix'
    `);

    if (!branchHasPrefix.length) {
      await queryRunner.query(`
        ALTER TABLE billing_branches
        ADD COLUMN prefix VARCHAR(10) NULL AFTER code
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const fiscalHasPrefix = await queryRunner.query(`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'fiscal_configurations'
        AND COLUMN_NAME = 'prefix'
    `);
    if (fiscalHasPrefix.length) {
      await queryRunner.query(`
        ALTER TABLE fiscal_configurations DROP COLUMN prefix
      `);
    }

    const branchHasPrefix = await queryRunner.query(`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'billing_branches'
        AND COLUMN_NAME = 'prefix'
    `);
    if (branchHasPrefix.length) {
      await queryRunner.query(`
        ALTER TABLE billing_branches DROP COLUMN prefix
      `);
    }
  }
}
