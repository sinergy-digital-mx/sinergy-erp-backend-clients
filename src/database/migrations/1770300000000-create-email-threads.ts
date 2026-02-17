import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateEmailThreads1770300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create email_threads table
    await queryRunner.createTable(
      new Table({
        name: 'email_threads',
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
            name: 'entity_type',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'entity_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'subject',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'email_from',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'email_to',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'draft'",
            isNullable: false,
          },
          {
            name: 'last_message_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'message_count',
            type: 'int',
            default: 0,
            isNullable: false,
          },
          {
            name: 'is_read',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'created_by',
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

    // Create email_messages table
    await queryRunner.createTable(
      new Table({
        name: 'email_messages',
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
            name: 'thread_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'message_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'in_reply_to',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'from_email',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'to_email',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'cc',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'bcc',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'subject',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'body',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'body_html',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'direction',
            type: 'varchar',
            length: '50',
            default: "'outbound'",
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'pending'",
            isNullable: false,
          },
          {
            name: 'external_provider',
            type: 'varchar',
            length: '50',
            default: "'gmail'",
            isNullable: false,
          },
          {
            name: 'external_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'received_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'read_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Add foreign keys
    await queryRunner.createForeignKey(
      'email_threads',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'rbac_tenants',
        onDelete: 'CASCADE',
        name: 'FK_email_threads_tenant',
      }),
    );

    await queryRunner.createForeignKey(
      'email_messages',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'rbac_tenants',
        onDelete: 'CASCADE',
        name: 'FK_email_messages_tenant',
      }),
    );

    await queryRunner.createForeignKey(
      'email_messages',
      new TableForeignKey({
        columnNames: ['thread_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'email_threads',
        onDelete: 'CASCADE',
        name: 'FK_email_messages_thread',
      }),
    );

    // Add indexes
    await queryRunner.createIndex(
      'email_threads',
      new TableIndex({
        columnNames: ['tenant_id', 'entity_type', 'entity_id'],
        name: 'IDX_email_threads_tenant_entity',
      }),
    );

    await queryRunner.createIndex(
      'email_threads',
      new TableIndex({
        columnNames: ['tenant_id', 'status'],
        name: 'IDX_email_threads_tenant_status',
      }),
    );

    await queryRunner.createIndex(
      'email_messages',
      new TableIndex({
        columnNames: ['thread_id', 'created_at'],
        name: 'IDX_email_messages_thread_created',
      }),
    );

    await queryRunner.createIndex(
      'email_messages',
      new TableIndex({
        columnNames: ['tenant_id', 'external_id'],
        name: 'IDX_email_messages_tenant_external',
      }),
    );

    console.log('✅ Migration: Created email_threads and email_messages tables');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    const emailThreadsTable = await queryRunner.getTable('email_threads');
    const emailMessagesTable = await queryRunner.getTable('email_messages');

    if (emailThreadsTable) {
      const idx1 = emailThreadsTable.indices.find(
        (idx) => idx.name === 'IDX_email_threads_tenant_entity',
      );
      if (idx1) await queryRunner.dropIndex('email_threads', idx1);

      const idx2 = emailThreadsTable.indices.find(
        (idx) => idx.name === 'IDX_email_threads_tenant_status',
      );
      if (idx2) await queryRunner.dropIndex('email_threads', idx2);
    }

    if (emailMessagesTable) {
      const idx3 = emailMessagesTable.indices.find(
        (idx) => idx.name === 'IDX_email_messages_thread_created',
      );
      if (idx3) await queryRunner.dropIndex('email_messages', idx3);

      const idx4 = emailMessagesTable.indices.find(
        (idx) => idx.name === 'IDX_email_messages_tenant_external',
      );
      if (idx4) await queryRunner.dropIndex('email_messages', idx4);
    }

    // Drop foreign keys
    if (emailMessagesTable) {
      const fk1 = emailMessagesTable.foreignKeys.find(
        (fk) => fk.name === 'FK_email_messages_thread',
      );
      if (fk1) await queryRunner.dropForeignKey('email_messages', fk1);

      const fk2 = emailMessagesTable.foreignKeys.find(
        (fk) => fk.name === 'FK_email_messages_tenant',
      );
      if (fk2) await queryRunner.dropForeignKey('email_messages', fk2);
    }

    if (emailThreadsTable) {
      const fk3 = emailThreadsTable.foreignKeys.find(
        (fk) => fk.name === 'FK_email_threads_tenant',
      );
      if (fk3) await queryRunner.dropForeignKey('email_threads', fk3);
    }

    // Drop tables
    await queryRunner.dropTable('email_messages');
    await queryRunner.dropTable('email_threads');

    console.log('✅ Migration rollback: Dropped email tables');
  }
}
