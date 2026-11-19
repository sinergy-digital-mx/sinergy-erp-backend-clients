import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/** Cheque de caja también en dólares. El tipo de cambio sigue en usd_exchange_rate. */
export class AddPosCheckUsd1794800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.ensureColumn(
      queryRunner,
      'pos_sale_collections',
      new TableColumn({
        name: 'amount_check_usd',
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0,
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('pos_sale_collections');
    if (table?.findColumnByName('amount_check_usd')) {
      await queryRunner.dropColumn('pos_sale_collections', 'amount_check_usd');
    }
  }

  private async ensureColumn(
    queryRunner: QueryRunner,
    tableName: string,
    column: TableColumn,
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    if (!table?.findColumnByName(column.name)) {
      await queryRunner.addColumn(tableName, column);
    }
  }
}
