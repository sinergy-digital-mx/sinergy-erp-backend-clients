import { DataSource } from 'typeorm';
import { Lead } from '../../entities/leads/lead.entity';
import { typeOrmOptions } from '../typeorm.options';

class LeadGroupTester {
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

    async testLeadGroupRelation() {
        console.log('🔍 Testing lead-group relation...');

        // Test 1: Get a lead with group relation
        const leadWithGroup = await this.leadRepo
            .createQueryBuilder('lead')
            .leftJoinAndSelect('lead.group', 'group')
            .where('lead.group_id IS NOT NULL')
            .limit(1)
            .getOne();

        if (leadWithGroup) {
            console.log('✅ Found lead with group:');
            console.log(`   Lead: ${leadWithGroup.name} ${leadWithGroup.lastname}`);
            console.log(`   Group ID: ${leadWithGroup.group_id}`);
            console.log(`   Group Object:`, leadWithGroup.group);
        } else {
            console.log('❌ No lead with group found');
        }

        // Test 2: Check if group exists
        const groupId = '9875d5e1-80ab-49e1-bf4f-76f0b88581b8';
        const directGroupQuery = await this.dataSource.query(
            'SELECT * FROM lead_groups WHERE id = ?', 
            [groupId]
        );
        
        console.log('\n🔍 Direct group query result:');
        console.log(directGroupQuery);

        // Test 3: Check leads with this group_id
        const leadsCount = await this.leadRepo.count({ where: { group_id: groupId } });
        console.log(`\n📊 Leads with group_id ${groupId}: ${leadsCount}`);
    }
}

async function main() {
    const tester = new LeadGroupTester();
    
    try {
        await tester.initialize();
        await tester.testLeadGroupRelation();
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