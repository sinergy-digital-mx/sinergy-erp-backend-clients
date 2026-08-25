import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCurrencyToProductVendorCosts1786300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.ensureColumn(
      queryRunner,
      'product_vendor_costs',
      new TableColumn({
        name: 'currency',
        type: 'enum',
        enum: ['MXN', 'USD'],
        default: "'MXN'",
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('product_vendor_costs');
    if (table?.findColumnByName('currency')) {
      await queryRunner.dropColumn('product_vendor_costs', 'currency');
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
