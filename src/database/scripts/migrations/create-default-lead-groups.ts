import { AppDataSource } from '../data-source';
import { LeadGroup } from 'src/entities/leads/lead-group.entity';

async function createDefaultLeadGroups() {
    try {
        await AppDataSource.initialize();

        const groupRepo = AppDataSource.getRepository(LeadGroup);

        // Get the first tenant (you can modify this to accept tenant ID as parameter)
        const tenantId = '54481b63-5516-458d-9bb3-d4e5cb028864'; // Replace with actual tenant ID

        // Check if groups already exist
        const existingGroups = await groupRepo.find({
            where: { tenant_id: tenantId },
        });

        if (existingGroups.length > 0) {
            console.log('Lead groups already exist for this tenant');
            await AppDataSource.destroy();
            return;
        }

        // Create default groups
        const groups = [
            {
                name: 'Google Import 2026',
                description: 'Leads imported from Google Ads campaigns',
                tenant_id: tenantId,
            },
            {
                name: 'Website Leads',
                description: 'Leads generated from website contact forms',
                tenant_id: tenantId,
            },
        ];

        for (const groupData of groups) {
            const group = groupRepo.create(groupData);
            await groupRepo.save(group);
            console.log(`Created lead group: ${group.name} (ID: ${group.id})`);
        }

        console.log('Default lead groups created successfully');
        await AppDataSource.destroy();
    } catch (error) {
        console.error('Error creating default lead groups:', error);
        process.exit(1);
    }
}

createDefaultLeadGroups();
