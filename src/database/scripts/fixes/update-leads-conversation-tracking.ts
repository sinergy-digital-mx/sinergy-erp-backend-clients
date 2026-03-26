import { DataSource } from 'typeorm';
import { Lead } from '../../entities/leads/lead.entity';
import { typeOrmOptions } from '../typeorm.options';

class LeadsConversationUpdater {
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

    async updateLeadsWithConversationTracking() {
        console.log('🚀 Starting leads conversation tracking update...');

        // Get all leads that have been contacted
        const contactedLeads = await this.leadRepo.find({
            where: { email_contacted: true },
            order: { created_at: 'DESC' }
        });

        console.log(`📊 Found ${contactedLeads.length} contacted leads to update`);

        let updated = 0;
        const now = new Date();

        for (const lead of contactedLeads) {
            let shouldUpdate = false;
            const updates: any = {};

            // Scenario 1: Customer has responded but agent hasn't replied back (awaiting agent reply)
            if (lead.customer_answered && !lead.agent_replied_back) {
                // For some leads, simulate that agent has replied back
                if (Math.random() > 0.6) { // 40% chance agent has replied
                    updates.agent_replied_back = true;
                    updates.agent_replied_back_at = new Date(lead.customer_answered_at.getTime() + Math.random() * 24 * 60 * 60 * 1000); // Random time after customer response
                    shouldUpdate = true;
                }
            }

            // Scenario 2: For leads that haven't been answered by customer yet
            if (!lead.customer_answered) {
                // Simulate some customers responding
                if (Math.random() > 0.7) { // 30% chance customer responded
                    updates.customer_answered = true;
                    updates.customer_answered_at = new Date(lead.first_email_sent_at.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000); // Random time within a week
                    
                    // Some of these will have agent replies
                    if (Math.random() > 0.5) { // 50% chance agent replied back
                        updates.agent_replied_back = true;
                        updates.agent_replied_back_at = new Date(updates.customer_answered_at.getTime() + Math.random() * 24 * 60 * 60 * 1000);
                    }
                    shouldUpdate = true;
                }
            }

            if (shouldUpdate) {
                await this.leadRepo.update(lead.id, updates);
                updated++;
                
                const status = this.getConversationStatus(
                    lead.email_contacted,
                    updates.customer_answered ?? lead.customer_answered,
                    updates.agent_replied_back ?? lead.agent_replied_back
                );
                
                console.log(`📝 Updated lead ${lead.id} (${lead.name} ${lead.lastname}) - Status: ${status}`);
            }
        }

        console.log(`\n✅ Update completed!`);
        console.log(`📊 Summary:`);
        console.log(`   - Total contacted leads: ${contactedLeads.length}`);
        console.log(`   - Updated leads: ${updated}`);
        console.log(`   - Unchanged leads: ${contactedLeads.length - updated}`);

        // Show final statistics
        await this.showFinalStats();
    }

    private getConversationStatus(emailContacted: boolean, customerAnswered: boolean, agentRepliedBack: boolean): string {
        if (!emailContacted) return 'Not Contacted';
        if (!customerAnswered) return 'Contacted (No Reply)';
        if (!agentRepliedBack) return 'Awaiting Agent Reply';
        return 'Active Conversation';
    }

    async showFinalStats() {
        console.log('\n📈 Final Conversation Statistics:');
        
        const totalLeads = await this.leadRepo.count();
        const notContacted = await this.leadRepo.count({ where: { email_contacted: false } });
        const contactedNoReply = await this.leadRepo.count({ 
            where: { 
                email_contacted: true, 
                customer_answered: false 
            } 
        });
        const awaitingAgentReply = await this.leadRepo.count({ 
            where: { 
                email_contacted: true, 
                customer_answered: true, 
                agent_replied_back: false 
            } 
        });
        const activeConversation = await this.leadRepo.count({ 
            where: { 
                email_contacted: true, 
                customer_answered: true, 
                agent_replied_back: true 
            } 
        });

        console.log(`   📊 Total Leads: ${totalLeads}`);
        console.log(`   📧 Not Contacted: ${notContacted}`);
        console.log(`   ⏳ Contacted (No Reply): ${contactedNoReply}`);
        console.log(`   ⏰ Awaiting Agent Reply: ${awaitingAgentReply}`);
        console.log(`   💬 Active Conversation: ${activeConversation}`);
    }
}

async function main() {
    const updater = new LeadsConversationUpdater();
    
    try {
        await updater.initialize();
        await updater.updateLeadsWithConversationTracking();
    } catch (error) {
        console.error('💥 Update failed:', error);
        process.exit(1);
    } finally {
        await updater.destroy();
    }
}

// Run the update
if (require.main === module) {
    main();
}