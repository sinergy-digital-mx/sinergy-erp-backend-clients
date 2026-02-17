import { AppDataSource } from '../data-source';
import { LeadGroup } from '../../entities/leads/lead-group.entity';

async function createLeadGroups() {
    try {
        await AppDataSource.initialize();

        const groupRepo = AppDataSource.getRepository(LeadGroup);
        const tenantId = '54481b63-5516-458d-9bb3-d4e5cb028864';

        const sampleGroups = [
            {
                name: 'Leads from Website',
                description: 'Leads generated from website contact forms and landing pages',
            },
            {
                name: 'Imported Leads',
                description: 'Leads imported from external sources and databases',
            },
            {
                name: 'Enero',
                description: 'Leads collected during January 2026',
            },
            {
                name: 'Google Import 2026',
                description: 'Leads imported from Google Ads campaigns',
            },
            {
                name: 'LinkedIn Outreach',
                description: 'Leads from LinkedIn prospecting and outreach campaigns',
            },
        ];

        console.log('Creating lead groups...\n');

        for (const groupData of sampleGroups) {
            const existingGroup = await groupRepo.findOne({
                where: { tenant_id: tenantId, name: groupData.name },
            });

            if (!existingGroup) {
                const group = groupRepo.create({
                    ...groupData,
                    tenant_id: tenantId,
                });
                await groupRepo.save(group);
                console.log(`✓ Created lead group: ${group.name} (ID: ${group.id})`);
            } else {
                console.log(`✓ Lead group already exists: ${groupData.name}`);
            }
        }

        // Show all groups
        const allGroups = await groupRepo.find({
            where: { tenant_id: tenantId },
        });

        console.log(`\n✓ Total lead groups: ${allGroups.length}`);
        console.log('\nAll lead groups:');
        for (const group of allGroups) {
            console.log(`  - ${group.name} (${group.id})`);
        }

        await AppDataSource.destroy();
    } catch (error) {
        console.error('Error creating lead groups:', error);
        process.exit(1);
    }
}

createLeadGroups();
