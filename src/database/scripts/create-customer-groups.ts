import { AppDataSource } from '../data-source';
import { CustomerGroup } from '../../entities/customers/customer-group.entity';
import { RBACTenant } from '../../entities/rbac/tenant.entity';

async function createCustomerGroups() {
  try {
    await AppDataSource.initialize();

    // Get the first tenant (or you can specify a tenant ID)
    const tenant = await AppDataSource.getRepository(RBACTenant).findOne({
      where: {},
    });

    if (!tenant) {
      console.log('No tenant found');
      process.exit(1);
    }

    console.log(`Creating customer groups for tenant: ${tenant.name}`);

    const groupRepo = AppDataSource.getRepository(CustomerGroup);

    const groups = [
      {
        name: 'Divino Living',
        description: 'Premium residential development with luxury amenities',
      },
      {
        name: 'Campestre',
        description: 'Rural and countryside residential community',
      },
      {
        name: 'Costa Azul',
        description: 'Beachfront and coastal properties',
      },
      {
        name: 'Centro Comercial',
        description: 'Commercial and business district',
      },
      {
        name: 'Residencial Moderna',
        description: 'Modern residential complex with contemporary design',
      },
    ];

    for (const groupData of groups) {
      const group = groupRepo.create({
        tenant_id: tenant.id,
        name: groupData.name,
        description: groupData.description,
      });

      const saved = await groupRepo.save(group);
      console.log(`✓ Created group: ${saved.name} (${saved.id})`);
    }

    console.log('\n✅ Successfully created 5 customer groups');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createCustomerGroups();
