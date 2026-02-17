import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class AddEntityRegistryFkToPermissions1769610000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if entity_registry_id column already exists
    let table = await queryRunner.getTable('rbac_permissions');
    let columnExists = table?.columns.some(col => col.name === 'entity_registry_id');

    if (!columnExists) {
      // Add entity_registry_id column to rbac_permissions
      await queryRunner.addColumn(
        'rbac_permissions',
        new TableColumn({
          name: 'entity_registry_id',
          type: 'int',
          isNullable: true,
        })
      );
      
      // Refresh table reference after adding column
      table = await queryRunner.getTable('rbac_permissions');
    }

    // Check if foreign key already exists
    const fkExists = table?.foreignKeys.some(fk => fk.name === 'FK_rbac_permissions_entity_registry');
    
    if (!fkExists) {
      // Add foreign key constraint
      await queryRunner.createForeignKey(
        'rbac_permissions',
        new TableForeignKey({
          columnNames: ['entity_registry_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'entity_registry',
          onDelete: 'SET NULL',
          name: 'FK_rbac_permissions_entity_registry',
        })
      );
    }

    // Refresh table reference before checking index
    table = await queryRunner.getTable('rbac_permissions');
    const indexExists = table?.indices.some(idx => idx.name === 'IDX_rbac_permissions_entity_registry_id');
    
    if (!indexExists) {
      // Add index for the new foreign key
      await queryRunner.createIndex(
        'rbac_permissions',
        new TableIndex({
          columnNames: ['entity_registry_id'],
          name: 'IDX_rbac_permissions_entity_registry_id',
        })
      );
    }

    console.log('✅ Migration: Added entity_registry_id foreign key to rbac_permissions');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('rbac_permissions');
    
    // Drop foreign key if exists
    const fkExists = table?.foreignKeys.some(fk => fk.name === 'FK_rbac_permissions_entity_registry');
    if (fkExists) {
      await queryRunner.dropForeignKey(
        'rbac_permissions',
        'FK_rbac_permissions_entity_registry'
      );
    }

    // Drop index if exists
    const indexExists = table?.indices.some(idx => idx.name === 'IDX_rbac_permissions_entity_registry_id');
    if (indexExists) {
      await queryRunner.dropIndex(
        'rbac_permissions',
        'IDX_rbac_permissions_entity_registry_id'
      );
    }

    // Drop column if exists
    const columnExists = table?.columns.some(col => col.name === 'entity_registry_id');
    if (columnExists) {
      await queryRunner.dropColumn('rbac_permissions', 'entity_registry_id');
    }

    console.log('✅ Migration rollback: Removed entity_registry_id from rbac_permissions');
  }
}


