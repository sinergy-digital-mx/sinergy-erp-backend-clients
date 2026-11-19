import { MigrationInterface, QueryRunner } from 'typeorm';

export class SetDefaultLateInterestOnContracts1793610000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE contracts
      SET interest_rate = 10,
          payment_due_day = 6
    `);
  }

  public async down(): Promise<void> {}
}
