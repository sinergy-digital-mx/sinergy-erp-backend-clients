import { DataSource } from 'typeorm';
import { RBACTenant } from '../../entities/rbac/tenant.entity';
import { typeOrmOptions } from '../typeorm.options';

async function listTenants() {
    console.log('🚀 Listing tenants...');
    
    const dataSource = new DataSource(typeOrmOptions);
    await dataSource.initialize();
    console.log('✅ Database connection established');

    try {
        const tenantRepo = dataSource.getRepository(RBACTenant);
        const tenants = await tenantRepo.find();
        
        console.log(`📊 Found ${tenants.length} tenants:`);
        tenants.forEach(tenant => {
            console.log(`   - ID: ${tenant.id}`);
            console.log(`     Name: ${tenant.name}`);
            console.log(`     Subdomain: ${tenant.subdomain}`);
            console.log(`     Active: ${tenant.is_active}`);
            console.log('');
        });
        
    } catch (error) {
        console.error('❌ Error listing tenants:', error);
    } finally {
        await dataSource.destroy();
    }
}

listTenants();