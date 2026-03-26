import { AppDataSource } from '../data-source';
import { Customer } from 'src/entities/customers/customer.entity';
import { CustomerStatus } from 'src/entities/customers/customer-status.entity';
import { CustomerGroup } from 'src/entities/customers/customer-group.entity';

async function createSampleCustomers() {
    try {
        await AppDataSource.initialize();

        const customerRepo = AppDataSource.getRepository(Customer);
        const statusRepo = AppDataSource.getRepository(CustomerStatus);
        const groupRepo = AppDataSource.getRepository(CustomerGroup);

        const tenantId = '54481b63-5516-458d-9bb3-d4e5cb028864';

        // Get or create default status
        let status = await statusRepo.findOne({ where: { code: 'active' } });
        if (!status) {
            status = await statusRepo.findOne({});
        }

        // Get or create customer groups
        let enterpriseGroup = await groupRepo.findOne({
            where: { tenant_id: tenantId, name: 'Enterprise Clients' },
        });
        if (!enterpriseGroup) {
            enterpriseGroup = groupRepo.create({
                tenant_id: tenantId,
                name: 'Enterprise Clients',
                description: 'High-value enterprise customers',
            });
            await groupRepo.save(enterpriseGroup);
        }

        let smesGroup = await groupRepo.findOne({
            where: { tenant_id: tenantId, name: 'SMEs' },
        });
        if (!smesGroup) {
            smesGroup = groupRepo.create({
                tenant_id: tenantId,
                name: 'SMEs',
                description: 'Small and medium-sized enterprises',
            });
            await groupRepo.save(smesGroup);
        }

        const sampleCustomers = [
            {
                name: 'John',
                lastname: 'Smith',
                email: 'john.smith@enterprise.com',
                phone: '+1-555-0101',
                company_name: 'Enterprise Corp',
                website: 'https://enterprise.com',
                group_id: enterpriseGroup.id,
            },
            {
                name: 'Sarah',
                lastname: 'Johnson',
                email: 'sarah.johnson@techcorp.com',
                phone: '+1-555-0102',
                company_name: 'Tech Corp',
                website: 'https://techcorp.com',
                group_id: enterpriseGroup.id,
            },
            {
                name: 'Michael',
                lastname: 'Brown',
                email: 'michael.brown@innovate.com',
                phone: '+1-555-0103',
                company_name: 'Innovate Solutions',
                website: 'https://innovate.com',
                group_id: enterpriseGroup.id,
            },
            {
                name: 'Emily',
                lastname: 'Davis',
                email: 'emily.davis@globaltech.com',
                phone: '+1-555-0104',
                company_name: 'Global Tech',
                website: 'https://globaltech.com',
                group_id: enterpriseGroup.id,
            },
            {
                name: 'David',
                lastname: 'Wilson',
                email: 'david.wilson@smartbiz.com',
                phone: '+1-555-0105',
                company_name: 'Smart Business',
                website: 'https://smartbiz.com',
                group_id: smesGroup.id,
            },
            {
                name: 'Jessica',
                lastname: 'Martinez',
                email: 'jessica.martinez@startup.io',
                phone: '+1-555-0106',
                company_name: 'Startup IO',
                website: 'https://startup.io',
                group_id: smesGroup.id,
            },
            {
                name: 'Robert',
                lastname: 'Garcia',
                email: 'robert.garcia@digital.co',
                phone: '+1-555-0107',
                company_name: 'Digital Solutions',
                website: 'https://digital.co',
                group_id: smesGroup.id,
            },
            {
                name: 'Amanda',
                lastname: 'Rodriguez',
                email: 'amanda.rodriguez@cloud.net',
                phone: '+1-555-0108',
                company_name: 'Cloud Services',
                website: 'https://cloud.net',
                group_id: smesGroup.id,
            },
            {
                name: 'Christopher',
                lastname: 'Lee',
                email: 'christopher.lee@future.com',
                phone: '+1-555-0109',
                company_name: 'Future Tech',
                website: 'https://future.com',
                group_id: enterpriseGroup.id,
            },
            {
                name: 'Lisa',
                lastname: 'Anderson',
                email: 'lisa.anderson@nexus.io',
                phone: '+1-555-0110',
                company_name: 'Nexus Systems',
                website: 'https://nexus.io',
                group_id: smesGroup.id,
            },
            {
                name: 'James',
                lastname: 'Taylor',
                email: 'james.taylor@apex.com',
                phone: '+1-555-0111',
                company_name: 'Apex Industries',
                website: 'https://apex.com',
                group_id: enterpriseGroup.id,
            },
            {
                name: 'Maria',
                lastname: 'Thomas',
                email: 'maria.thomas@zenith.co',
                phone: '+1-555-0112',
                company_name: 'Zenith Corp',
                website: 'https://zenith.co',
                group_id: smesGroup.id,
            },
            {
                name: 'Daniel',
                lastname: 'Jackson',
                email: 'daniel.jackson@prime.net',
                phone: '+1-555-0113',
                company_name: 'Prime Solutions',
                website: 'https://prime.net',
                group_id: enterpriseGroup.id,
            },
            {
                name: 'Patricia',
                lastname: 'White',
                email: 'patricia.white@elite.com',
                phone: '+1-555-0114',
                company_name: 'Elite Consulting',
                website: 'https://elite.com',
                group_id: smesGroup.id,
            },
            {
                name: 'Mark',
                lastname: 'Harris',
                email: 'mark.harris@vision.io',
                phone: '+1-555-0115',
                company_name: 'Vision Group',
                website: 'https://vision.io',
                group_id: enterpriseGroup.id,
            },
        ];

        for (const customerData of sampleCustomers) {
            const existingCustomer = await customerRepo.findOne({
                where: { email: customerData.email, tenant_id: tenantId },
            });

            if (!existingCustomer) {
                const customer = customerRepo.create({
                    ...customerData,
                    tenant_id: tenantId,
                    status: status || undefined,
                } as any);
                const saved = await customerRepo.save(customer as unknown as Customer);
                console.log(`Created customer: ${(saved as Customer).name} ${(saved as Customer).lastname}`);
            }
        }

        console.log('Sample customers created successfully');
        await AppDataSource.destroy();
    } catch (error) {
        console.error('Error creating sample customers:', error);
        process.exit(1);
    }
}

createSampleCustomers();
