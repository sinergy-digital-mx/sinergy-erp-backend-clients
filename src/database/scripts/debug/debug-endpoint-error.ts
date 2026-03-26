import { DataSource } from 'typeorm';
import { typeOrmOptions } from '../typeorm.options';
import { TenantModule } from '../../entities/rbac/tenant-module.entity';
import { Permission } from '../../entities/rbac/permission.entity';

async function debugEndpointError() {
  const dataSource = new DataSource(typeOrmOptions);
  
  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    const tenantId = '54481b63-5516-458d-9bb3-d4e5cb028864';
    
    console.log('\n🔍 Step 1: Testing getEnabledModulesForTenant...');
    
    const tenantModuleRepository = dataSource.getRepository(TenantModule);
    
    try {
      // First try without relations
      console.log('   Testing without relations...');
      const enabledModulesNoRelations = await tenantModuleRepository.find({
        where: { 
          tenant_id: tenantId,
          is_enabled: true 
        }
      });
      
      console.log(`   ✅ Found ${enabledModulesNoRelations.length} enabled modules (no relations)`);
      
      // Now try with relations
      console.log('   Testing with relations...');
      const enabledModules = await tenantModuleRepository.find({
        where: { 
          tenant_id: tenantId,
          is_enabled: true 
        },
        relations: ['module'],
      });
      
      console.log(`   ✅ Found ${enabledModules.length} enabled modules (with relations)`);
      
      // Check if modules are loaded
      enabledModules.forEach((tm, index) => {
        console.log(`   Module ${index + 1}: ID=${tm.module_id}, Loaded=${tm.module ? 'YES' : 'NO'}`);
        if (tm.module) {
          console.log(`     Name: ${tm.module.name}, Code: ${tm.module.code}`);
        }
      });
      
      const enabledModuleIds = enabledModules.map(m => m.module_id);
      console.log(`   Module IDs: ${enabledModuleIds.join(', ')}`);
      
    } catch (error) {
      console.error('   ❌ Error in getEnabledModulesForTenant:', error.message);
      console.error('   Stack:', error.stack);
      return;
    }

    console.log('\n🔍 Step 2: Testing getAllPermissions...');
    
    const permissionRepository = dataSource.getRepository(Permission);
    
    try {
      const allPermissions = await permissionRepository.find({
        relations: ['entity_registry'],
        order: { action: 'ASC' },
      });
      
      console.log(`   ✅ Found ${allPermissions.length} total permissions`);
      
      // Check a few permissions
      console.log('   Sample permissions:');
      allPermissions.slice(0, 3).forEach((p, index) => {
        console.log(`     ${index + 1}. ${p.entity_type} - ${p.action} (Module: ${p.module_id || 'None'})`);
      });
      
    } catch (error) {
      console.error('   ❌ Error in getAllPermissions:', error.message);
      console.error('   Stack:', error.stack);
      return;
    }

    console.log('\n✅ All steps completed successfully!');
    console.log('💡 The endpoint should work. Check server logs for the actual error.');

  } catch (error) {
    console.error('❌ Database Error:', error);
    console.error('Stack:', error.stack);
  } finally {
    await dataSource.destroy();
  }
}

debugEndpointError();