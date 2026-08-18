import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReleaseDeletedUserEmails1785500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      MODIFY COLUMN email VARCHAR(255) NULL
    `);

    await queryRunner.query(`
      UPDATE users u
      INNER JOIN user_status s ON s.id = u.status_id
      SET u.email = NULL
      WHERE LOWER(s.code) = 'deleted'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE users
      SET email = CONCAT('deleted.', id, '@invalid.local')
      WHERE email IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE users
      MODIFY COLUMN email VARCHAR(255) NOT NULL
    `);
  }
}
