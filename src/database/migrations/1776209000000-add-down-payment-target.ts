import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDownPaymentTarget1776209000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE contracts
      ADD COLUMN down_payment_target decimal(15,2) NULL AFTER down_payment
    `);

    await queryRunner.query(`
      UPDATE contracts
      SET down_payment_target = down_payment
      WHERE down_payment_financed = 1
        AND down_payment_target IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE contracts
      DROP COLUMN down_payment_target
    `);
  }
}
