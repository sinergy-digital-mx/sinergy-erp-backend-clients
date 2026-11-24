import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * POS Caja marca el folio que tiene abierto. Ventas puede regresarlo.
 * El cobro con tarjeta guarda débito o crédito.
 */
export class AddPosCajaPresenceAndCardKind1796300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.addTimestamp(queryRunner, 'inv_s_sales_orders', 'pos_caja_opened_at');
    await this.addVarchar(queryRunner, 'inv_s_sales_orders', 'pos_caja_opened_by', 36);
    await this.addTimestamp(queryRunner, 'inv_s_quotations', 'pos_caja_opened_at');
    await this.addVarchar(queryRunner, 'inv_s_quotations', 'pos_caja_opened_by', 36);
    await this.addVarchar(queryRunner, 'pos_sale_collections', 'card_kind', 10);
    await this.addVarchar(queryRunner, 'advance_shift_payments', 'card_kind', 10);
    await this.addJson(queryRunner, 'advance_shift_payments', 'card_payments');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.drop(queryRunner, 'advance_shift_payments', 'card_payments');
    await this.drop(queryRunner, 'advance_shift_payments', 'card_kind');
    await this.drop(queryRunner, 'pos_sale_collections', 'card_kind');
    await this.drop(queryRunner, 'inv_s_quotations', 'pos_caja_opened_by');
    await this.drop(queryRunner, 'inv_s_quotations', 'pos_caja_opened_at');
    await this.drop(queryRunner, 'inv_s_sales_orders', 'pos_caja_opened_by');
    await this.drop(queryRunner, 'inv_s_sales_orders', 'pos_caja_opened_at');
  }

  private async addTimestamp(queryRunner: QueryRunner, tableName: string, column: string) {
    const table = await queryRunner.getTable(tableName);
    if (!table?.findColumnByName(column)) {
      await queryRunner.addColumn(
        tableName,
        new TableColumn({ name: column, type: 'timestamp', isNullable: true }),
      );
    }
  }

  private async addVarchar(
    queryRunner: QueryRunner,
    tableName: string,
    column: string,
    length: number,
  ) {
    const table = await queryRunner.getTable(tableName);
    if (!table?.findColumnByName(column)) {
      await queryRunner.addColumn(
        tableName,
        new TableColumn({ name: column, type: 'varchar', length: String(length), isNullable: true }),
      );
    }
  }

  private async addJson(queryRunner: QueryRunner, tableName: string, column: string) {
    const table = await queryRunner.getTable(tableName);
    if (!table?.findColumnByName(column)) {
      await queryRunner.addColumn(
        tableName,
        new TableColumn({ name: column, type: 'json', isNullable: true }),
      );
    }
  }

  private async drop(queryRunner: QueryRunner, tableName: string, column: string) {
    const table = await queryRunner.getTable(tableName);
    if (table?.findColumnByName(column)) {
      await queryRunner.dropColumn(tableName, column);
    }
  }
}
