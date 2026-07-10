import 'dotenv/config';
import mysql from 'mysql2/promise';

const TENANT_ID = process.env.TENANT_ID || 'afff1757-dbcf-4715-a756-6b22bb2c59d5';

async function main() {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  const [tm] = await c.query<any[]>(
    `SELECT tm.is_enabled, m.code, m.name, m.category, m.sort_order, m.id as module_id
     FROM tenant_modules tm
     JOIN modules m ON m.id = tm.module_id
     WHERE tm.tenant_id = ? AND m.code IN ('billing', 'electronic_invoicing')`,
    [TENANT_ID],
  );

  const [billingPerms] = await c.query<any[]>(
    `SELECT er.code as entity, p.action, p.id, m.code as module
     FROM rbac_permissions p
     JOIN entity_registry er ON er.id = p.entity_registry_id
     JOIN modules m ON m.id = p.module_id
     WHERE m.code = 'billing'
     ORDER BY er.code, p.action`,
  );

  const [rolePerms] = await c.query<any[]>(
    `SELECT r.name as role, er.code as entity, p.action
     FROM rbac_role_permissions rp
     JOIN rbac_roles r ON r.id = rp.role_id
     JOIN rbac_permissions p ON p.id = rp.permission_id
     JOIN entity_registry er ON er.id = p.entity_registry_id
     JOIN modules m ON m.id = p.module_id
     WHERE r.tenant_id = ? AND m.code = 'billing'
     ORDER BY r.name, er.code, p.action`,
    [TENANT_ID],
  );

  const [roleSummary] = await c.query<any[]>(
    `SELECT r.name,
            COUNT(rp.id) as total_perms,
            SUM(CASE WHEN m.code = 'billing' THEN 1 ELSE 0 END) as billing_perms
     FROM rbac_roles r
     LEFT JOIN rbac_role_permissions rp ON rp.role_id = r.id
     LEFT JOIN rbac_permissions p ON p.id = rp.permission_id
     LEFT JOIN modules m ON m.id = p.module_id
     WHERE r.tenant_id = ?
     GROUP BY r.id, r.name
     ORDER BY r.name`,
    [TENANT_ID],
  );

  console.log('tenant_id:', TENANT_ID);
  console.log('tenant_modules:', JSON.stringify(tm, null, 2));
  console.log('billing_permissions:', JSON.stringify(billingPerms, null, 2));
  console.log('billing_role_permissions:', JSON.stringify(rolePerms, null, 2));
  console.log('role_summary:', JSON.stringify(roleSummary, null, 2));

  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
