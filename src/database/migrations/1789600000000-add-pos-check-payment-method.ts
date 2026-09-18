import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPosCheckPaymentMethod1789600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.ensureColumn(
      queryRunner,
      'pos_sale_collections',
      new TableColumn({
        name: 'amount_check_mxn',
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0,
        isNullable: false,
      }),
    );

    await this.ensureColumn(
      queryRunner,
      'pos_sale_collections',
      new TableColumn({
        name: 'check_reference',
        type: 'varchar',
        length: '120',
        isNullable: true,
      }),
    );

    await queryRunner.query(`
      ALTER TABLE pos_sale_collections
      MODIFY COLUMN payment_method ENUM('cash', 'card', 'transfer', 'check', 'mixed', 'credit') NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE inv_s_sales_order_payments
      MODIFY COLUMN payment_method ENUM('cash', 'card', 'transfer', 'check', 'mixed', 'credit') NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE pos_sale_collections
      SET payment_method = 'mixed'
      WHERE payment_method = 'check'
    `);
    await queryRunner.query(`
      UPDATE inv_s_sales_order_payments
      SET payment_method = 'mixed'
      WHERE payment_method = 'check'
    `);

    await queryRunner.query(`
      ALTER TABLE pos_sale_collections
      MODIFY COLUMN payment_method ENUM('cash', 'card', 'transfer', 'mixed', 'credit') NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE inv_s_sales_order_payments
      MODIFY COLUMN payment_method ENUM('cash', 'card', 'transfer', 'mixed', 'credit') NOT NULL
    `);

    await this.dropColumnIfExists(queryRunner, 'pos_sale_collections', 'check_reference');
    await this.dropColumnIfExists(queryRunner, 'pos_sale_collections', 'amount_check_mxn');
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
