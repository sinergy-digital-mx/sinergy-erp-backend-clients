import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAgentReplyTrackingToLeads1771900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add agent_replied_back column
    await queryRunner.addColumn('leads', new TableColumn({
      name: 'agent_replied_back',
      type: 'boolean',
      default: false,
      isNullable: false,
    }));

    // Add agent_replied_back_at column
    await queryRunner.addColumn('leads', new TableColumn({
      name: 'agent_replied_back_at',
      type: 'timestamp',
      isNullable: true,
    }));

    console.log('✅ Added agent reply tracking columns to leads table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('leads', 'agent_replied_back_at');
    await queryRunner.dropColumn('leads', 'agent_replied_back');
    console.log('✅ Removed agent reply tracking columns from leads table');
  }
}