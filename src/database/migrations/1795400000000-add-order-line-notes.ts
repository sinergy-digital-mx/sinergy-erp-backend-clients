import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/** Nota opcional por línea de orden de venta y de compra. */
export class AddOrderLineNotes1795400000000 implements MigrationInterface {
  name = 'AddOrderLineNotes1795400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.addNotes(queryRunner, 'inv_s_sales_order_details');
    await this.addNotes(queryRunner, 'inv_s_purchase_order_batch_detail');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.dropNotes(queryRunner, 'inv_s_sales_order_details');
    await this.dropNotes(queryRunner, 'inv_s_purchase_order_batch_detail');
  }

  private async addNotes(queryRunner: QueryRunner, tableName: string): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    if (!table?.findColumnByName('notes')) {
      await queryRunner.addColumn(
        tableName,
        new TableColumn({
          name: 'notes',
          type: 'varchar',
          length: '500',
          isNullable: true,
        }),
      );
    }
  }

  private async dropNotes(queryRunner: QueryRunner, tableName: string): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    if (table?.findColumnByName('notes')) {
      await queryRunner.dropColumn(tableName, 'notes');
    }
  }
}
