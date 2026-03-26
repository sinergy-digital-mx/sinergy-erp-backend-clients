import { DataSource } from 'typeorm';
import { Lead } from '../../entities/leads/lead.entity';
import { LeadGroup } from '../../entities/leads/lead-group.entity';
import { typeOrmOptions } from '../typeorm.options';

class LeadGroupAssigner {
    private dataSource: DataSource;
    private leadRepo: any;
    private groupRepo: any;

    constructor() {
        this.dataSource = new DataSource(typeOrmOptions);
    }

    async initialize() {
        await this.dataSource.initialize();
        this.leadRepo = this.dataSource.getRepository(Lead);
        this.groupRepo = this.dataSource.getRepository(LeadGroup);
        console.log('✅ Database connection established');
    }

    async destroy() {
        await this.dataSource.destroy();
    }

    async assignGroupToAllLeads() {
        const groupId = '9875d5e1-80ab-49e1-bf4f-76f0b88581b8';
        
        console.log('🚀 Starting group assignment to all leads...');
        console.log(`📋 Target group ID: ${groupId}`);

        // Verify the group exists
        const group = await this.groupRepo.findOne({ where: { id: groupId } });
        if (!group) {
            console.error(`❌ Group with ID ${groupId} not found!`);
            return;
        }

        console.log(`✅ Found group: "${group.name}"`);

        // Get all leads
        const totalLeads = await this.leadRepo.count();
        console.log(`📊 Total leads to update: ${totalLeads}`);

        // Update all leads to have this group using query builder
        const result = await this.leadRepo
            .createQueryBuilder()
            .update(Lead)
            .set({ group_id: groupId })
            .execute();

        console.log(`\n✅ Assignment completed!`);
        console.log(`📊 Summary:`);
        console.log(`   - Total leads: ${totalLeads}`);
        console.log(`   - Updated leads: ${result.affected}`);
        console.log(`   - Group assigned: "${group.name}" (${groupId})`);

        // Verify the assignment
        const leadsWithGroup = await this.leadRepo.count({ where: { group_id: groupId } });
        console.log(`   - Verification: ${leadsWithGroup} leads now have the group assigned`);
    }
}

async function main() {
    const assigner = new LeadGroupAssigner();
    
    try {
        await assigner.initialize();
        await assigner.assignGroupToAllLeads();
    } catch (error) {
        console.error('💥 Assignment failed:', error);
        process.exit(1);
    } finally {
        await assigner.destroy();
    }
}

// Run the assignment
if (require.main === module) {
    main();
}