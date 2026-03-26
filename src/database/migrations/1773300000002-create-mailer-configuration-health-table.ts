import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateMailerConfigurationHealthTable1773300000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'mailer_configuration_health',
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
            isUnique: true,
          },
          {
            name: 'tenant_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'last_test_result',
            type: 'enum',
            enum: ['SUCCESS', 'FAILURE', 'UNTESTED'],
            default: "'UNTESTED'",
            isNullable: false,
          },
          {
            name: 'last_test_timestamp',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'last_test_error',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'last_used_timestamp',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'consecutive_failures',
            type: 'int',
            default: 0,
            isNullable: false,
          },
          {
            name: 'is_healthy',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Add foreign key to mailer_configurations (one-to-one relationship)
    await queryRunner.createForeignKey(
      'mailer_configuration_health',
      new TableForeignKey({
        columnNames: ['configuration_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'mailer_configurations',
        onDelete: 'CASCADE',
        name: 'FK_mailer_configuration_health_configuration',
      }),
    );

    // Add foreign key to tenants
    await queryRunner.createForeignKey(
      'mailer_configuration_health',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'rbac_tenants',
        onDelete: 'CASCADE',
        name: 'FK_mailer_configuration_health_tenant',
      }),
    );

    // Add index on tenant_id for tenant-scoped health queries
    await queryRunner.createIndex(
      'mailer_configuration_health',
      new TableIndex({
        columnNames: ['tenant_id'],
        name: 'IDX_mailer_configuration_health_tenant_id',
      }),
    );

    // Add index on is_healthy for health status queries
    await queryRunner.createIndex(
      'mailer_configuration_health',
      new TableIndex({
        columnNames: ['is_healthy'],
        name: 'IDX_mailer_configuration_health_is_healthy',
      }),
    );

    console.log('✅ Migration: Created mailer_configuration_health table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('mailer_configuration_health');

    // Drop foreign keys
    const fks = [
      'FK_mailer_configuration_health_configuration',
      'FK_mailer_configuration_health_tenant',
    ];

    for (const fkName of fks) {
      const fk = table?.foreignKeys.find((fk) => fk.name === fkName);
      if (fk) {
        await queryRunner.dropForeignKey('mailer_configuration_health', fk);
      }
    }

    // Drop indexes
    const indices = [
      'IDX_mailer_configuration_health_tenant_id',
      'IDX_mailer_configuration_health_is_healthy',
    ];

    for (const indexName of indices) {
      const idx = table?.indices.find((idx) => idx.name === indexName);
      if (idx) {
        await queryRunner.dropIndex('mailer_configuration_health', idx);
      }
    }

    // Drop table
    await queryRunner.dropTable('mailer_configuration_health');

    console.log('✅ Migration rollback: Dropped mailer_configuration_health table');
  }
}
