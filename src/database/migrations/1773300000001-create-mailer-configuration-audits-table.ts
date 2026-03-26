import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateMailerConfigurationAuditsTable1773300000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'mailer_configuration_audits',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'configuration_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'tenant_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'action',
            type: 'enum',
            enum: ['CREATE', 'UPDATE', 'DELETE', 'TEST', 'ACTIVATE', 'DEACTIVATE'],
            isNullable: false,
          },
          {
            name: 'changed_fields',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'performed_by',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'performed_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'details',
            type: 'text',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Add foreign key to mailer_configurations
    await queryRunner.createForeignKey(
      'mailer_configuration_audits',
      new TableForeignKey({
        columnNames: ['configuration_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'mailer_configurations',
        onDelete: 'CASCADE',
        name: 'FK_mailer_configuration_audits_configuration',
      }),
    );

    // Add foreign key to tenants
    await queryRunner.createForeignKey(
      'mailer_configuration_audits',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'rbac_tenants',
        onDelete: 'CASCADE',
        name: 'FK_mailer_configuration_audits_tenant',
      }),
    );

    // Add index on configuration_id for audit trail queries
    await queryRunner.createIndex(
      'mailer_configuration_audits',
      new TableIndex({
        columnNames: ['configuration_id'],
        name: 'IDX_mailer_configuration_audits_configuration_id',
      }),
    );

    // Add index on tenant_id for tenant-scoped audit queries
    await queryRunner.createIndex(
      'mailer_configuration_audits',
      new TableIndex({
        columnNames: ['tenant_id'],
        name: 'IDX_mailer_configuration_audits_tenant_id',
      }),
    );

    // Add index on performed_at for date range queries
    await queryRunner.createIndex(
      'mailer_configuration_audits',
      new TableIndex({
        columnNames: ['performed_at'],
        name: 'IDX_mailer_configuration_audits_performed_at',
      }),
    );

    console.log('✅ Migration: Created mailer_configuration_audits table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('mailer_configuration_audits');

    // Drop foreign keys
    const fks = [
      'FK_mailer_configuration_audits_configuration',
      'FK_mailer_configuration_audits_tenant',
    ];

    for (const fkName of fks) {
      const fk = table?.foreignKeys.find((fk) => fk.name === fkName);
      if (fk) {
        await queryRunner.dropForeignKey('mailer_configuration_audits', fk);
      }
    }

    // Drop indexes
    const indices = [
      'IDX_mailer_configuration_audits_configuration_id',
      'IDX_mailer_configuration_audits_tenant_id',
      'IDX_mailer_configuration_audits_performed_at',
    ];

    for (const indexName of indices) {
      const idx = table?.indices.find((idx) => idx.name === indexName);
      if (idx) {
        await queryRunner.dropIndex('mailer_configuration_audits', idx);
      }
    }

    // Drop table
    await queryRunner.dropTable('mailer_configuration_audits');

    console.log('✅ Migration rollback: Dropped mailer_configuration_audits table');
  }
}
