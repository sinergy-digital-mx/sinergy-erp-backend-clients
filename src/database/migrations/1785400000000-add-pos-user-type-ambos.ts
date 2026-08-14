import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPosUserTypeAmbos1785400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      MODIFY COLUMN pos_user_type ENUM('VENTAS', 'COBRANZA', 'AMBOS') NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE users SET pos_user_type = 'COBRANZA' WHERE pos_user_type = 'AMBOS'
    `);

    await queryRunner.query(`
      ALTER TABLE users
      MODIFY COLUMN pos_user_type ENUM('VENTAS', 'COBRANZA') NULL
    `);
  }
}
