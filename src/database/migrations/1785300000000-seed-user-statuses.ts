import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedUserStatuses1785300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE user_status
      SET name = 'Activo'
      WHERE code = 'active' AND name = 'Active'
    `);

    await queryRunner.query(`
      INSERT INTO user_status (code, name)
      SELECT 'inactive', 'Inactivo'
      WHERE NOT EXISTS (SELECT 1 FROM user_status WHERE code = 'inactive')
    `);

    await queryRunner.query(`
      INSERT INTO user_status (code, name)
      SELECT 'deleted', 'Eliminado'
      WHERE NOT EXISTS (SELECT 1 FROM user_status WHERE code = 'deleted')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE users u
      INNER JOIN user_status s ON s.id = u.status_id
      INNER JOIN user_status active ON active.code = 'active'
      SET u.status_id = active.id
      WHERE s.code IN ('inactive', 'deleted')
    `);

    await queryRunner.query(`
      DELETE FROM user_status WHERE code IN ('inactive', 'deleted')
    `);

    await queryRunner.query(`
      UPDATE user_status SET name = 'Active' WHERE code = 'active'
    `);
  }
}
