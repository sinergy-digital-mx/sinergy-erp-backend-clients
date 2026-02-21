import { DataSource } from 'typeorm';
import { typeOrmOptions } from '../typeorm.options';
import { TenantModule } from '../../entities/rbac/tenant-module.entity';
import { Permission } from '../../entities/rbac/permission.entity';

async function debugAvailablePermissions() {
  const dataSource = new DataSource(typeOrmOptions);
  
  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    const tenantId = '54481b63-5516-458d-9bb3-d4e5cb028864';
    
    // Test the exact same query that the service uses
    console.log('\n🔍 Testing getEnabledModulesForTenant...');
    
    const tenantModuleRepository = dataSource.getRepository(TenantModule);
    
    try {
      const enabledModules = await tenantModuleRepository.find({
        where: { 
          tenant_id: tenantId,
          is_enabled: true 
        },
        relations: ['module'],
      });
      
      console.log(`✅ Found ${enabledModules.length} enabled modules:`);
      enabledModules.forEach((tm) => {
        console.log(`   • Module ID: ${tm.module_id}, Module: ${tm.module ? tm.module.name : 'NULL'}`);
      });
      
      const enabledModuleIds = enabledModules.map(m => m.module_id);
      console.log(`📋 Module IDs: ${enabledModuleIds.join(', ')}`);
      
      // Test getAllPermissions
      console.log('\n🔍 Testing getAllPermissions...');
      const permissionRepository = dataSource.getRepository(Permission);
      
      const allPermissions = await permissionRepository.find({
        relations: ['entity_registry'],
        order: { action: 'ASC' },
      });
      
      console.log(`✅ Found ${allPermissions.length} total permissions`);
      
      // Filter permissions like the endpoint does
      const tenantPermissions = allPermissions.filter(permission => {
        if (permission.module_id) {
          return enabledModuleIds.includes(permission.module_id);
        }
        return true;
      });
      
      console.log(`✅ Found ${tenantPermissions.length} permissions for enabled modules`);
      
      // Group by module like the endpoint does
      const groupedByModule = enabledModules.reduce((acc, tenantModule) => {
        const module = tenantModule.module;
        if (!module) {
          console.log(`⚠️  TenantModule ${tenantModule.id} has no module relation`);
          return acc;
        }
        
        const modulePermissions = tenantPermissions.filter(p => p.module_id === module.id);
        
        if (modulePermissions.length > 0) {
          acc.push({
            id: module.id,
            name: module.name,
            code: module.code,
            permissions: modulePermissions.map(p => ({
              id: p.id,
              entity: p.entity_type,
              action: p.action,
              description: p.description,
            })),
          });
        }
        
        return acc;
      }, [] as any[]);
      
      console.log(`✅ Grouped into ${groupedByModule.length} modules with permissions`);
      groupedByModule.forEach(m => {
        console.log(`   • ${m.name}: ${m.permissions.length} permissions`);
      });
      
    } catch (error) {
      console.error('❌ Error in service simulation:', error);
      console.error('Stack:', error.stack);
    }

  } catch (error) {
    console.error('❌ Database Error:', error);
  } finally {
    await dataSource.destroy();
  }
}

debugAvailablePermissions();