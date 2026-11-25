import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/** Abonos de caja al corte abierto. Varios por orden; no reemplazan el cobro único. */
export class CreatePosShiftAbonos1797100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const existing = await queryRunner.getTable('pos_shift_abonos');
    if (existing) return;

    await queryRunner.createTable(
      new Table({
        name: 'pos_shift_abonos',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'tenant_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'sales_order_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'pos_daily_shift_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'sales_order_payment_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'payment_method', type: 'varchar', length: '20', isNullable: false },
          { name: 'amount_mxn', type: 'decimal', precision: 12, scale: 2, isNullable: false },
          {
            name: 'amount_cash_mxn',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: 'amount_transfer_mxn',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: 'amount_card_mxn',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: 'amount_check_mxn',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          { name: 'reference_number', type: 'varchar', length: '120', isNullable: true },
          { name: 'created_by', type: 'varchar', length: '36', isNullable: false },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP', isNullable: false },
        ],
      }),
    );

    await queryRunner.createIndex(
      'pos_shift_abonos',
      new TableIndex({
        name: 'idx_pos_shift_abono_shift',
        columnNames: ['pos_daily_shift_id'],
      }),
    );
    await queryRunner.createIndex(
      'pos_shift_abonos',
      new TableIndex({
        name: 'idx_pos_shift_abono_order',
        columnNames: ['sales_order_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const existing = await queryRunner.getTable('pos_shift_abonos');
    if (existing) {
      await queryRunner.dropTable('pos_shift_abonos');
    }
  }
}
