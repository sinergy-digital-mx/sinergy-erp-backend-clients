import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixPosSessionsOpenUniqueConstraint1776206000000 implements MigrationInterface {
  private async hasIndex(queryRunner: QueryRunner, tableName: string, indexName: string): Promise<boolean> {
    const result = await queryRunner.query(
      `
      SELECT 1
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND INDEX_NAME = ?
      LIMIT 1
      `,
      [tableName, indexName],
    );
    return result.length > 0;
  }

  private async hasColumn(queryRunner: QueryRunner, tableName: string, columnName: string): Promise<boolean> {
    const result = await queryRunner.query(
      `
      SELECT 1
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
      LIMIT 1
      `,
      [tableName, columnName],
    );
    return result.length > 0;
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await this.hasIndex(queryRunner, 'pos_sessions', 'UQ_pos_sessions_open_per_config')) {
      await queryRunner.query(
        'ALTER TABLE `pos_sessions` DROP INDEX `UQ_pos_sessions_open_per_config`',
      );
    }

    // Cleanup from a partially applied previous attempt.
    if (await this.hasColumn(queryRunner, 'pos_sessions', 'open_session_guard')) {
      await queryRunner.query('ALTER TABLE `pos_sessions` DROP COLUMN `open_session_guard`');
    }

    if (!(await this.hasIndex(queryRunner, 'pos_sessions', 'UQ_pos_sessions_single_open_guard'))) {
      await queryRunner.query(`
        CREATE UNIQUE INDEX \`UQ_pos_sessions_single_open_guard\`
        ON \`pos_sessions\` (
          \`pos_configuration_id\`,
          (CASE WHEN \`status\` = 'open' THEN 1 ELSE NULL END)
        )
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await this.hasIndex(queryRunner, 'pos_sessions', 'UQ_pos_sessions_single_open_guard')) {
      await queryRunner.query(
        'ALTER TABLE `pos_sessions` DROP INDEX `UQ_pos_sessions_single_open_guard`',
      );
    }

    if (!(await this.hasIndex(queryRunner, 'pos_sessions', 'UQ_pos_sessions_open_per_config'))) {
      await queryRunner.query(`
        CREATE UNIQUE INDEX \`UQ_pos_sessions_open_per_config\`
        ON \`pos_sessions\` (\`pos_configuration_id\`, \`status\`)
      `);
    }
  }
}
