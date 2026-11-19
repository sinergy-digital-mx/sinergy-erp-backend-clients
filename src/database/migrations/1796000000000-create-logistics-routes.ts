import { MigrationInterface, QueryRunner } from 'typeorm';

/** Rutas de reparto, ruta del cliente y envío condicional en la orden. */
export class CreateLogisticsRoutes1796000000000 implements MigrationInterface {
  name = 'CreateLogisticsRoutes1796000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const routes = await queryRunner.getTable('logistics_routes');
    if (!routes) {
      await queryRunner.query(`
        CREATE TABLE logistics_routes (
          id varchar(36) NOT NULL DEFAULT (UUID()),
          tenant_id varchar(36) NOT NULL,
          name varchar(120) NOT NULL,
          code varchar(40) NOT NULL,
          description varchar(255) NULL,
          is_active tinyint NOT NULL DEFAULT 1,
          created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY uq_logistics_routes_tenant_code (tenant_id, code),
          KEY idx_logistics_routes_tenant (tenant_id, is_active),
          CONSTRAINT fk_logistics_routes_tenant FOREIGN KEY (tenant_id) REFERENCES rbac_tenants (id) ON DELETE CASCADE
        )
      `);
    }

    const customers = await queryRunner.getTable('customers');
    if (customers && !customers.findColumnByName('default_route_id')) {
      await queryRunner.query(`
        ALTER TABLE customers
        ADD COLUMN default_route_id varchar(36) NULL,
        ADD CONSTRAINT fk_customers_default_route
          FOREIGN KEY (default_route_id) REFERENCES logistics_routes (id) ON DELETE SET NULL
      `);
    }

    const orders = await queryRunner.getTable('inv_s_sales_orders');
    if (orders && !orders.findColumnByName('route_id')) {
      await queryRunner.query(`
        ALTER TABLE inv_s_sales_orders
        ADD COLUMN route_id varchar(36) NULL,
        ADD COLUMN estimated_delivery_date date NULL,
        ADD COLUMN requires_shipping tinyint NULL,
        ADD CONSTRAINT fk_sales_orders_route
          FOREIGN KEY (route_id) REFERENCES logistics_routes (id) ON DELETE SET NULL
      `);
    }

    await queryRunner.query(`
      INSERT INTO modules (id, name, code, description, category, sort_order, created_at)
      SELECT UUID(), 'Rutas', 'logistics_routes',
        'Catálogo de rutas de reparto', 'logistics', 40, NOW()
      WHERE NOT EXISTS (SELECT 1 FROM modules WHERE code = 'logistics_routes');
    `);
    await queryRunner.query(`
      INSERT INTO entity_registry (code, name)
      SELECT 'Route', 'Rutas'
      WHERE NOT EXISTS (SELECT 1 FROM entity_registry WHERE code = 'Route');
    `);
    await queryRunner.query(`
      INSERT INTO rbac_permissions (id, entity_registry_id, module_id, action, description, is_system_permission, created_at, updated_at)
      SELECT UUID(), er.id, m.id, a.action, a.description, 1, NOW(), NOW()
      FROM entity_registry er
      JOIN modules m ON m.code = 'logistics_routes'
      JOIN (
        SELECT 'ViewMenu' AS action, 'Ver el catálogo de rutas' AS description
        UNION ALL SELECT 'Create', 'Crear rutas'
        UNION ALL SELECT 'Read', 'Consultar rutas'
        UNION ALL SELECT 'Update', 'Actualizar rutas'
        UNION ALL SELECT 'Delete', 'Desactivar rutas'
      ) a
      WHERE er.code = 'Route'
        AND NOT EXISTS (
          SELECT 1 FROM rbac_permissions p
          WHERE p.module_id = m.id AND p.action = a.action
        );
    `);
    await queryRunner.query(`
      INSERT INTO tenant_modules (id, tenant_id, module_id, is_enabled, created_at)
      SELECT UUID(), t.id, m.id, 0, NOW()
      FROM rbac_tenants t
      JOIN modules m ON m.code = 'logistics_routes'
      WHERE NOT EXISTS (
        SELECT 1 FROM tenant_modules tm
        WHERE tm.tenant_id = t.id AND tm.module_id = m.id
      );
    `);
    await queryRunner.query(`
      INSERT INTO rbac_role_permissions (id, role_id, permission_id, created_at)
      SELECT UUID(), r.id, p.id, NOW()
      FROM rbac_roles r
      JOIN rbac_permissions p ON p.module_id = (SELECT id FROM modules WHERE code = 'logistics_routes' LIMIT 1)
      WHERE r.name = 'Admin'
        AND NOT EXISTS (
          SELECT 1 FROM rbac_role_permissions rp
          WHERE rp.role_id = r.id AND rp.permission_id = p.id
        );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const orders = await queryRunner.getTable('inv_s_sales_orders');
    if (orders?.findColumnByName('route_id')) {
      await queryRunner.query(`
        ALTER TABLE inv_s_sales_orders
        DROP FOREIGN KEY fk_sales_orders_route,
        DROP COLUMN route_id,
        DROP COLUMN estimated_delivery_date,
        DROP COLUMN requires_shipping
      `);
    }
    const customers = await queryRunner.getTable('customers');
    if (customers?.findColumnByName('default_route_id')) {
      await queryRunner.query(`
        ALTER TABLE customers
        DROP FOREIGN KEY fk_customers_default_route,
        DROP COLUMN default_route_id
      `);
    }
    await queryRunner.query(`DROP TABLE IF EXISTS logistics_routes`);
  }
}
