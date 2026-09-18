import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
} from 'typeorm';

/**
 * Snapshot de valuación en kardex (MXN):
 * - unit_cost_mxn / unit_sale_price_mxn al momento del movimiento
 * - cost_balance_after_mxn: valor de inventario a costo corrido (producto×almacén×UOM)
 */
export class AddStockLedgerValuation1789000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = 'inv_s_stock_ledger';
    if (!(await queryRunner.hasTable(table))) {
      return;
    }

    if (!(await queryRunner.hasColumn(table, 'unit_cost_mxn'))) {
      await queryRunner.addColumn(
        table,
        new TableColumn({
          name: 'unit_cost_mxn',
          type: 'decimal',
          precision: 16,
          scale: 4,
          isNullable: true,
        }),
      );
    }

    if (!(await queryRunner.hasColumn(table, 'unit_sale_price_mxn'))) {
      await queryRunner.addColumn(
        table,
        new TableColumn({
          name: 'unit_sale_price_mxn',
          type: 'decimal',
          precision: 16,
          scale: 4,
          isNullable: true,
        }),
      );
    }

    if (!(await queryRunner.hasColumn(table, 'cost_balance_after_mxn'))) {
      await queryRunner.addColumn(
        table,
        new TableColumn({
          name: 'cost_balance_after_mxn',
          type: 'decimal',
          precision: 18,
          scale: 4,
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = 'inv_s_stock_ledger';
    if (!(await queryRunner.hasTable(table))) {
      return;
    }
    for (const col of [
      'cost_balance_after_mxn',
      'unit_sale_price_mxn',
      'unit_cost_mxn',
    ]) {
      if (await queryRunner.hasColumn(table, col)) {
        await queryRunner.dropColumn(table, col);
      }
    }
  }
}
