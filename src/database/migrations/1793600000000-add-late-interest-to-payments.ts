import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddLateInterestToPayments1793600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const contracts = await queryRunner.getTable('contracts');
    if (contracts && !contracts.findColumnByName('payment_due_day')) {
      await queryRunner.addColumn(
        'contracts',
        new TableColumn({
          name: 'payment_due_day',
          type: 'int',
          isNullable: true,
        }),
      );
    }
    if (contracts && !contracts.findColumnByName('interest_rate')) {
      await queryRunner.addColumn(
        'contracts',
        new TableColumn({
          name: 'interest_rate',
          type: 'decimal',
          precision: 5,
          scale: 2,
          isNullable: true,
        }),
      );
    }

    const payments = await queryRunner.getTable('contract_payments');
    if (payments && !payments.findColumnByName('late_interest_amount')) {
      await queryRunner.addColumn(
        'contract_payments',
        new TableColumn({
          name: 'late_interest_amount',
          type: 'decimal',
          precision: 15,
          scale: 2,
          isNullable: true,
        }),
      );
    }
    if (payments && !payments.findColumnByName('late_interest_waived')) {
      await queryRunner.addColumn(
        'contract_payments',
        new TableColumn({
          name: 'late_interest_waived',
          type: 'boolean',
          default: false,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const payments = await queryRunner.getTable('contract_payments');
    if (payments?.findColumnByName('late_interest_waived')) {
      await queryRunner.dropColumn('contract_payments', 'late_interest_waived');
    }
    if (payments?.findColumnByName('late_interest_amount')) {
      await queryRunner.dropColumn('contract_payments', 'late_interest_amount');
    }
  }
}
