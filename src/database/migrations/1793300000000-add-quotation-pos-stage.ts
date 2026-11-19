import { MigrationInterface, QueryRunner } from 'typeorm';

/** Mismo escenario caja/ventas de las OV, para devolver un anticipo de cotización. */
export class AddQuotationPosStage1793300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('inv_s_quotations');
    if (table && !table.findColumnByName('pos_stage')) {
      await queryRunner.query(`
        ALTER TABLE inv_s_quotations
        ADD COLUMN pos_stage ENUM('caja', 'ventas') NULL
        COMMENT 'POS: caja = anticipo por cobrar; ventas = regresado para corregir'
        AFTER advance_metodo_pago
      `);
    }

    await queryRunner.query(`
      UPDATE inv_s_quotations
      SET pos_stage = 'caja'
      WHERE quotation_type = 'POS'
        AND advance_requested_total > 0
        AND general_status = 'Creada'
        AND pos_stage IS NULL
    `);

    const indexName = 'idx_qt_pos_stage';
    const hasIndex = table?.indices.some((index) => index.name === indexName);
    if (!hasIndex) {
      await queryRunner.query(`
        CREATE INDEX idx_qt_pos_stage
        ON inv_s_quotations (tenant_id, quotation_type, pos_stage)
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('inv_s_quotations');
    if (table?.indices.some((index) => index.name === 'idx_qt_pos_stage')) {
      await queryRunner.query('DROP INDEX idx_qt_pos_stage ON inv_s_quotations');
    }
    if (table?.findColumnByName('pos_stage')) {
      await queryRunner.query('ALTER TABLE inv_s_quotations DROP COLUMN pos_stage');
    }
  }
}
