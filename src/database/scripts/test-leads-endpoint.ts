import { DataSource } from 'typeorm';
import { Lead } from '../../entities/leads/lead.entity';
import { typeOrmOptions } from '../typeorm.options';

class LeadsEndpointTester {
    private dataSource: DataSource;
    private leadRepo: any;

    constructor() {
        this.dataSource = new DataSource(typeOrmOptions);
    }

    async initialize() {
        await this.dataSource.initialize();
        this.leadRepo = this.dataSource.getRepository(Lead);
        console.log('✅ Database connection established');
    }

    async destroy() {
        await this.dataSource.destroy();
    }

    async testLeadsEndpointQuery() {
        console.log('🔍 Testing leads endpoint query (simulating service method)...');

        // Simulate the exact query from the service
        const tenantId = '54481b63-5516-458d-9bb3-d4e5cb028864';
        const page = 1;
        const limit = 5;
        const skip = (page - 1) * limit;

        const queryBuilder = this.leadRepo.createQueryBuilder('lead')
            .leftJoinAndSelect('lead.status', 'status')
            .leftJoinAndSelect('lead.tenant', 'tenant')
            .leftJoinAndSelect('lead.group', 'group')
            .where('lead.tenant_id = :tenantId', { tenantId });

        // Add ordering
        queryBuilder.orderBy('lead.created_at', 'DESC');

        // Get paginated results
        const leads = await queryBuilder
            .skip(skip)
            .take(limit)
            .getMany();

        console.log(`\n📊 Found ${leads.length} leads:`);
        
        leads.forEach((lead, index) => {
            console.log(`\n${index + 1}. Lead: ${lead.name} ${lead.lastname}`);
            console.log(`   ID: ${lead.id}`);
            console.log(`   Group ID: ${lead.group_id}`);
            console.log(`   Group Object:`, lead.group ? {
                id: lead.group.id,
                name: lead.group.name,
                description: lead.group.description
            } : 'null');
            console.log(`   Status:`, lead.status ? lead.status.name : 'null');
        });
    }
}

async function main() {
    const tester = new LeadsEndpointTester();
    
    try {
        await tester.initialize();
        await tester.testLeadsEndpointQuery();
    } catch (error) {
        console.error('💥 Test failed:', error);
        process.exit(1);
    } finally {
        await tester.destroy();
    }
}

// Run the test
if (require.main === module) {
    main();
}