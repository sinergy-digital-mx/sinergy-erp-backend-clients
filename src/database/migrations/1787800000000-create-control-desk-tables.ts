import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

const MODULE_CODE = 'warehouse_control';
const ENTITY_CODE = 'WarehouseControl';

export class CreateControlDeskTables1787800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE modules
      SET name = 'Mesa de Control',
          description = 'Picking por almacén, posiciones de piso y armado de órdenes de venta'
      WHERE code = '${MODULE_CODE}'
    `);

    await queryRunner.query(`
      UPDATE entity_registry
      SET name = 'Mesa de Control'
      WHERE code = '${ENTITY_CODE}'
    `);

    await queryRunner.query(`
      INSERT INTO rbac_permissions (
        id, entity_registry_id, module_id, action, description,
        is_system_permission, created_at, updated_at
      )
      SELECT UUID(), er.id, m.id, 'Create', 'Configurar posiciones de piso de Mesa de Control', 1, NOW(), NOW()
      FROM entity_registry er
      JOIN modules m ON m.code = '${MODULE_CODE}'
      WHERE er.code = '${ENTITY_CODE}'
        AND NOT EXISTS (
          SELECT 1 FROM rbac_permissions p
          WHERE p.module_id = m.id AND p.action = 'Create'
        )
    `);

    await queryRunner.query(`
      UPDATE rbac_permissions p
      JOIN modules m ON m.id = p.module_id
      SET p.description = CASE p.action
        WHEN 'ViewMenu' THEN 'Ver módulo Mesa de Control en menú'
        WHEN 'Read' THEN 'Consultar tablero y avance de Mesa de Control'
        WHEN 'Update' THEN 'Picking, posiciones y corroboración de Mesa de Control'
        ELSE p.description
      END
      WHERE m.code = '${MODULE_CODE}'
    `);

    await queryRunner.query(`
      INSERT INTO rbac_role_permissions (id, role_id, permission_id, created_at)
      SELECT UUID(), r.id, p.id, NOW()
      FROM rbac_roles r
      JOIN rbac_permissions p ON p.module_id = (
        SELECT id FROM modules WHERE code = '${MODULE_CODE}' LIMIT 1
      )
      WHERE (r.name = 'Admin' OR r.is_admin = 1)
        AND p.action = 'Create'
        AND NOT EXISTS (
          SELECT 1 FROM rbac_role_permissions rp
          WHERE rp.role_id = r.id AND rp.permission_id = p.id
        )
    `);

    await queryRunner.createTable(
      new Table({
        name: 'control_desk_positions',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: '(UUID())',
          },
          { name: 'tenant_id', type: 'varchar', length: '36', isNullable: false },
          {
            name: 'billing_branch_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          { name: 'code', type: 'varchar', length: '20', isNullable: false },
          { name: 'name', type: 'varchar', length: '100', isNullable: true },
          { name: 'row', type: 'int', default: 0 },
          { name: 'col', type: 'int', default: 0 },
          { name: 'sort_order', type: 'int', default: 0 },
          { name: 'is_active', type: 'tinyint', default: 1 },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'control_desk_jobs',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: '(UUID())',
          },
          { name: 'tenant_id', type: 'varchar', length: '36', isNullable: false },
          {
            name: 'sales_order_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'billing_branch_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'position_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '32',
            default: "'released'",
          },
          { name: 'has_shortage', type: 'tinyint', default: 0 },
          { name: 'created_by', type: 'varchar', length: '36', isNullable: false },
          { name: 'updated_by', type: 'varchar', length: '36', isNullable: true },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'control_desk_pick_tasks',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: '(UUID())',
          },
          { name: 'tenant_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'job_id', type: 'varchar', length: '36', isNullable: false },
          {
            name: 'warehouse_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '32',
            default: "'pending'",
          },
          { name: 'started_at', type: 'timestamp', isNullable: true },
          { name: 'started_by', type: 'varchar', length: '36', isNullable: true },
          { name: 'completed_at', type: 'timestamp', isNullable: true },
          {
            name: 'completed_by',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'control_desk_pick_lines',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: '(UUID())',
          },
          { name: 'tenant_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'task_id', type: 'varchar', length: '36', isNullable: false },
          {
            name: 'sales_order_detail_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'warehouse_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'quantity_base_requested',
            type: 'decimal',
            precision: 12,
            scale: 3,
            isNullable: false,
          },
          {
            name: 'quantity_base_picked',
            type: 'decimal',
            precision: 12,
            scale: 3,
            default: 0,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '32',
            default: "'pending'",
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'user_warehouse_assignments',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: '(UUID())',
          },
          { name: 'tenant_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'user_id', type: 'varchar', length: '36', isNullable: false },
          {
            name: 'warehouse_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
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

    await this.addForeignKeys(queryRunner);
    await this.addIndexes(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('user_warehouse_assignments', true);
    await queryRunner.dropTable('control_desk_pick_lines', true);
    await queryRunner.dropTable('control_desk_pick_tasks', true);
    await queryRunner.dropTable('control_desk_jobs', true);
    await queryRunner.dropTable('control_desk_positions', true);

    await queryRunner.query(`
      DELETE rp FROM rbac_role_permissions rp
      INNER JOIN rbac_permissions p ON p.id = rp.permission_id
      INNER JOIN modules m ON m.id = p.module_id
      WHERE m.code = '${MODULE_CODE}' AND p.action = 'Create'
    `);

    await queryRunner.query(`
      DELETE p FROM rbac_permissions p
      INNER JOIN modules m ON m.id = p.module_id
      WHERE m.code = '${MODULE_CODE}' AND p.action = 'Create'
    `);

    await queryRunner.query(`
      UPDATE modules
      SET name = 'Control de almacén',
          description = 'Corroboración y picking de órdenes en selección'
      WHERE code = '${MODULE_CODE}'
    `);

    await queryRunner.query(`
      UPDATE entity_registry
      SET name = 'Control de almacén'
      WHERE code = '${ENTITY_CODE}'
    `);
  }

  private async addForeignKeys(queryRunner: QueryRunner): Promise<void> {
    const fks: Array<{ table: string; fk: TableForeignKey }> = [
      {
        table: 'control_desk_positions',
        fk: new TableForeignKey({
          name: 'FK_cd_positions_tenant',
          columnNames: ['tenant_id'],
          referencedTableName: 'rbac_tenants',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      },
      {
        table: 'control_desk_positions',
        fk: new TableForeignKey({
          name: 'FK_cd_positions_branch',
          columnNames: ['billing_branch_id'],
          referencedTableName: 'billing_branches',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      },
      {
        table: 'control_desk_jobs',
        fk: new TableForeignKey({
          name: 'FK_cd_jobs_tenant',
          columnNames: ['tenant_id'],
          referencedTableName: 'rbac_tenants',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      },
      {
        table: 'control_desk_jobs',
        fk: new TableForeignKey({
          name: 'FK_cd_jobs_sales_order',
          columnNames: ['sales_order_id'],
          referencedTableName: 'inv_s_sales_orders',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      },
      {
        table: 'control_desk_jobs',
        fk: new TableForeignKey({
          name: 'FK_cd_jobs_branch',
          columnNames: ['billing_branch_id'],
          referencedTableName: 'billing_branches',
          referencedColumnNames: ['id'],
          onDelete: 'RESTRICT',
        }),
      },
      {
        table: 'control_desk_jobs',
        fk: new TableForeignKey({
          name: 'FK_cd_jobs_position',
          columnNames: ['position_id'],
          referencedTableName: 'control_desk_positions',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      },
      {
        table: 'control_desk_pick_tasks',
        fk: new TableForeignKey({
          name: 'FK_cd_tasks_tenant',
          columnNames: ['tenant_id'],
          referencedTableName: 'rbac_tenants',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      },
      {
        table: 'control_desk_pick_tasks',
        fk: new TableForeignKey({
          name: 'FK_cd_tasks_job',
          columnNames: ['job_id'],
          referencedTableName: 'control_desk_jobs',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      },
      {
        table: 'control_desk_pick_tasks',
        fk: new TableForeignKey({
          name: 'FK_cd_tasks_warehouse',
          columnNames: ['warehouse_id'],
          referencedTableName: 'warehouses',
          referencedColumnNames: ['id'],
          onDelete: 'RESTRICT',
        }),
      },
      {
        table: 'control_desk_pick_tasks',
        fk: new TableForeignKey({
          name: 'FK_cd_tasks_started_by',
          columnNames: ['started_by'],
          referencedTableName: 'users',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      },
      {
        table: 'control_desk_pick_tasks',
        fk: new TableForeignKey({
          name: 'FK_cd_tasks_completed_by',
          columnNames: ['completed_by'],
          referencedTableName: 'users',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      },
      {
        table: 'control_desk_pick_lines',
        fk: new TableForeignKey({
          name: 'FK_cd_lines_tenant',
          columnNames: ['tenant_id'],
          referencedTableName: 'rbac_tenants',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      },
      {
        table: 'control_desk_pick_lines',
        fk: new TableForeignKey({
          name: 'FK_cd_lines_task',
          columnNames: ['task_id'],
          referencedTableName: 'control_desk_pick_tasks',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      },
      {
        table: 'control_desk_pick_lines',
        fk: new TableForeignKey({
          name: 'FK_cd_lines_detail',
          columnNames: ['sales_order_detail_id'],
          referencedTableName: 'inv_s_sales_order_details',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      },
      {
        table: 'control_desk_pick_lines',
        fk: new TableForeignKey({
          name: 'FK_cd_lines_warehouse',
          columnNames: ['warehouse_id'],
          referencedTableName: 'warehouses',
          referencedColumnNames: ['id'],
          onDelete: 'RESTRICT',
        }),
      },
      {
        table: 'user_warehouse_assignments',
        fk: new TableForeignKey({
          name: 'FK_uwa_tenant',
          columnNames: ['tenant_id'],
          referencedTableName: 'rbac_tenants',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      },
      {
        table: 'user_warehouse_assignments',
        fk: new TableForeignKey({
          name: 'FK_uwa_user',
          columnNames: ['user_id'],
          referencedTableName: 'users',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      },
      {
        table: 'user_warehouse_assignments',
        fk: new TableForeignKey({
          name: 'FK_uwa_warehouse',
          columnNames: ['warehouse_id'],
          referencedTableName: 'warehouses',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      },
    ];

    for (const { table, fk } of fks) {
      await queryRunner.createForeignKey(table, fk);
    }
  }

  private async addIndexes(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createIndex(
      'control_desk_positions',
      new TableIndex({
        name: 'idx_cd_positions_tenant',
        columnNames: ['tenant_id'],
      }),
    );
    await queryRunner.createIndex(
      'control_desk_positions',
      new TableIndex({
        name: 'idx_cd_positions_branch',
        columnNames: ['tenant_id', 'billing_branch_id'],
      }),
    );
    await queryRunner.createIndex(
      'control_desk_positions',
      new TableIndex({
        name: 'uq_cd_positions_branch_code',
        columnNames: ['tenant_id', 'billing_branch_id', 'code'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'control_desk_jobs',
      new TableIndex({
        name: 'idx_cd_jobs_tenant',
        columnNames: ['tenant_id'],
      }),
    );
    await queryRunner.createIndex(
      'control_desk_jobs',
      new TableIndex({
        name: 'idx_cd_jobs_tenant_status',
        columnNames: ['tenant_id', 'status'],
      }),
    );
    await queryRunner.createIndex(
      'control_desk_jobs',
      new TableIndex({
        name: 'idx_cd_jobs_tenant_branch',
        columnNames: ['tenant_id', 'billing_branch_id'],
      }),
    );
    await queryRunner.createIndex(
      'control_desk_jobs',
      new TableIndex({
        name: 'uq_cd_jobs_sales_order',
        columnNames: ['sales_order_id'],
        isUnique: true,
      }),
    );
    await queryRunner.createIndex(
      'control_desk_jobs',
      new TableIndex({
        name: 'uq_cd_jobs_position',
        columnNames: ['position_id'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'control_desk_pick_tasks',
      new TableIndex({
        name: 'idx_cd_tasks_tenant',
        columnNames: ['tenant_id'],
      }),
    );
    await queryRunner.createIndex(
      'control_desk_pick_tasks',
      new TableIndex({
        name: 'idx_cd_tasks_job',
        columnNames: ['job_id'],
      }),
    );
    await queryRunner.createIndex(
      'control_desk_pick_tasks',
      new TableIndex({
        name: 'idx_cd_tasks_warehouse',
        columnNames: ['tenant_id', 'warehouse_id', 'status'],
      }),
    );
    await queryRunner.createIndex(
      'control_desk_pick_tasks',
      new TableIndex({
        name: 'uq_cd_tasks_job_warehouse',
        columnNames: ['job_id', 'warehouse_id'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'control_desk_pick_lines',
      new TableIndex({
        name: 'idx_cd_lines_tenant',
        columnNames: ['tenant_id'],
      }),
    );
    await queryRunner.createIndex(
      'control_desk_pick_lines',
      new TableIndex({
        name: 'idx_cd_lines_task',
        columnNames: ['task_id'],
      }),
    );
    await queryRunner.createIndex(
      'control_desk_pick_lines',
      new TableIndex({
        name: 'idx_cd_lines_detail',
        columnNames: ['sales_order_detail_id'],
      }),
    );

    await queryRunner.createIndex(
      'user_warehouse_assignments',
      new TableIndex({
        name: 'idx_uwa_tenant',
        columnNames: ['tenant_id'],
      }),
    );
    await queryRunner.createIndex(
      'user_warehouse_assignments',
      new TableIndex({
        name: 'idx_uwa_user',
        columnNames: ['tenant_id', 'user_id'],
      }),
    );
    await queryRunner.createIndex(
      'user_warehouse_assignments',
      new TableIndex({
        name: 'uq_uwa_user_warehouse',
        columnNames: ['tenant_id', 'user_id', 'warehouse_id'],
        isUnique: true,
      }),
    );
  }
}
