import 'dotenv/config';
import mysql from 'mysql2/promise';

const TENANT_ID = 'afff1757-dbcf-4715-a756-6b22bb2c59d5';
const ADMIN_ROLE_ID = '1828750a-6c20-4926-a3db-e683d1a2c7ac';

async function main() {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  const [enabledModules] = await c.query<any[]>(
    `SELECT tm.module_id, m.id, m.code, m.name, m.category, m.sort_order
     FROM tenant_modules tm
     JOIN modules m ON m.id = tm.module_id
     WHERE tm.tenant_id = ? AND tm.is_enabled = 1`,
    [TENANT_ID],
  );

  const enabledModuleIds = enabledModules.map((m) => m.module_id);

  const [allPerms] = await c.query<any[]>(
    `SELECT p.id, p.module_id, p.action, er.code as entity_type, p.description
     FROM rbac_permissions p
     JOIN entity_registry er ON er.id = p.entity_registry_id`,
  );

  const tenantPermissions = allPerms.filter(
    (p) => !p.module_id || enabledModuleIds.includes(p.module_id),
  );

  const [rolePerms] = await c.query<any[]>(
    `SELECT permission_id FROM rbac_role_permissions WHERE role_id = ?`,
    [ADMIN_ROLE_ID],
  );
  const assigned = new Set(rolePerms.map((r) => r.permission_id));

  const grouped = enabledModules
    .map((tm) => {
      const modulePerms = tenantPermissions.filter((p) => p.module_id === tm.module_id);
      if (!modulePerms.length) return null;
      return {
        code: tm.code,
        name: tm.name,
        category: tm.category,
        permissions: modulePerms.map((p) => ({
          entity: p.entity_type,
          action: p.action,
          assigned: assigned.has(p.id),
        })),
      };
    })
    .filter(Boolean);

  const finance = grouped.filter((m: any) => m.category === 'finance');
  const billing = grouped.find((m: any) => m.code === 'billing');

  console.log('total_tenant_permissions:', tenantPermissions.length);
  console.log('admin_assigned:', assigned.size);
  console.log('\nfinance_modules:', JSON.stringify(finance, null, 2));
  console.log('\nbilling_module:', JSON.stringify(billing, null, 2));

  const fiscalAssigned = billing?.permissions?.filter((p: any) => p.entity === 'FiscalConfiguration');
  console.log('\nFiscalConfiguration_assigned:', JSON.stringify(fiscalAssigned, null, 2));

  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
