import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class RefactorEmailThreadsEntityRegistry1771300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if entity_type_id column already exists
    const table = await queryRunner.getTable('email_threads');
    const hasEntityTypeId = table?.columns.some(col => col.name === 'entity_type_id');
    const hasEntityId = table?.columns.some(col => col.name === 'entity_id');

    // Add entity_type_id column if it doesn't exist
    if (!hasEntityTypeId) {
      await queryRunner.addColumn(
        'email_threads',
        new TableColumn({
          name: 'entity_type_id',
          type: 'int',
          isNullable: true,
        }),
      );
    }

    // Add entity_id column if it doesn't exist
    if (!hasEntityId) {
      await queryRunner.addColumn(
        'email_threads',
        new TableColumn({
          name: 'entity_id',
          type: 'varchar',
          length: '36',
          isNullable: true,
        }),
      );
    }

    // Populate entity_type_id and entity_id from existing data
    // For existing threads with lead_id, map to Lead entity type (assuming id=1 in entity_registry)
    await queryRunner.query(`
      UPDATE email_threads 
      SET entity_type_id = 1, entity_id = CAST(lead_id AS CHAR(36))
      WHERE lead_id IS NOT NULL AND entity_type_id IS NULL
    `);

    // Make columns NOT NULL after population
    if (!hasEntityTypeId) {
      await queryRunner.changeColumn(
        'email_threads',
        'entity_type_id',
        new TableColumn({
          name: 'entity_type_id',
          type: 'int',
          isNullable: false,
        }),
      );
    }

    if (!hasEntityId) {
      await queryRunner.changeColumn(
        'email_threads',
        'entity_id',
        new TableColumn({
          name: 'entity_id',
          type: 'varchar',
          length: '36',
          isNullable: false,
        }),
      );
    }

    // Add foreign key constraint for entity_type_id if it doesn't exist
    const tableWithFks = await queryRunner.getTable('email_threads');
    const hasFk = tableWithFks?.foreignKeys.some(
      (fk) => fk.columnNames.indexOf('entity_type_id') !== -1,
    );

    if (!hasFk) {
      await queryRunner.createForeignKey(
        'email_threads',
        new TableForeignKey({
          columnNames: ['entity_type_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'entity_registry',
          onDelete: 'RESTRICT',
        }),
      );
    }

    // Create new indexes if they don't exist
    const tableWithIndexes = await queryRunner.getTable('email_threads');
    const hasNewIndex = tableWithIndexes?.indices.some(
      (idx) => idx.name === 'IDX_email_threads_tenant_entity',
    );

    if (!hasNewIndex) {
      await queryRunner.createIndex(
        'email_threads',
        new TableIndex({
          name: 'IDX_email_threads_tenant_entity',
          columnNames: ['tenant_id', 'entity_type_id', 'entity_id'],
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    const table = await queryRunner.getTable('email_threads');
    if (table) {
      const foreignKey = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('entity_type_id') !== -1,
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey('email_threads', foreignKey);
      }
    }

    // Drop new index
    try {
      await queryRunner.dropIndex('email_threads', 'IDX_email_threads_tenant_entity');
    } catch (e) {
      // Index might not exist
    }

    // Drop columns
    const tableBeforeDrop = await queryRunner.getTable('email_threads');
    if (tableBeforeDrop?.columns.some(col => col.name === 'entity_id')) {
      await queryRunner.dropColumn('email_threads', 'entity_id');
    }
    if (tableBeforeDrop?.columns.some(col => col.name === 'entity_type_id')) {
      await queryRunner.dropColumn('email_threads', 'entity_type_id');
    }
  }
}
