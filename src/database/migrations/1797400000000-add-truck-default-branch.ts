import { MigrationInterface, QueryRunner } from 'typeorm';

/** Sucursal por defecto del camión. No bloquea usarlo en otra sucursal. */
export class AddTruckDefaultBranch1797400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const columns: Array<{ Field: string }> = await queryRunner.query(
      `SHOW COLUMNS FROM trucks LIKE 'default_billing_branch_id'`,
    );
    if (columns.length) return;

    await queryRunner.query(`
      ALTER TABLE trucks
        ADD COLUMN default_billing_branch_id VARCHAR(36) NULL AFTER status,
        ADD INDEX idx_trucks_default_branch (default_billing_branch_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const columns: Array<{ Field: string }> = await queryRunner.query(
      `SHOW COLUMNS FROM trucks LIKE 'default_billing_branch_id'`,
    );
    if (!columns.length) return;
    await queryRunner.query(`
      ALTER TABLE trucks
        DROP INDEX idx_trucks_default_branch,
        DROP COLUMN default_billing_branch_id
    `);
  }
}
