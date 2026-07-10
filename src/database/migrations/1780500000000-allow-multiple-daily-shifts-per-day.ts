import { MigrationInterface, QueryRunner } from 'typeorm';

export class AllowMultipleDailyShiftsPerDay1780500000000
  implements MigrationInterface
{
  private async hasIndex(
    queryRunner: QueryRunner,
    tableName: string,
    indexName: string,
  ): Promise<boolean> {
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

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (
      !(await this.hasIndex(
        queryRunner,
        'pos_daily_shifts',
        'idx_pos_daily_shift_branch_date',
      ))
    ) {
      await queryRunner.query(`
        CREATE INDEX \`idx_pos_daily_shift_branch_date\`
        ON \`pos_daily_shifts\` (\`billing_branch_id\`, \`shift_date\`)
      `);
    }

    if (
      await this.hasIndex(
        queryRunner,
        'pos_daily_shifts',
        'uq_pos_daily_shift_branch_day',
      )
    ) {
      await queryRunner.query(
        'ALTER TABLE `pos_daily_shifts` DROP INDEX `uq_pos_daily_shift_branch_day`',
      );
    }

    if (
      !(await this.hasIndex(
        queryRunner,
        'pos_daily_shifts',
        'uq_pos_daily_shift_branch_open',
      ))
    ) {
      await queryRunner.query(`
        CREATE UNIQUE INDEX \`uq_pos_daily_shift_branch_open\`
        ON \`pos_daily_shifts\` (
          \`billing_branch_id\`,
          (CASE WHEN \`status\` = 'open' THEN 1 ELSE NULL END)
        )
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (
      await this.hasIndex(
        queryRunner,
        'pos_daily_shifts',
        'uq_pos_daily_shift_branch_open',
      )
    ) {
      await queryRunner.query(
        'ALTER TABLE `pos_daily_shifts` DROP INDEX `uq_pos_daily_shift_branch_open`',
      );
    }

    if (
      await this.hasIndex(
        queryRunner,
        'pos_daily_shifts',
        'idx_pos_daily_shift_branch_date',
      )
    ) {
      await queryRunner.query(
        'ALTER TABLE `pos_daily_shifts` DROP INDEX `idx_pos_daily_shift_branch_date`',
      );
    }

    if (
      !(await this.hasIndex(
        queryRunner,
        'pos_daily_shifts',
        'uq_pos_daily_shift_branch_day',
      ))
    ) {
      await queryRunner.query(`
        CREATE UNIQUE INDEX \`uq_pos_daily_shift_branch_day\`
        ON \`pos_daily_shifts\` (\`billing_branch_id\`, \`shift_date\`)
      `);
    }
  }
}
