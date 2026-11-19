import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCustomerCreditCurrency1794700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('customer_credits');
    if (table?.findColumnByName('credit_currency')) {
      return;
    }
    await queryRunner.addColumn(
      'customer_credits',
      new TableColumn({
        name: 'credit_currency',
        type: 'varchar',
        length: '3',
        isNullable: false,
        default: "'MXN'",
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('customer_credits');
    if (table?.findColumnByName('credit_currency')) {
      await queryRunner.dropColumn('customer_credits', 'credit_currency');
    }
  }
}
