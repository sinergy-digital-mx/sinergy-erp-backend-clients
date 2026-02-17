import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class RemoveEntityTypeUseRegistryOnly1769620000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('rbac_permissions');
    
    // Check if entity_type column exists before trying to drop it
    const entityTypeExists = table?.columns.some(col => col.name === 'entity_type');
    
    if (entityTypeExists) {
      // Drop the entity_type column - it's now redundant
      await queryRunner.dropColumn('rbac_permissions', 'entity_type');
    }

    // Make entity_registry_id NOT NULL (required) - only if it's nullable
    const entityRegistryColumn = table?.columns.find(col => col.name === 'entity_registry_id');
    if (entityRegistryColumn?.isNullable) {
      await queryRunner.changeColumn(
        'rbac_permissions',
        'entity_registry_id',
        new TableColumn({
          name: 'entity_registry_id',
          type: 'int',
          isNullable: false,
        })
      );
    }

    console.log('✅ Migration: Removed entity_type column, using entity_registry_id only');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('rbac_permissions');
    
    // Only restore entity_type if it doesn't exist
    const entityTypeExists = table?.columns.some(col => col.name === 'entity_type');
    
    if (!entityTypeExists) {
      await queryRunner.addColumn(
        'rbac_permissions',
        new TableColumn({
          name: 'entity_type',
          type: 'varchar',
          length: '100',
          isNullable: false,
        })
      );
    }

    // Make entity_registry_id nullable again
    const entityRegistryColumn = table?.columns.find(col => col.name === 'entity_registry_id');
    if (entityRegistryColumn && !entityRegistryColumn.isNullable) {
      await queryRunner.changeColumn(
        'rbac_permissions',
        'entity_registry_id',
        new TableColumn({
          name: 'entity_registry_id',
          type: 'int',
          isNullable: true,
        })
      );
    }

    console.log('✅ Migration rollback: Restored entity_type column');
  }
}

