import { DataSource } from 'typeorm';
import { typeOrmOptions } from '../typeorm.options';

async function checkUsersTable() {
  const dataSource = new DataSource(typeOrmOptions);
  
  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    // Check users table structure
    console.log('\n🔍 Checking users table structure...');
    const columns = await dataSource.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
      ORDER BY ORDINAL_POSITION
    `);

    console.log('📋 Users table columns:');
    columns.forEach((col: any) => {
      console.log(`   • ${col.COLUMN_NAME} (${col.DATA_TYPE}) - Nullable: ${col.IS_NULLABLE}`);
    });

    // Find users with 'rodolfo' in any text field
    console.log('\n🔍 Looking for Rodolfo Rodriguez...');
    const users = await dataSource.query(`
      SELECT * FROM users 
      WHERE email LIKE '%rodolfo%' OR first_name LIKE '%rodolfo%' OR last_name LIKE '%rodriguez%'
      LIMIT 5
    `);

    console.log(`📊 Found ${users.length} users:`);
    users.forEach((user: any) => {
      console.log(`   • ID: ${user.id}`);
      console.log(`     Email: ${user.email}`);
      console.log(`     Name: ${user.first_name} ${user.last_name}`);
      console.log(`     Status: ${user.status_id}`);
      console.log('');
    });

    if (users.length > 0) {
      const rodolfo = users[0];
      
      // Check his roles
      console.log(`🔍 Checking roles for user ${rodolfo.id}...`);
      const userRoles = await dataSource.query(`
        SELECT ur.*, r.name as role_name, r.is_admin
        FROM rbac_user_roles ur
        JOIN rbac_roles r ON ur.role_id = r.id
        WHERE ur.user_id = ?
      `, [rodolfo.id]);

      console.log(`🎭 User has ${userRoles.length} roles:`);
      userRoles.forEach((role: any) => {
        console.log(`   • ${role.role_name} (Admin: ${role.is_admin}) - Tenant: ${role.tenant_id}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await dataSource.destroy();
  }
}

checkUsersTable();