import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Varias transferencias en un mismo cobro.
 * amount_transfer_mxn sigue siendo la suma; transfer_payments guarda cada partida.
 */
export class AddPosCollectionTransferPayments1797300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.addJson(queryRunner, 'pos_sale_collections', 'transfer_payments');
    await this.addJson(queryRunner, 'advance_shift_payments', 'transfer_payments');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.drop(queryRunner, 'advance_shift_payments', 'transfer_payments');
    await this.drop(queryRunner, 'pos_sale_collections', 'transfer_payments');
  }

  private async addJson(queryRunner: QueryRunner, tableName: string, column: string): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    if (!table?.findColumnByName(column)) {
      await queryRunner.addColumn(
        tableName,
        new TableColumn({
          name: column,
          type: 'json',
          isNullable: true,
        }),
      );
    }
  }

  private async drop(queryRunner: QueryRunner, tableName: string, column: string): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    if (table?.findColumnByName(column)) {
      await queryRunner.dropColumn(tableName, column);
    }
  }
}
