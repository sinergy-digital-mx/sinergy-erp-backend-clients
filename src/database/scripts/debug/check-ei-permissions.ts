import 'dotenv/config';
import mysql from 'mysql2/promise';

const TENANT_ID = 'afff1757-dbcf-4715-a756-6b22bb2c59d5';

async function main() {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  const [tm] = await c.query<any[]>(
    `SELECT tm.is_enabled, m.code, m.name, m.id as module_id
     FROM tenant_modules tm
     JOIN modules m ON m.id = tm.module_id
     WHERE tm.tenant_id = ? AND m.code = 'electronic_invoicing'`,
    [TENANT_ID],
  );

  const [perms] = await c.query<any[]>(
    `SELECT er.code as entity, p.action, p.id
     FROM rbac_permissions p
     JOIN entity_registry er ON er.id = p.entity_registry_id
     JOIN modules m ON m.id = p.module_id
     WHERE m.code = 'electronic_invoicing'
     ORDER BY er.code, p.action`,
  );

  const [adminRole] = await c.query<any[]>(
    `SELECT r.id, r.name FROM rbac_roles r WHERE r.tenant_id = ? AND LOWER(r.name) LIKE '%admin%' LIMIT 5`,
    [TENANT_ID],
  );

  const [rolePerms] = await c.query<any[]>(
    `SELECT r.name as role, er.code as entity, p.action
     FROM rbac_role_permissions rp
     JOIN rbac_roles r ON r.id = rp.role_id
     JOIN rbac_permissions p ON p.id = rp.permission_id
     JOIN entity_registry er ON er.id = p.entity_registry_id
     JOIN modules m ON m.id = p.module_id
     WHERE r.tenant_id = ? AND m.code = 'electronic_invoicing'
     ORDER BY r.name, er.code, p.action`,
    [TENANT_ID],
  );

  console.log('tenant_module:', JSON.stringify(tm, null, 2));
  console.log('permissions:', JSON.stringify(perms, null, 2));
  console.log('admin_roles:', JSON.stringify(adminRole, null, 2));
  console.log('role_permissions:', JSON.stringify(rolePerms, null, 2));

  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
