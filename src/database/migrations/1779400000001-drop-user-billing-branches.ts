import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropUserBillingBranches1779400000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('user_billing_branches');
    if (!table) {
      return;
    }

    // Migrar la primera sucursal asignada a users.billing_branch_id si aún no tiene
    await queryRunner.query(`
      UPDATE users u
      INNER JOIN (
        SELECT user_id, MIN(billing_branch_id) AS billing_branch_id
        FROM user_billing_branches
        GROUP BY user_id
      ) ub ON ub.user_id = u.id
      SET u.billing_branch_id = ub.billing_branch_id
      WHERE u.billing_branch_id IS NULL
    `);

    await queryRunner.dropTable('user_billing_branches');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No se restaura la tabla intermedia; el rollback manual requeriría recrearla.
  }
}
