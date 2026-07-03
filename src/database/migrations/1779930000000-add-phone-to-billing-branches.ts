import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPhoneToBillingBranches1779930000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'billing_branches',
      new TableColumn({
        name: 'phone',
        type: 'varchar',
        length: '50',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('billing_branches', 'phone');
  }
}
