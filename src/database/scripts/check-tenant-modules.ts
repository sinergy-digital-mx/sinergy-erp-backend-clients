import { DataSource } from 'typeorm';
import { typeOrmOptions } from '../typeorm.options';

async function checkTenantModules() {
  const dataSource = new DataSource(typeOrmOptions);
  
  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    const tenantId = '54481b63-5516-458d-9bb3-d4e5cb028864';

    // Check if rbac_tenant_modules table exists
    console.log('🔍 Checking if rbac_tenant_modules table exists...');
    try {
      const tenantModuleTableCheck = await dataSource.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
        AND table_name = 'rbac_tenant_modules'
      `);
      
      if (tenantModuleTableCheck[0].count === 0) {
        console.log('❌ rbac_tenant_modules table does not exist');
        return;
      } else {
        console.log('✅ rbac_tenant_modules table exists');
      }
    } catch (error) {
      console.log('❌ Error checking tenant modules table:', error.message);
      return;
    }

    // Check if rbac_modules table exists
    console.log('🔍 Checking if rbac_modules table exists...');
    try {
      const moduleTableCheck = await dataSource.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
        AND table_name = 'rbac_modules'
      `);
      
      if (moduleTableCheck[0].count === 0) {
        console.log('❌ rbac_modules table does not exist');
        return;
      } else {
        console.log('✅ rbac_modules table exists');
      }
    } catch (error) {
      console.log('❌ Error checking modules table:', error.message);
      return;
    }

    // Check tenant modules
    console.log(`\n📋 Checking tenant modules for tenant: ${tenantId}`);
    try {
      const tenantModules = await dataSource.query(`
        SELECT 
          tm.id,
          tm.tenant_id,
          tm.module_id,
          tm.is_enabled,
          m.name as module_name,
          m.code as module_code
        FROM rbac_tenant_modules tm
        LEFT JOIN rbac_modules m ON tm.module_id = m.id
        WHERE tm.tenant_id = ?
        ORDER BY m.name
      `, [tenantId]);

      if (tenantModules.length === 0) {
        console.log('❌ No tenant modules found for this tenant');
        
        // Check if there are any modules at all
        const allModules = await dataSource.query(`
          SELECT id, name, code FROM rbac_modules ORDER BY name
        `);
        
        if (allModules.length === 0) {
          console.log('❌ No modules exist in the system');
        } else {
          console.log(`\n📦 Available modules in system (${allModules.length}):`);
          allModules.forEach((module: any) => {
            console.log(`   • ${module.name} (${module.code}) - ID: ${module.id}`);
          });
          console.log('\n💡 You need to assign modules to this tenant');
        }
      } else {
        console.log(`✅ Found ${tenantModules.length} tenant modules:`);
        tenantModules.forEach((tm: any) => {
          const status = tm.is_enabled ? '✅ Enabled' : '❌ Disabled';
          console.log(`   ${status} ${tm.module_name || 'Unknown'} (${tm.module_code || 'no-code'})`);
        });
      }
    } catch (error) {
      console.log('❌ Error checking tenant modules:', error.message);
    }

    // Check permissions
    console.log('\n🔐 Checking permissions...');
    try {
      const permissionsCount = await dataSource.query(`
        SELECT COUNT(*) as count FROM rbac_permissions
      `);
      console.log(`📊 Total permissions in system: ${permissionsCount[0].count}`);

      if (permissionsCount[0].count > 0) {
        const samplePermissions = await dataSource.query(`
          SELECT id, action, description, module_id
          FROM rbac_permissions
          LIMIT 5
        `);
        
        console.log('📋 Sample permissions:');
        samplePermissions.forEach((perm: any) => {
          console.log(`   • ${perm.action} - ${perm.description || 'No description'} (Module: ${perm.module_id || 'None'})`);
        });
      }
    } catch (error) {
      console.log('❌ Error checking permissions:', error.message);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await dataSource.destroy();
  }
}

checkTenantModules();