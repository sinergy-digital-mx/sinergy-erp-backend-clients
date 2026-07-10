import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

const MODULE_CODE = 'global_discounts';
const ENTITY_CODE = 'GlobalDiscount';
const TENANT_ID = 'afff1757-dbcf-4715-a756-6b22bb2c59d5';

export class CreateGlobalDiscountsTableAndModule1780600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'global_discounts',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
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
            length: '120',
            isNullable: false,
          },
          {
            name: 'discount_type',
            type: 'enum',
            enum: ['percentage', 'fixed'],
            default: "'percentage'",
          },
          {
            name: 'value',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'valid_from',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'valid_to',
            type: 'date',
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

    await queryRunner.createForeignKey(
      'global_discounts',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedTableName: 'rbac_tenants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'global_discounts',
      new TableIndex({
        name: 'global_discount_tenant_index',
        columnNames: ['tenant_id'],
      }),
    );

    await queryRunner.createIndex(
      'global_discounts',
      new TableIndex({
        name: 'UQ_global_discounts_tenant_name',
        columnNames: ['tenant_id', 'name'],
        isUnique: true,
      }),
    );

    await queryRunner.query(`
      INSERT INTO modules (id, name, code, description, category, sort_order, created_at)
      SELECT UUID(), 'Descuentos globales', '${MODULE_CODE}',
        'Descuentos generales aplicables a toda la orden de venta', 'sales', 8, NOW()
      WHERE NOT EXISTS (SELECT 1 FROM modules WHERE code = '${MODULE_CODE}');
    `);

    await queryRunner.query(`
      INSERT INTO entity_registry (code, name)
      SELECT '${ENTITY_CODE}', 'Global Discounts'
      WHERE NOT EXISTS (SELECT 1 FROM entity_registry WHERE code = '${ENTITY_CODE}');
    `);

    await queryRunner.query(`
      INSERT INTO rbac_permissions (id, entity_registry_id, module_id, action, description, is_system_permission, created_at, updated_at)
      SELECT UUID(), er.id, m.id, a.action, a.description, 1, NOW(), NOW()
      FROM entity_registry er
      JOIN modules m ON m.code = '${MODULE_CODE}'
      JOIN (
        SELECT 'ViewMenu' AS action, 'Show Global Discounts module in menu' AS description
        UNION ALL SELECT 'Read', 'Read global discounts'
        UNION ALL SELECT 'Create', 'Create global discounts'
        UNION ALL SELECT 'Update', 'Update global discounts'
        UNION ALL SELECT 'Delete', 'Delete global discounts'
      ) a
      WHERE er.code = '${ENTITY_CODE}'
        AND NOT EXISTS (
          SELECT 1 FROM rbac_permissions p
          WHERE p.entity_registry_id = er.id AND p.module_id = m.id AND p.action = a.action
        );
    `);

    await queryRunner.query(`
      INSERT INTO tenant_modules (id, tenant_id, module_id, is_enabled, created_at)
      SELECT UUID(), '${TENANT_ID}', m.id, 1, NOW()
      FROM modules m
      WHERE m.code = '${MODULE_CODE}'
        AND NOT EXISTS (
          SELECT 1 FROM tenant_modules tm
          WHERE tm.tenant_id = '${TENANT_ID}' AND tm.module_id = m.id
        );
    `);

    await queryRunner.query(`
      INSERT INTO rbac_role_permissions (id, role_id, permission_id, created_at)
      SELECT UUID(), r.id, p.id, NOW()
      FROM rbac_roles r
      JOIN rbac_permissions p ON p.module_id = (
        SELECT id FROM modules WHERE code = '${MODULE_CODE}' LIMIT 1
      )
      WHERE r.tenant_id = '${TENANT_ID}'
        AND (r.name = 'Admin' OR r.is_admin = 1)
        AND NOT EXISTS (
          SELECT 1 FROM rbac_role_permissions rp
          WHERE rp.role_id = r.id AND rp.permission_id = p.id
        );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE rp FROM rbac_role_permissions rp
      INNER JOIN rbac_permissions p ON p.id = rp.permission_id
      INNER JOIN modules m ON m.id = p.module_id
      WHERE m.code = '${MODULE_CODE}';
    `);

    await queryRunner.query(`
      DELETE FROM tenant_modules
      WHERE module_id = (SELECT id FROM modules WHERE code = '${MODULE_CODE}' LIMIT 1);
    `);

    await queryRunner.query(`
      DELETE p FROM rbac_permissions p
      INNER JOIN modules m ON m.id = p.module_id
      WHERE m.code = '${MODULE_CODE}';
    `);

    await queryRunner.query(`DELETE FROM entity_registry WHERE code = '${ENTITY_CODE}'`);
    await queryRunner.query(`DELETE FROM modules WHERE code = '${MODULE_CODE}'`);
    await queryRunner.dropTable('global_discounts', true);
  }
}
