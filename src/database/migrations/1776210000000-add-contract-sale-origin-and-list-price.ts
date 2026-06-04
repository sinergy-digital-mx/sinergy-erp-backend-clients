import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContractSaleOriginAndListPrice1776210000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE properties
      ADD COLUMN list_price decimal(15,2) NULL AFTER total_price
    `);

    await queryRunner.query(`
      UPDATE properties SET list_price = total_price WHERE list_price IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE contracts
      ADD COLUMN list_price decimal(15,2) NULL AFTER total_price,
      ADD COLUMN lead_id int NULL AFTER seller_id,
      ADD COLUMN lead_group_id varchar(36) NULL AFTER lead_id
    `);

    await queryRunner.query(`
      UPDATE contracts c
      INNER JOIN properties p ON p.id = c.property_id
      SET c.list_price = COALESCE(p.list_price, p.total_price)
      WHERE c.list_price IS NULL
    `);

  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE contracts
      DROP COLUMN lead_group_id,
      DROP COLUMN lead_id,
      DROP COLUMN list_price
    `);

    await queryRunner.query(`
      ALTER TABLE properties DROP COLUMN list_price
    `);
  }
}
