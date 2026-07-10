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

  const [enabledModules] = await c.query<any[]>(
    `SELECT tm.module_id, m.code, m.name, m.category, m.sort_order
     FROM tenant_modules tm
     JOIN modules m ON m.id = tm.module_id
     WHERE tm.tenant_id = ? AND tm.is_enabled = 1
     ORDER BY m.category, m.sort_order, m.name`,
    [TENANT_ID],
  );

  const [permsByModule] = await c.query<any[]>(
    `SELECT m.code as module_code, m.name as module_name, m.category,
            er.code as entity, p.action, p.id
     FROM rbac_permissions p
     JOIN entity_registry er ON er.id = p.entity_registry_id
     JOIN modules m ON m.id = p.module_id
     JOIN tenant_modules tm ON tm.module_id = m.id AND tm.tenant_id = ? AND tm.is_enabled = 1
     ORDER BY m.category, m.sort_order, m.code, er.code, p.action`,
    [TENANT_ID],
  );

  const byCategory = new Map<string, { modules: Set<string>; permCount: number }>();
  for (const row of permsByModule) {
    const cat = row.category || 'operations';
    if (!byCategory.has(cat)) {
      byCategory.set(cat, { modules: new Set(), permCount: 0 });
    }
    const g = byCategory.get(cat)!;
    g.modules.add(`${row.module_name} (${row.module_code})`);
    g.permCount++;
  }

  console.log('enabled_modules:', enabledModules.length);
  console.log('\nby_category:');
  for (const [cat, data] of [...byCategory.entries()].sort()) {
    console.log(`\n[${cat}] ${data.permCount} permisos`);
    for (const mod of [...data.modules].sort()) {
      console.log(`  - ${mod}`);
    }
  }

  const finance = permsByModule.filter((p) => p.category === 'finance');
  console.log('\nfinance_detail:');
  for (const p of finance) {
    console.log(`  ${p.module_name} | ${p.entity}:${p.action}`);
  }

  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
