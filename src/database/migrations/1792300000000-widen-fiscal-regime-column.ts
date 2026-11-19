import { MigrationInterface, QueryRunner } from 'typeorm';

export class WidenFiscalRegimeColumn1792300000000 implements MigrationInterface {
  name = 'WidenFiscalRegimeColumn1792300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const columns = await queryRunner.query(`
      SELECT DATA_TYPE
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'fiscal_configurations'
        AND COLUMN_NAME = 'fiscal_regime'
    `);
    const dataType = String(columns[0]?.DATA_TYPE || '').toLowerCase();
    if (dataType && dataType !== 'varchar') {
      await queryRunner.query(`
        ALTER TABLE fiscal_configurations
        MODIFY COLUMN fiscal_regime VARCHAR(8) NULL
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE fiscal_configurations
      MODIFY COLUMN fiscal_regime ENUM(
        '601','603','605','606','607','608','609','610','611','614','616',
        '620','621','622','623','624','625','626','627','628','629','630'
      ) NULL
    `);
  }
}
