import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddEmailFieldsToLeads1770400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    let table = await queryRunner.getTable('leads');

    // Add assigned_rep_id
    let columnExists = table?.columns.some((col) => col.name === 'assigned_rep_id');
    if (!columnExists) {
      await queryRunner.addColumn(
        'leads',
        new TableColumn({
          name: 'assigned_rep_id',
          type: 'varchar',
          length: '36',
          isNullable: true,
        }),
      );
      table = await queryRunner.getTable('leads');
    }

    // Add email_contacted
    columnExists = table?.columns.some((col) => col.name === 'email_contacted');
    if (!columnExists) {
      await queryRunner.addColumn(
        'leads',
        new TableColumn({
          name: 'email_contacted',
          type: 'boolean',
          default: false,
          isNullable: false,
        }),
      );
      table = await queryRunner.getTable('leads');
    }

    // Add first_email_sent_at
    columnExists = table?.columns.some((col) => col.name === 'first_email_sent_at');
    if (!columnExists) {
      await queryRunner.addColumn(
        'leads',
        new TableColumn({
          name: 'first_email_sent_at',
          type: 'timestamp',
          isNullable: true,
        }),
      );
    }

    console.log('✅ Migration: Added email fields to leads');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    let table = await queryRunner.getTable('leads');

    if (table?.columns.some((col) => col.name === 'first_email_sent_at')) {
      await queryRunner.dropColumn('leads', 'first_email_sent_at');
      table = await queryRunner.getTable('leads');
    }

    if (table?.columns.some((col) => col.name === 'email_contacted')) {
      await queryRunner.dropColumn('leads', 'email_contacted');
      table = await queryRunner.getTable('leads');
    }

    if (table?.columns.some((col) => col.name === 'assigned_rep_id')) {
      await queryRunner.dropColumn('leads', 'assigned_rep_id');
    }

    console.log('✅ Migration rollback: Removed email fields from leads');
  }
}
