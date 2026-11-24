import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Tipo de venta del contrato.
 * Contado: no tiene filas en contract_payments (los abonos de enganche no cuentan).
 * Esos registros quedan sin meses ni mensualidad fija.
 */
export class AddContractSaleType1796100000000 implements MigrationInterface {
  name = 'AddContractSaleType1796100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('contracts');
    if (table && !table.findColumnByName('sale_type')) {
      await queryRunner.query(`
        ALTER TABLE contracts
        ADD COLUMN sale_type ENUM('cash', 'financed') NOT NULL DEFAULT 'financed'
        AFTER status
      `);
    }

    await queryRunner.query(`
      UPDATE contracts c
      LEFT JOIN (
        SELECT contract_id, COUNT(*) AS payment_count
        FROM contract_payments
        GROUP BY contract_id
      ) payments ON payments.contract_id = c.id
      SET
        c.sale_type = 'cash',
        c.payment_months = 0,
        c.monthly_payment = 0,
        c.interest_rate = NULL,
        c.payment_due_day = NULL
      WHERE COALESCE(payments.payment_count, 0) = 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('contracts');
    if (table?.findColumnByName('sale_type')) {
      await queryRunner.query(`ALTER TABLE contracts DROP COLUMN sale_type`);
    }
  }
}
