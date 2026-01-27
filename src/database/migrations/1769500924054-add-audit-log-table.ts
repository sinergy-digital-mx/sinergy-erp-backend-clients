import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class AddAuditLogTable1769500924054 implements MigrationInterface {
  name = 'AddAuditLogTable1769500924054';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'audit_logs',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'action',
            type: 'enum',
            enum: [
              'permission_granted',
              'permission_revoked',
              'role_assigned',
              'role_unassigned',
              'role_created',
              'role_updated',
              'role_deleted',
              'permission_created',
              'permission_updated',
              'permission_deleted',
              'access_granted',
              'access_denied',
              'tenant_created',
              'tenant_updated',
              'tenant_deleted',
            ],
          },
          {
            name: 'result',
            type: 'enum',
            enum: ['success', 'failure', 'error'],
          },
          {
            name: 'user_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'actor_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'tenant_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'resource_type',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'resource_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'entity_type',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'permission_action',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'role_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'permission_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'details',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'error_message',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'ip_address',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'user_agent',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'datetime',
            precision: 6,
            default: 'CURRENT_TIMESTAMP(6)',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['tenant_id'],
            referencedTableName: 'rbac_tenants',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
      }),
      true,
    );

    // Create indexes for performance
    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_audit_logs_tenant_created',
        columnNames: ['tenant_id', 'created_at'],
      }),
    );

    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_audit_logs_user_created',
        columnNames: ['user_id', 'created_at'],
      }),
    );

    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_audit_logs_action_created',
        columnNames: ['action', 'created_at'],
      }),
    );

    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_audit_logs_result_created',
        columnNames: ['result', 'created_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('audit_logs');
  }
}