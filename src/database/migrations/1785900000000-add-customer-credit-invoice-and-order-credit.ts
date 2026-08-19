import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCustomerCreditInvoiceAndOrderCredit1785900000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.ensureColumn(
      queryRunner,
      'customers',
      new TableColumn({
        name: 'credit_enabled',
        type: 'boolean',
        default: false,
        isNullable: false,
      }),
    );

    await this.ensureColumn(
      queryRunner,
      'customers',
      new TableColumn({
        name: 'auto_generate_invoice',
        type: 'boolean',
        default: false,
        isNullable: false,
      }),
    );

    await queryRunner.query(`
      UPDATE customers
      SET credit_enabled = 1
      WHERE credit_amount IS NOT NULL AND credit_amount > 0
    `);

    await this.ensureColumn(
      queryRunner,
      'inv_s_sales_orders',
      new TableColumn({
        name: 'is_credit',
        type: 'boolean',
        default: false,
        isNullable: false,
      }),
    );

    await this.ensureColumn(
      queryRunner,
      'inv_s_sales_orders',
      new TableColumn({
        name: 'invoice_requested',
        type: 'boolean',
        default: false,
        isNullable: false,
      }),
    );

    await this.ensureColumn(
      queryRunner,
      'pos_sale_collections',
      new TableColumn({
        name: 'amount_credit_mxn',
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0,
        isNullable: false,
      }),
    );

    await queryRunner.query(`
      ALTER TABLE pos_sale_collections
      MODIFY COLUMN payment_method ENUM('cash', 'card', 'transfer', 'mixed', 'credit') NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE inv_s_sales_order_payments
      MODIFY COLUMN payment_method ENUM('cash', 'card', 'transfer', 'mixed', 'credit') NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE pos_sale_collections
      MODIFY COLUMN payment_method ENUM('cash', 'card', 'transfer', 'mixed') NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE inv_s_sales_order_payments
      MODIFY COLUMN payment_method ENUM('cash', 'card', 'transfer', 'mixed') NOT NULL
    `);

    await this.dropColumnIfExists(queryRunner, 'pos_sale_collections', 'amount_credit_mxn');
    await this.dropColumnIfExists(queryRunner, 'inv_s_sales_orders', 'invoice_requested');
    await this.dropColumnIfExists(queryRunner, 'inv_s_sales_orders', 'is_credit');
    await this.dropColumnIfExists(queryRunner, 'customers', 'auto_generate_invoice');
    await this.dropColumnIfExists(queryRunner, 'customers', 'credit_enabled');
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
