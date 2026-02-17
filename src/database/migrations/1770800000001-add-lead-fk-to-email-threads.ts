import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class AddLeadFkToEmailThreads1770800000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add lead_id column
    await queryRunner.addColumn(
      'email_threads',
      new TableColumn({
        name: 'lead_id',
        type: 'int',
        isNullable: true,
        comment: 'Foreign key to leads table',
      }),
    );

    // Add foreign key constraint
    await queryRunner.createForeignKey(
      'email_threads',
      new TableForeignKey({
        columnNames: ['lead_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'leads',
        onDelete: 'CASCADE',
        name: 'FK_email_threads_lead_id',
      }),
    );

    // Add index for faster queries
    await queryRunner.createIndex(
      'email_threads',
      new TableIndex({
        columnNames: ['lead_id'],
        name: 'IDX_email_threads_lead_id',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('email_threads', 'IDX_email_threads_lead_id');
    await queryRunner.dropForeignKey('email_threads', 'FK_email_threads_lead_id');
    await queryRunner.dropColumn('email_threads', 'lead_id');
  }
}
