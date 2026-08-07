import { MigrationInterface, QueryRunner } from 'typeorm';

const TENANT_ID = 'a9c67ebf-715f-4cec-9af5-ba233e9f8e05';
const MODULE_CODE = 'warehouse_control';
const ENTITY_CODE = 'WarehouseControl';

/**
 * Estados En Selección / Lista para entrega, campos de corroboración,
 * y módulo Control de almacén solo para la organización indicada.
 */
export class AddWarehouseControlAndSelectionStatuses1785000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`inv_s_sales_orders\`
      MODIFY COLUMN \`general_status\`
      ENUM(
        'Creada',
        'En Selección',
        'Lista para entrega',
        'Surtida',
        'Cancelada',
        'En cola',
        'En Camino'
      )
      NOT NULL
      DEFAULT 'Creada'
    `);

    await queryRunner.query(`
      ALTER TABLE \`inv_s_sales_orders\`
      ADD COLUMN \`requires_selection_assembly\` TINYINT(1) NOT NULL DEFAULT 0
      AFTER \`notes\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`inv_s_sales_orders\`
      ADD COLUMN \`corroborated_by\` VARCHAR(36) NULL
      AFTER \`requires_selection_assembly\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`inv_s_sales_orders\`
      ADD COLUMN \`corroborated_at\` TIMESTAMP NULL
      AFTER \`corroborated_by\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`inv_s_sales_orders\`
      ADD CONSTRAINT \`FK_so_corroborated_by\`
      FOREIGN KEY (\`corroborated_by\`) REFERENCES \`users\`(\`id\`)
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      INSERT INTO modules (id, name, code, description, category, sort_order, created_at)
      SELECT UUID(), 'Control de almacén', '${MODULE_CODE}',
        'Corroboración y picking de órdenes en selección', 'inventory', 20, NOW()
      WHERE NOT EXISTS (SELECT 1 FROM modules WHERE code = '${MODULE_CODE}');
    `);

    await queryRunner.query(`
      INSERT INTO entity_registry (code, name)
      SELECT '${ENTITY_CODE}', 'Control de almacén'
      WHERE NOT EXISTS (
        SELECT 1 FROM entity_registry WHERE code = '${ENTITY_CODE}'
      );
    `);

    await queryRunner.query(`
      INSERT INTO rbac_permissions (
        id, entity_registry_id, module_id, action, description,
        is_system_permission, created_at, updated_at
      )
      SELECT UUID(), er.id, m.id, a.action, a.description, 1, NOW(), NOW()
      FROM entity_registry er
      JOIN modules m ON m.code = '${MODULE_CODE}'
      JOIN (
        SELECT 'ViewMenu' AS action, 'Ver módulo Control de almacén en menú' AS description
        UNION ALL SELECT 'Read', 'Consultar órdenes pendientes de corroboración'
        UNION ALL SELECT 'Update', 'Corroborar / confirmar picking de órdenes'
      ) a
      WHERE er.code = '${ENTITY_CODE}'
        AND NOT EXISTS (
          SELECT 1 FROM rbac_permissions p
          WHERE p.module_id = m.id AND p.action = a.action
        );
    `);

    await queryRunner.query(`
      INSERT INTO tenant_modules (id, tenant_id, module_id, is_enabled, created_at)
      SELECT UUID(), '${TENANT_ID}', m.id, 1, NOW()
      FROM modules m
      WHERE m.code = '${MODULE_CODE}'
        AND EXISTS (SELECT 1 FROM rbac_tenants t WHERE t.id = '${TENANT_ID}')
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

    await queryRunner.query(`DELETE FROM modules WHERE code = '${MODULE_CODE}';`);
    await queryRunner.query(
      `DELETE FROM entity_registry WHERE code = '${ENTITY_CODE}';`,
    );

    await queryRunner.query(`
      UPDATE \`inv_s_sales_orders\`
      SET \`general_status\` = 'Creada'
      WHERE \`general_status\` = 'En Selección'
    `);

    await queryRunner.query(`
      UPDATE \`inv_s_sales_orders\`
      SET \`general_status\` = 'Surtida'
      WHERE \`general_status\` = 'Lista para entrega'
    `);

    await queryRunner.query(`
      ALTER TABLE \`inv_s_sales_orders\`
      DROP FOREIGN KEY \`FK_so_corroborated_by\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`inv_s_sales_orders\`
      DROP COLUMN \`corroborated_at\`,
      DROP COLUMN \`corroborated_by\`,
      DROP COLUMN \`requires_selection_assembly\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`inv_s_sales_orders\`
      MODIFY COLUMN \`general_status\`
      ENUM('Creada', 'Surtida', 'Cancelada', 'En cola', 'En Camino')
      NOT NULL
      DEFAULT 'Creada'
    `);
  }
}
