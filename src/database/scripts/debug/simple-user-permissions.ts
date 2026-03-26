import { DataSource } from 'typeorm';
import { typeOrmOptions } from '../typeorm.options';

async function checkUserPermissions(userId?: string) {
  const dataSource = new DataSource(typeOrmOptions);
  
  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    // If no userId provided, show all users
    if (!userId) {
      console.log('📋 Available users:');
      const users = await dataSource.query(`
        SELECT id, email, first_name, last_name 
        FROM users 
        WHERE tenant_id = '54481b63-5516-458d-9bb3-d4e5cb028864'
        LIMIT 10
      `);
      
      users.forEach((user: any) => {
        console.log(`   • ${user.email} (${user.first_name} ${user.last_name}) - ID: ${user.id}`);
      });
      
      console.log('\n💡 Run again with: npx ts-node simple-user-permissions.ts USER_ID');
      return;
    }

    // Get user info
    const userQuery = `
      SELECT u.id, u.email, u.first_name, u.last_name, u.tenant_id
      FROM users u
      WHERE u.id = ?
    `;
    const users = await dataSource.query(userQuery, [userId]);
    
    if (users.length === 0) {
      console.log('❌ User not found');
      return;
    }

    const user = users[0];
    console.log(`👤 User: ${user.email} (${user.first_name} ${user.last_name})`);
    console.log(`🏢 Tenant: ${user.tenant_id}`);

    // Get user roles
    const rolesQuery = `
      SELECT 
        r.id as role_id,
        r.name as role_name,
        r.description as role_description
      FROM rbac_user_roles ur
      JOIN rbac_roles r ON ur.role_id = r.id
      WHERE ur.user_id = ?
      ORDER BY r.name
    `;

    const roles = await dataSource.query(rolesQuery, [userId]);

    if (roles.length === 0) {
      console.log('❌ User has no roles assigned');
      return;
    }

    console.log(`\n🎭 User has ${roles.length} roles:`);
    roles.forEach((role: any) => {
      console.log(`   • ${role.role_name} (${role.role_description || 'No description'})`);
    });

    // Get permissions for each role
    for (const role of roles) {
      const permissionsQuery = `
        SELECT 
          p.id,
          p.action,
          p.description
        FROM rbac_role_permissions rp
        JOIN rbac_permissions p ON rp.permission_id = p.id
        WHERE rp.role_id = ?
        ORDER BY p.action
      `;

      const permissions = await dataSource.query(permissionsQuery, [role.role_id]);

      console.log(`\n📋 Role "${role.role_name}" has ${permissions.length} permissions:`);
      
      if (permissions.length === 0) {
        console.log('   ❌ No permissions assigned to this role');
      } else {
        permissions.forEach((perm: any, index: number) => {
          const description = perm.description ? ` - ${perm.description}` : '';
          console.log(`   ${index + 1}. ${perm.action}${description}`);
        });

        // Check for Lead permissions specifically
        const leadPermissions = permissions.filter((p: any) => 
          p.action.includes('Lead') || p.description?.includes('lead')
        );

        if (leadPermissions.length > 0) {
          console.log(`   🎯 Lead-related permissions: ${leadPermissions.length}`);
          leadPermissions.forEach((perm: any) => {
            console.log(`      ✓ ${perm.action} - ${perm.description || 'No description'}`);
          });
        } else {
          console.log('   ⚠️  No Lead permissions found in this role');
        }
      }
    }

    // Summary
    const totalPermissions = await dataSource.query(`
      SELECT COUNT(DISTINCT p.id) as total
      FROM rbac_user_roles ur
      JOIN rbac_role_permissions rp ON ur.role_id = rp.role_id
      JOIN rbac_permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = ?
    `, [userId]);

    console.log(`\n📊 SUMMARY:`);
    console.log(`   • Total Roles: ${roles.length}`);
    console.log(`   • Total Unique Permissions: ${totalPermissions[0].total}`);

  } catch (error) {
    console.error('❌ Error checking user permissions:', error);
  } finally {
    await dataSource.destroy();
  }
}

// Get userId from command line argument
const userId = process.argv[2];
checkUserPermissions(userId);