import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEnCaminoSalesOrderStatus1784900000003
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`inv_s_sales_orders\`
      MODIFY COLUMN \`general_status\`
      ENUM('Creada', 'Surtida', 'Cancelada', 'En cola', 'En Camino')
      NOT NULL
      DEFAULT 'Creada'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE \`inv_s_sales_orders\`
      SET \`general_status\` = 'Surtida'
      WHERE \`general_status\` = 'En Camino'
    `);

    await queryRunner.query(`
      ALTER TABLE \`inv_s_sales_orders\`
      MODIFY COLUMN \`general_status\`
      ENUM('Creada', 'Surtida', 'Cancelada', 'En cola')
      NOT NULL
      DEFAULT 'Creada'
    `);
  }
}
