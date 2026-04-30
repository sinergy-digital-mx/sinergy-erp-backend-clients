import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class EnhanceSalesOrdersStructure1776204000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.ensureColumn(
      queryRunner,
      'inv_s_sales_orders',
      'sales_order_type',
      new TableColumn({
        name: 'sales_order_type',
        type: 'enum',
        enum: ['POS', 'MANUAL'],
        default: "'MANUAL'",
      }),
    );

    await this.ensureColumn(
      queryRunner,
      'inv_s_sales_orders',
      'fiscal_razon_social',
      new TableColumn({
        name: 'fiscal_razon_social',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );

    await this.ensureColumn(
      queryRunner,
      'inv_s_sales_orders',
      'discount_total',
      new TableColumn({
        name: 'discount_total',
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0,
      }),
    );

    await this.ensureColumn(
      queryRunner,
      'inv_s_sales_order_details',
      'discount_percentage',
      new TableColumn({
        name: 'discount_percentage',
        type: 'decimal',
        precision: 5,
        scale: 2,
        default: 0,
      }),
    );

    await this.ensureColumn(
      queryRunner,
      'inv_s_sales_order_details',
      'discount_unit',
      new TableColumn({
        name: 'discount_unit',
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.dropColumnIfExists(queryRunner, 'inv_s_sales_order_details', 'discount_unit');
    await this.dropColumnIfExists(queryRunner, 'inv_s_sales_order_details', 'discount_percentage');
    await this.dropColumnIfExists(queryRunner, 'inv_s_sales_orders', 'discount_total');
    await this.dropColumnIfExists(queryRunner, 'inv_s_sales_orders', 'fiscal_razon_social');
    await this.dropColumnIfExists(queryRunner, 'inv_s_sales_orders', 'sales_order_type');
  }

  private async ensureColumn(
    queryRunner: QueryRunner,
    tableName: string,
    columnName: string,
    column: TableColumn,
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    if (!table?.findColumnByName(columnName)) {
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
