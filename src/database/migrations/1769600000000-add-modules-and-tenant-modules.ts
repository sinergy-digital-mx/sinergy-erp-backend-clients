import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class AddModulesAndTenantModules1769600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create modules table
    await queryRunner.createTable(
      new Table({
        name: 'modules',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'code',
            type: 'varchar',
            length: '50',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'description',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create index on code
    await queryRunner.createIndex(
      'modules',
      new TableIndex({
        name: 'code_index',
        columnNames: ['code'],
        isUnique: true,
      }),
    );

    // Create tenant_modules table
    await queryRunner.createTable(
      new Table({
        name: 'tenant_modules',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'tenant_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'module_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'is_enabled',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes for tenant_modules
    await queryRunner.createIndex(
      'tenant_modules',
      new TableIndex({
        name: 'tenant_module_index',
        columnNames: ['tenant_id', 'module_id'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'tenant_modules',
      new TableIndex({
        name: 'tenant_index',
        columnNames: ['tenant_id'],
      }),
    );

    await queryRunner.createIndex(
      'tenant_modules',
      new TableIndex({
        name: 'module_index',
        columnNames: ['module_id'],
      }),
    );

    // Add foreign keys
    await queryRunner.createForeignKey(
      'tenant_modules',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'rbac_tenants',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'tenant_modules',
      new TableForeignKey({
        columnNames: ['module_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'modules',
        onDelete: 'CASCADE',
      }),
    );

    // Add module_id column to rbac_permissions
    await queryRunner.addColumn(
      'rbac_permissions',
      new (require('typeorm').TableColumn)({
        name: 'module_id',
        type: 'varchar',
        length: '36',
        isNullable: true,
      }),
    );

    // Create index on module_id
    await queryRunner.createIndex(
      'rbac_permissions',
      new TableIndex({
        name: 'module_index_permissions',
        columnNames: ['module_id'],
      }),
    );

    // Add foreign key for module_id
    await queryRunner.createForeignKey(
      'rbac_permissions',
      new TableForeignKey({
        columnNames: ['module_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'modules',
        onDelete: 'CASCADE',
      }),
    );

    // Update the unique index on rbac_permissions to include module_id
    await queryRunner.dropIndex('rbac_permissions', 'entity_action_index');
    await queryRunner.createIndex(
      'rbac_permissions',
      new TableIndex({
        name: 'module_action_index',
        columnNames: ['module_id', 'action'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key from rbac_permissions
    const permissionsTable = await queryRunner.getTable('rbac_permissions');
    if (permissionsTable) {
      const moduleForeignKey = permissionsTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('module_id') !== -1,
      );
      if (moduleForeignKey) {
        await queryRunner.dropForeignKey('rbac_permissions', moduleForeignKey);
      }
    }

    // Drop indexes from rbac_permissions
    await queryRunner.dropIndex('rbac_permissions', 'module_action_index');
    await queryRunner.dropIndex('rbac_permissions', 'module_index_permissions');

    // Drop module_id column from rbac_permissions
    await queryRunner.dropColumn('rbac_permissions', 'module_id');

    // Recreate the old unique index
    await queryRunner.createIndex(
      'rbac_permissions',
      new TableIndex({
        name: 'entity_action_index',
        columnNames: ['entity_type', 'action'],
        isUnique: true,
      }),
    );

    // Drop tenant_modules table
    await queryRunner.dropTable('tenant_modules');

    // Drop modules table
    await queryRunner.dropTable('modules');
  }
}
