import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPosPayerContact1794600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const tableName of ['pos_sale_collections', 'advance_shift_payments']) {
      for (const column of payerColumns()) {
        await this.ensureColumn(queryRunner, tableName, column);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const name of payerColumns().map((column) => column.name).reverse()) {
      await this.dropColumnIfExists(queryRunner, 'advance_shift_payments', name);
      await this.dropColumnIfExists(queryRunner, 'pos_sale_collections', name);
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

function payerColumns(): TableColumn[] {
  return [
    new TableColumn({
      name: 'transfer_payer_name',
      type: 'varchar',
      length: '120',
      isNullable: true,
    }),
    new TableColumn({
      name: 'transfer_payer_business_name',
      type: 'varchar',
      length: '180',
      isNullable: true,
    }),
    new TableColumn({
      name: 'card_payer_name',
      type: 'varchar',
      length: '120',
      isNullable: true,
    }),
    new TableColumn({
      name: 'card_payer_phone',
      type: 'varchar',
      length: '20',
      isNullable: true,
    }),
    new TableColumn({
      name: 'check_payer_name',
      type: 'varchar',
      length: '120',
      isNullable: true,
    }),
    new TableColumn({
      name: 'check_payer_phone',
      type: 'varchar',
      length: '20',
      isNullable: true,
    }),
  ];
}
