import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateThirdPartyConfigs1770200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'third_party_configs',
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
            name: 'provider',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'encrypted_api_key',
            type: 'longtext',
            isNullable: false,
          },
          {
            name: 'encrypted_api_secret',
            type: 'longtext',
            isNullable: true,
          },
          {
            name: 'encrypted_webhook_secret',
            type: 'longtext',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'is_enabled',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'is_test_mode',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'last_tested_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_by',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'updated_by',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
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

    // Add foreign key
    await queryRunner.createForeignKey(
      'third_party_configs',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'rbac_tenants',
        onDelete: 'CASCADE',
        name: 'FK_third_party_configs_tenant',
      }),
    );

    // Add unique index on tenant_id + provider
    await queryRunner.createIndex(
      'third_party_configs',
      new TableIndex({
        columnNames: ['tenant_id', 'provider'],
        isUnique: true,
        name: 'IDX_third_party_configs_tenant_provider',
      }),
    );

    // Add index on tenant_id for queries
    await queryRunner.createIndex(
      'third_party_configs',
      new TableIndex({
        columnNames: ['tenant_id'],
        name: 'IDX_third_party_configs_tenant_id',
      }),
    );

    console.log('✅ Migration: Created third_party_configs table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('third_party_configs');

    // Drop foreign key
    const fk = table?.foreignKeys.find(
      (fk) => fk.name === 'FK_third_party_configs_tenant',
    );
    if (fk) {
      await queryRunner.dropForeignKey('third_party_configs', fk);
    }

    // Drop indexes
    const idx1 = table?.indices.find(
      (idx) => idx.name === 'IDX_third_party_configs_tenant_provider',
    );
    if (idx1) {
      await queryRunner.dropIndex('third_party_configs', idx1);
    }

    const idx2 = table?.indices.find(
      (idx) => idx.name === 'IDX_third_party_configs_tenant_id',
    );
    if (idx2) {
      await queryRunner.dropIndex('third_party_configs', idx2);
    }

    // Drop table
    await queryRunner.dropTable('third_party_configs');

    console.log('✅ Migration rollback: Dropped third_party_configs table');
  }
}
