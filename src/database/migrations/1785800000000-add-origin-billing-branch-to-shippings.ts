import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOriginBillingBranchToShippings1785800000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE shippings
        ADD COLUMN origin_billing_branch_id VARCHAR(36) NULL
        AFTER origin_warehouse_id
    `);

    await queryRunner.query(`
      UPDATE shippings s
      INNER JOIN warehouses w ON w.id = s.origin_warehouse_id
      SET s.origin_billing_branch_id = w.billing_branch_id
      WHERE w.billing_branch_id IS NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE shippings
        MODIFY COLUMN origin_warehouse_id VARCHAR(36) NULL
    `);

    await queryRunner.query(`
      ALTER TABLE shippings
        ADD CONSTRAINT FK_shippings_origin_branch
        FOREIGN KEY (origin_billing_branch_id)
        REFERENCES billing_branches(id)
        ON DELETE RESTRICT
    `);

    await queryRunner.query(`
      CREATE INDEX idx_shippings_origin_branch
        ON shippings (origin_billing_branch_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE shippings DROP FOREIGN KEY FK_shippings_origin_branch
    `);
    await queryRunner.query(`
      DROP INDEX idx_shippings_origin_branch ON shippings
    `);
    await queryRunner.query(`
      ALTER TABLE shippings DROP COLUMN origin_billing_branch_id
    `);
    await queryRunner.query(`
      ALTER TABLE shippings
        MODIFY COLUMN origin_warehouse_id VARCHAR(36) NOT NULL
    `);
  }
}
