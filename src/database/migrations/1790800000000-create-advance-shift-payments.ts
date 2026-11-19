import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/** Cobro del anticipo dentro del corte abierto. */
export class CreateAdvanceShiftPayments1790800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const existing = await queryRunner.getTable('advance_shift_payments');
    if (existing) return;

    await queryRunner.createTable(
      new Table({
        name: 'advance_shift_payments',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'tenant_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'quotation_id', type: 'varchar', length: '36', isNullable: true },
          { name: 'sales_order_id', type: 'varchar', length: '36', isNullable: true },
          { name: 'electronic_invoice_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'pos_daily_shift_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'payment_method', type: 'varchar', length: '20', isNullable: false },
          { name: 'amount_mxn', type: 'decimal', precision: 12, scale: 2, isNullable: false },
          { name: 'document_folio', type: 'varchar', length: '40', isNullable: false },
          { name: 'collected_by_user_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'sales_order_payment_id', type: 'varchar', length: '36', isNullable: true },
          { name: 'voided_at', type: 'timestamp', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP', isNullable: false },
        ],
      }),
    );

    await queryRunner.createIndex(
      'advance_shift_payments',
      new TableIndex({
        name: 'uq_advance_shift_payment_invoice',
        columnNames: ['electronic_invoice_id'],
        isUnique: true,
      }),
    );
    await queryRunner.createIndex(
      'advance_shift_payments',
      new TableIndex({
        name: 'idx_advance_shift_payment_shift',
        columnNames: ['pos_daily_shift_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const existing = await queryRunner.getTable('advance_shift_payments');
    if (existing) {
      await queryRunner.dropTable('advance_shift_payments');
    }
  }
}
