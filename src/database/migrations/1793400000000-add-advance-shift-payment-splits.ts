import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/** Desglose de mixto en anticipos: el corte necesita efectivo, tarjeta, transferencia y cheque por separado. */
export class AddAdvanceShiftPaymentSplits1793400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('advance_shift_payments');
    if (!table) {
      return;
    }

    await this.addAmountColumn(queryRunner, table.findColumnByName('amount_cash_mxn') ? null : 'amount_cash_mxn');
    await this.addAmountColumn(
      queryRunner,
      table.findColumnByName('amount_transfer_mxn') ? null : 'amount_transfer_mxn',
    );
    await this.addAmountColumn(queryRunner, table.findColumnByName('amount_card_mxn') ? null : 'amount_card_mxn');
    await this.addAmountColumn(queryRunner, table.findColumnByName('amount_check_mxn') ? null : 'amount_check_mxn');

    await queryRunner.query(`
      UPDATE advance_shift_payments
      SET amount_cash_mxn = amount_mxn
      WHERE payment_method = 'cash' AND amount_cash_mxn = 0
    `);
    await queryRunner.query(`
      UPDATE advance_shift_payments
      SET amount_transfer_mxn = amount_mxn
      WHERE payment_method = 'transfer' AND amount_transfer_mxn = 0
    `);
    await queryRunner.query(`
      UPDATE advance_shift_payments
      SET amount_card_mxn = amount_mxn
      WHERE payment_method = 'card' AND amount_card_mxn = 0
    `);
    await queryRunner.query(`
      UPDATE advance_shift_payments
      SET amount_check_mxn = amount_mxn
      WHERE payment_method = 'check' AND amount_check_mxn = 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('advance_shift_payments');
    if (!table) {
      return;
    }
    for (const name of [
      'amount_check_mxn',
      'amount_card_mxn',
      'amount_transfer_mxn',
      'amount_cash_mxn',
    ]) {
      if (table.findColumnByName(name)) {
        await queryRunner.dropColumn('advance_shift_payments', name);
      }
    }
  }

  private async addAmountColumn(queryRunner: QueryRunner, name: string | null): Promise<void> {
    if (!name) {
      return;
    }
    await queryRunner.addColumn(
      'advance_shift_payments',
      new TableColumn({
        name,
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: '0.00',
        isNullable: false,
      }),
    );
  }
}
