const mysql = require('mysql2/promise');
require('dotenv').config();

async function makeUserAdmin() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  const userId = 'ea55c959-7aac-4212-9cbc-cffe17726243';
  const tenantId = '54481b63-5516-458d-9bb3-d4e5cb028864';

  console.log('Making user admin...\n');

  // Get System Administrator role
  const [roles] = await connection.query(`
    SELECT id, name FROM rbac_roles 
    WHERE name = 'System Administrator' AND tenant_id = ?
  `, [tenantId]);

  if (roles.length === 0) {
    console.log('❌ System Administrator role not found');
    await connection.end();
    return;
  }

  const adminRoleId = roles[0].id;
  console.log(`Found role: ${roles[0].name} (${adminRoleId})`);

  // Check if user already has this role
  const [existing] = await connection.query(`
    SELECT * FROM rbac_user_roles 
    WHERE user_id = ? AND role_id = ? AND tenant_id = ?
  `, [userId, adminRoleId, tenantId]);

  if (existing.length > 0) {
    console.log('✅ User already has System Administrator role');
  } else {
    // Assign role
    const { v4: uuidv4 } = require('uuid');
    await connection.query(`
      INSERT INTO rbac_user_roles (id, user_id, role_id, tenant_id, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `, [uuidv4(), userId, adminRoleId, tenantId]);

    console.log('✅ System Administrator role assigned to user');
  }

  // Show user's roles
  const [userRoles] = await connection.query(`
    SELECT r.name, r.description
    FROM rbac_user_roles ur
    INNER JOIN rbac_roles r ON ur.role_id = r.id
    WHERE ur.user_id = ? AND ur.tenant_id = ?
  `, [userId, tenantId]);

  console.log('\nUser roles:');
  console.table(userRoles);

  await connection.end();
}

makeUserAdmin().catch(console.error);
