import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillCustomerStatusActive1779920000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO customer_status (code, name)
      SELECT 'ACTIVE', 'Activo'
      WHERE NOT EXISTS (SELECT 1 FROM customer_status WHERE code = 'ACTIVE')
    `);

    await queryRunner.query(`
      INSERT INTO customer_status (code, name)
      SELECT 'INACTIVE', 'Inactivo'
      WHERE NOT EXISTS (SELECT 1 FROM customer_status WHERE code = 'INACTIVE')
    `);

    await queryRunner.query(`
      UPDATE customers c
      INNER JOIN customer_status s ON s.code = 'ACTIVE'
      SET c.status_id = s.id
      WHERE c.status_id IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No revert: no se puede distinguir cuáles eran NULL antes del backfill
  }
}
