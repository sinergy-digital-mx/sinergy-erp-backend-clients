import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateMailerConfigurationsTable1773300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'mailer_configurations',
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
            name: 'tenant_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'vendor',
            type: 'enum',
            enum: ['resend', 'sendgrid', 'aws_ses', 'smtp'],
            isNullable: false,
          },
          {
            name: 'vendor_config',
            type: 'json',
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'is_fallback',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'is_valid',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'created_by',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_by',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'deleted_by',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'last_test_result',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'last_test_timestamp',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'last_used_timestamp',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Add foreign key to tenants
    await queryRunner.createForeignKey(
      'mailer_configurations',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'rbac_tenants',
        onDelete: 'CASCADE',
        name: 'FK_mailer_configurations_tenant',
      }),
    );

    // Add unique index on tenant_id + name
    await queryRunner.createIndex(
      'mailer_configurations',
      new TableIndex({
        columnNames: ['tenant_id', 'name'],
        isUnique: true,
        name: 'IDX_mailer_configurations_tenant_name',
      }),
    );

    // Add index on tenant_id + is_active for active configuration queries
    await queryRunner.createIndex(
      'mailer_configurations',
      new TableIndex({
        columnNames: ['tenant_id', 'is_active'],
        name: 'IDX_mailer_configurations_tenant_is_active',
      }),
    );

    // Add index on tenant_id + is_fallback for fallback configuration queries
    await queryRunner.createIndex(
      'mailer_configurations',
      new TableIndex({
        columnNames: ['tenant_id', 'is_fallback'],
        name: 'IDX_mailer_configurations_tenant_is_fallback',
      }),
    );

    // Add index on created_at for date range queries
    await queryRunner.createIndex(
      'mailer_configurations',
      new TableIndex({
        columnNames: ['created_at'],
        name: 'IDX_mailer_configurations_created_at',
      }),
    );

    console.log('✅ Migration: Created mailer_configurations table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('mailer_configurations');

    // Drop foreign key
    const fk = table?.foreignKeys.find(
      (fk) => fk.name === 'FK_mailer_configurations_tenant',
    );
    if (fk) {
      await queryRunner.dropForeignKey('mailer_configurations', fk);
    }

    // Drop indexes
    const indices = [
      'IDX_mailer_configurations_tenant_name',
      'IDX_mailer_configurations_tenant_is_active',
      'IDX_mailer_configurations_tenant_is_fallback',
      'IDX_mailer_configurations_created_at',
    ];

    for (const indexName of indices) {
      const idx = table?.indices.find((idx) => idx.name === indexName);
      if (idx) {
        await queryRunner.dropIndex('mailer_configurations', idx);
      }
    }

    // Drop table
    await queryRunner.dropTable('mailer_configurations');

    console.log('✅ Migration rollback: Dropped mailer_configurations table');
  }
}
