import { DataSource } from 'typeorm';
import { typeOrmOptions } from '../typeorm.options';
import { TenantModule } from '../../entities/rbac/tenant-module.entity';
import { Permission } from '../../entities/rbac/permission.entity';

async function simulateEndpoint() {
  const dataSource = new DataSource(typeOrmOptions);
  
  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    const tenantId = '54481b63-5516-458d-9bb3-d4e5cb028864';
    
    console.log('\n🔍 Simulating the exact endpoint logic...');
    
    // Simulate RoleService.getEnabledModulesForTenant
    const tenantModuleRepository = dataSource.getRepository(TenantModule);
    const enabledModules = await tenantModuleRepository.find({
      where: { 
        tenant_id: tenantId,
        is_enabled: true 
      },
      relations: ['module'],
    });
    
    console.log(`✅ Found ${enabledModules.length} enabled modules`);
    const enabledModuleIds = enabledModules.map(m => m.module_id);

    // Simulate RoleService.getAllPermissions
    const permissionRepository = dataSource.getRepository(Permission);
    const allPermissions = await permissionRepository.find({
      relations: ['entity_registry'],
      order: { action: 'ASC' },
    });
    
    console.log(`✅ Found ${allPermissions.length} total permissions`);

    // Filter permissions to only those from enabled modules
    const tenantPermissions = allPermissions.filter(permission => {
      if (permission.module_id) {
        return enabledModuleIds.includes(permission.module_id);
      }
      return true;
    });
    
    console.log(`✅ Found ${tenantPermissions.length} permissions for enabled modules`);

    // Group by module
    const groupedByModule = enabledModules.reduce((acc, tenantModule) => {
      const module = tenantModule.module;
      const modulePermissions = tenantPermissions.filter(p => p.module_id === module.id);
      
      if (modulePermissions.length > 0) {
        acc.push({
          id: module.id,
          name: module.name,
          code: module.code,
          permissions: modulePermissions
            .map(p => ({
              id: p.id,
              entity: p.entity_type,
              action: p.action,
              description: p.description,
            }))
            .sort((a, b) => {
              const entityCompare = a.entity.localeCompare(b.entity);
              return entityCompare !== 0 ? entityCompare : a.action.localeCompare(b.action);
            }),
        });
      }
      
      return acc;
    }, [] as any[]);

    // Sort modules by name
    groupedByModule.sort((a, b) => a.name.localeCompare(b.name));

    const result = {
      modules: groupedByModule,
    };
    
    console.log('\n✅ Endpoint simulation successful!');
    console.log(`📊 Result: ${result.modules.length} modules with permissions`);
    result.modules.forEach(m => {
      console.log(`   • ${m.name} (${m.code}): ${m.permissions.length} permissions`);
    });
    
    console.log('\n📄 Sample result structure:');
    console.log(JSON.stringify({
      modules: result.modules.slice(0, 1) // Show just first module as example
    }, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
  } finally {
    await dataSource.destroy();
  }
}

simulateEndpoint();