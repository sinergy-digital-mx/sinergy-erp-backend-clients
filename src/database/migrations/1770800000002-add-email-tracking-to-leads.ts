import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddEmailTrackingToLeads1770800000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if columns already exist before adding
    const table = await queryRunner.getTable('leads');
    
    if (!table?.findColumnByName('last_email_thread_status')) {
      await queryRunner.addColumn(
        'leads',
        new TableColumn({
          name: 'last_email_thread_status',
          type: 'varchar',
          isNullable: true,
          default: null,
          comment: 'Track latest email thread status: draft, sent, replied, closed, archived',
        }),
      );
    }

    if (!table?.findColumnByName('last_email_thread_id')) {
      await queryRunner.addColumn(
        'leads',
        new TableColumn({
          name: 'last_email_thread_id',
          type: 'varchar',
          isNullable: true,
          default: null,
          comment: 'Reference to the latest email thread',
        }),
      );
    }

    if (!table?.findColumnByName('email_thread_count')) {
      await queryRunner.addColumn(
        'leads',
        new TableColumn({
          name: 'email_thread_count',
          type: 'int',
          isNullable: false,
          default: 0,
          comment: 'Total number of email threads for this lead',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('leads', 'email_thread_count');
    await queryRunner.dropColumn('leads', 'last_email_thread_id');
    await queryRunner.dropColumn('leads', 'last_email_thread_status');
  }
}
