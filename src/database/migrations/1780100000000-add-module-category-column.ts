import { MigrationInterface, QueryRunner } from 'typeorm';

/** code → { category, sort_order } */
const MODULE_CATEGORIES: Record<string, { category: string; sort_order: number }> = {
  // Ventas
  sales_orders: { category: 'sales', sort_order: 1 },
  pos: { category: 'sales', sort_order: 2 },
  'pos-shifts': { category: 'sales', sort_order: 3 },
  'pos-configuration': { category: 'sales', sort_order: 4 },
  goals: { category: 'sales', sort_order: 5 },
  zona_norte_custom_report: { category: 'sales', sort_order: 6 },
  divino_dashboard: { category: 'sales', sort_order: 7 },

  // Compras
  purchase_orders: { category: 'purchases', sort_order: 1 },
  vendors: { category: 'purchases', sort_order: 2 },

  // Catálogos
  products: { category: 'catalogs', sort_order: 1 },
  categories: { category: 'catalogs', sort_order: 2 },
  subcategories: { category: 'catalogs', sort_order: 3 },
  uom_catalog: { category: 'catalogs', sort_order: 4 },
  warehouses: { category: 'catalogs', sort_order: 5 },
  'exchange-rate': { category: 'catalogs', sort_order: 6 },

  // Operaciones
  inventory: { category: 'operations', sort_order: 1 },

  // CRM
  leads: { category: 'crm', sort_order: 1 },
  customers: { category: 'crm', sort_order: 2 },
  'customer-groups': { category: 'crm', sort_order: 3 },
  customer_activities: { category: 'crm', sort_order: 4 },
  activities: { category: 'crm', sort_order: 5 },
  customer_documents: { category: 'crm', sort_order: 6 },

  // Finanzas
  billing: { category: 'finance', sort_order: 1 },
  electronic_invoicing: { category: 'finance', sort_order: 2 },
  accounting: { category: 'finance', sort_order: 3 },
  payments: { category: 'finance', sort_order: 4 },

  // Inmobiliario
  properties: { category: 'real_estate', sort_order: 1 },
  contracts: { category: 'real_estate', sort_order: 2 },
  contract_documents: { category: 'real_estate', sort_order: 3 },

  // Administración
  users: { category: 'admin', sort_order: 1 },
  roles: { category: 'admin', sort_order: 2 },

  // Configuración
  mailer_configurations: { category: 'settings', sort_order: 1 },
  resend_configuration: { category: 'settings', sort_order: 2 },
  'email-templates': { category: 'settings', sort_order: 3 },
};

export class AddModuleCategoryColumn1780100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE modules
        ADD COLUMN category VARCHAR(50) NULL AFTER description,
        ADD COLUMN sort_order INT NOT NULL DEFAULT 0 AFTER category
    `);

    for (const [code, meta] of Object.entries(MODULE_CATEGORIES)) {
      await queryRunner.query(
        `UPDATE modules SET category = ?, sort_order = ? WHERE code = ?`,
        [meta.category, meta.sort_order, code],
      );
    }

    await queryRunner.query(`
      UPDATE modules
      SET category = 'operations', sort_order = 99
      WHERE category IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE modules
        DROP COLUMN sort_order,
        DROP COLUMN category
    `);
  }
}
