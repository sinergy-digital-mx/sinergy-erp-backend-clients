import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const MODULE_CODE = 'price_updates';
const ENTITY_CODE = 'price_updates';
const ORGANIZATION_ID = 'a9c67ebf-715f-4cec-9af5-ba233e9f8e05';

/** Número y margen en listas de precio, y módulo Actualización de precio para la verdulería. */
export class AddPriceUpdateModule1795800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('product_price_lists');
    if (table && !table.findColumnByName('list_number')) {
      await queryRunner.addColumn(
        'product_price_lists',
        new TableColumn({
          name: 'list_number',
          type: 'int',
          isNullable: true,
        }),
      );
    }
    if (table && !table.findColumnByName('margin_percent')) {
      await queryRunner.addColumn(
        'product_price_lists',
        new TableColumn({
          name: 'margin_percent',
          type: 'decimal',
          precision: 6,
          scale: 2,
          isNullable: true,
        }),
      );
    }

    await queryRunner.query(`
      INSERT INTO modules (id, name, code, description, category, sort_order, created_at)
      SELECT UUID(), 'Actualización de precio', '${MODULE_CODE}',
        'Hoja para actualizar el costo de las últimas compras y los precios de lista.',
        'sales', 8, NOW()
      WHERE NOT EXISTS (SELECT 1 FROM modules WHERE code = '${MODULE_CODE}');
    `);

    await queryRunner.query(`
      INSERT INTO entity_registry (code, name)
      SELECT '${ENTITY_CODE}', 'Actualización de precio'
      WHERE NOT EXISTS (SELECT 1 FROM entity_registry WHERE code = '${ENTITY_CODE}');
    `);

    await queryRunner.query(`
      INSERT INTO rbac_permissions (id, entity_registry_id, module_id, action, description, is_system_permission, created_at, updated_at)
      SELECT UUID(), er.id, m.id, a.action, a.description, 1, NOW(), NOW()
      FROM entity_registry er
      JOIN modules m ON m.code = '${MODULE_CODE}'
      JOIN (
        SELECT 'ViewMenu' AS action, 'Ver Actualización de precio en el menú' AS description
        UNION ALL SELECT 'Read', 'Consultar la hoja de actualización de precio'
        UNION ALL SELECT 'Update', 'Capturar costos y precios en la actualización de precio'
      ) a
      WHERE er.code = '${ENTITY_CODE}'
        AND NOT EXISTS (
          SELECT 1 FROM rbac_permissions p
          WHERE p.module_id = m.id AND p.action = a.action
        );
    `);

    await queryRunner.query(`
      INSERT INTO tenant_modules (id, tenant_id, module_id, is_enabled, created_at)
      SELECT UUID(), '${ORGANIZATION_ID}', m.id, 1, NOW()
      FROM modules m
      WHERE m.code = '${MODULE_CODE}'
        AND EXISTS (SELECT 1 FROM rbac_tenants t WHERE t.id = '${ORGANIZATION_ID}')
        AND NOT EXISTS (
          SELECT 1 FROM tenant_modules tm
          WHERE tm.tenant_id = '${ORGANIZATION_ID}' AND tm.module_id = m.id
        );
    `);

    await queryRunner.query(`
      UPDATE tenant_modules tm
      JOIN modules m ON m.id = tm.module_id
      SET tm.is_enabled = 1
      WHERE tm.tenant_id = '${ORGANIZATION_ID}'
        AND m.code = '${MODULE_CODE}';
    `);

    await queryRunner.query(`
      INSERT INTO rbac_role_permissions (id, role_id, permission_id, created_at)
      SELECT UUID(), r.id, p.id, NOW()
      FROM rbac_roles r
      JOIN rbac_permissions p ON p.module_id = (
        SELECT id FROM modules WHERE code = '${MODULE_CODE}' LIMIT 1
      )
      WHERE r.tenant_id = '${ORGANIZATION_ID}'
        AND (r.name = 'Admin' OR r.is_admin = 1)
        AND NOT EXISTS (
          SELECT 1 FROM rbac_role_permissions rp
          WHERE rp.role_id = r.id AND rp.permission_id = p.id
        );
    `);

    await queryRunner.query(`
      UPDATE users
      SET permissions_version = permissions_version + 1
      WHERE tenant_id = '${ORGANIZATION_ID}';
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
    await queryRunner.query(`DELETE FROM modules WHERE code = '${MODULE_CODE}';`);
    await queryRunner.query(`DELETE FROM entity_registry WHERE code = '${ENTITY_CODE}';`);

    const table = await queryRunner.getTable('product_price_lists');
    if (table?.findColumnByName('margin_percent')) {
      await queryRunner.dropColumn('product_price_lists', 'margin_percent');
    }
    if (table?.findColumnByName('list_number')) {
      await queryRunner.dropColumn('product_price_lists', 'list_number');
    }
  }
}
