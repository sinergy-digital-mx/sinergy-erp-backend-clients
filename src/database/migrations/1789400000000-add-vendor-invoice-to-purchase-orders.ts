import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddVendorInvoiceToPurchaseOrders1789400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.ensureColumn(
      queryRunner,
      'inv_s_purchase_order_batch',
      new TableColumn({
        name: 'vendor_invoice_number',
        type: 'varchar',
        length: '60',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.dropColumnIfExists(
      queryRunner,
      'inv_s_purchase_order_batch',
      'vendor_invoice_number',
    );
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

  private async dropColumnIfExists(
    queryRunner: QueryRunner,
    tableName: string,
    columnName: string,
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    if (table?.findColumnByName(columnName)) {
      await queryRunner.dropColumn(tableName, columnName);
    }
  }
}
