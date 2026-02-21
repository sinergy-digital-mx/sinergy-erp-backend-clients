import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { RoleService } from '../../api/rbac/services/role.service';
import { TenantContextService } from '../../api/rbac/services/tenant-context.service';

async function testServiceDirectly() {
  try {
    console.log('🚀 Creating NestJS application...');
    const app = await NestFactory.createApplicationContext(AppModule);
    
    console.log('✅ Application created');
    
    const roleService = app.get(RoleService);
    const tenantContextService = app.get(TenantContextService);
    
    console.log('✅ Services obtained');
    
    // Mock the tenant context
    const tenantId = '54481b63-5516-458d-9bb3-d4e5cb028864';
    
    console.log('\n🔍 Testing getEnabledModulesForTenant...');
    try {
      const enabledModules = await roleService.getEnabledModulesForTenant(tenantId);
      console.log(`✅ Found ${enabledModules.length} enabled modules`);
      
      enabledModules.forEach((tm, index) => {
        console.log(`   ${index + 1}. ${tm.module?.name || 'Unknown'} (${tm.module?.code || 'Unknown'})`);
      });
      
    } catch (error) {
      console.error('❌ Error in getEnabledModulesForTenant:', error.message);
      console.error('Stack:', error.stack);
      await app.close();
      return;
    }
    
    console.log('\n🔍 Testing getAllPermissions...');
    try {
      const allPermissions = await roleService.getAllPermissions();
      console.log(`✅ Found ${allPermissions.length} permissions`);
      
      // Show first few permissions
      allPermissions.slice(0, 3).forEach((p, index) => {
        console.log(`   ${index + 1}. ${p.entity_type} - ${p.action}`);
      });
      
    } catch (error) {
      console.error('❌ Error in getAllPermissions:', error.message);
      console.error('Stack:', error.stack);
      await app.close();
      return;
    }
    
    console.log('\n✅ All service methods work correctly!');
    console.log('💡 The issue might be in the controller or authentication.');
    
    await app.close();
    
  } catch (error) {
    console.error('❌ Failed to create application:', error);
    console.error('Stack:', error.stack);
  }
}

testServiceDirectly();