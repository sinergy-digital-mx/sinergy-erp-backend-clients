import { AppDataSource } from '../data-source';
import { EmailThread } from '../../entities/email/email-thread.entity';
import { EmailMessage } from '../../entities/email/email-message.entity';
import { Lead } from '../../entities/leads/lead.entity';
import { EntityRegistry } from '../../entities/entity-registry/entity-registry.entity';

async function createSampleEmailThreads() {
    try {
        await AppDataSource.initialize();

        const threadRepo = AppDataSource.getRepository(EmailThread);
        const messageRepo = AppDataSource.getRepository(EmailMessage);
        const leadRepo = AppDataSource.getRepository(Lead);
        const entityRegistryRepo = AppDataSource.getRepository(EntityRegistry);

        const tenantId = '54481b63-5516-458d-9bb3-d4e5cb028864';

        // Get Lead entity type ID
        const leadEntityType = await entityRegistryRepo.findOne({
            where: { code: 'lead' },
        });

        if (!leadEntityType) {
            console.log('Lead entity type not found in EntityRegistry');
            await AppDataSource.destroy();
            return;
        }

        // Get some leads to create threads for
        const leads = await leadRepo.find({
            where: { tenant_id: tenantId },
            take: 5,
        });

        if (leads.length === 0) {
            console.log('No leads found to create email threads for');
            await AppDataSource.destroy();
            return;
        }

        console.log(`Creating sample email threads for ${leads.length} leads...\n`);

        // Sample thread data
        const threadTemplates = [
            {
                subject: 'Interested in our services',
                email_from: 'sales@company.com',
                messages: [
                    {
                        from_email: 'sales@company.com',
                        to_email: 'lead@example.com',
                        subject: 'Interested in our services',
                        body: 'Hi there,\n\nI noticed your company might benefit from our solutions. Would you be interested in a quick call to discuss?\n\nBest regards,\nSales Team',
                        direction: 'outbound' as const,
                        status: 'sent' as const,
                    },
                    {
                        from_email: 'lead@example.com',
                        to_email: 'sales@company.com',
                        subject: 'Re: Interested in our services',
                        body: 'Hi,\n\nThanks for reaching out! Yes, I\'d be interested in learning more. How about next Tuesday at 2 PM?\n\nThanks',
                        direction: 'inbound' as const,
                        status: 'received' as const,
                    },
                    {
                        from_email: 'sales@company.com',
                        to_email: 'lead@example.com',
                        subject: 'Re: Interested in our services',
                        body: 'Perfect! Tuesday at 2 PM works great. I\'ll send you a calendar invite shortly.\n\nLooking forward to it!',
                        direction: 'outbound' as const,
                        status: 'sent' as const,
                    },
                ],
            },
            {
                subject: 'Product Demo Request',
                email_from: 'support@company.com',
                messages: [
                    {
                        from_email: 'support@company.com',
                        to_email: 'lead@example.com',
                        subject: 'Product Demo Request',
                        body: 'Hello,\n\nThank you for your interest in our product. I\'d like to schedule a demo for you.\n\nWhat time works best for you this week?',
                        direction: 'outbound' as const,
                        status: 'sent' as const,
                    },
                ],
            },
            {
                subject: 'Follow-up on your inquiry',
                email_from: 'sales@company.com',
                messages: [
                    {
                        from_email: 'sales@company.com',
                        to_email: 'lead@example.com',
                        subject: 'Follow-up on your inquiry',
                        body: 'Hi,\n\nJust following up on my previous email. Are you still interested in learning more about our services?\n\nLet me know!',
                        direction: 'outbound' as const,
                        status: 'sent' as const,
                    },
                    {
                        from_email: 'lead@example.com',
                        to_email: 'sales@company.com',
                        subject: 'Re: Follow-up on your inquiry',
                        body: 'Hi,\n\nSorry for the late reply. Yes, I\'m still interested. Can you send me some pricing information?\n\nThanks',
                        direction: 'inbound' as const,
                        status: 'received' as const,
                    },
                ],
            },
            {
                subject: 'Partnership Opportunity',
                email_from: 'partnerships@company.com',
                messages: [
                    {
                        from_email: 'partnerships@company.com',
                        to_email: 'lead@example.com',
                        subject: 'Partnership Opportunity',
                        body: 'Hello,\n\nWe believe there\'s a great opportunity for us to work together. Would you be open to discussing a partnership?\n\nBest regards',
                        direction: 'outbound' as const,
                        status: 'sent' as const,
                    },
                ],
            },
            {
                subject: 'Quick Question',
                email_from: 'sales@company.com',
                messages: [
                    {
                        from_email: 'lead@example.com',
                        to_email: 'sales@company.com',
                        subject: 'Quick Question',
                        body: 'Hi,\n\nI have a quick question about your pricing model. Can you clarify the difference between the Pro and Enterprise plans?\n\nThanks',
                        direction: 'inbound' as const,
                        status: 'received' as const,
                    },
                    {
                        from_email: 'sales@company.com',
                        to_email: 'lead@example.com',
                        subject: 'Re: Quick Question',
                        body: 'Great question! The main difference is:\n\nPro: Up to 100 users, basic support\nEnterprise: Unlimited users, 24/7 support, custom integrations\n\nLet me know if you need more details!',
                        direction: 'outbound' as const,
                        status: 'sent' as const,
                    },
                ],
            },
        ];

        // Create threads for each lead
        for (let i = 0; i < leads.length; i++) {
            const lead = leads[i];
            const template = threadTemplates[i % threadTemplates.length];

            // Create thread with new pattern
            const thread = new EmailThread();
            thread.tenant_id = tenantId;
            thread.entity_type_id = leadEntityType.id;
            thread.entity_id = lead.id.toString();
            thread.lead_id = lead.id; // Keep for backward compatibility
            thread.subject = template.subject;
            thread.email_from = template.email_from;
            thread.email_to = lead.email;
            thread.status = template.messages.some(m => m.direction === 'inbound') ? 'replied' : 'sent';
            thread.message_count = template.messages.length;
            thread.is_read = false;

            const savedThread = await threadRepo.save(thread);
            console.log(`✓ Created thread: "${template.subject}" for ${lead.name} ${lead.lastname}`);

            // Create messages
            for (let j = 0; j < template.messages.length; j++) {
                const msgData = template.messages[j];
                const message = new EmailMessage();
                message.tenant_id = tenantId;
                message.thread_id = savedThread.id;
                message.message_id = `msg-${savedThread.id}-${j}`;
                message.from_email = msgData.from_email;
                message.to_email = msgData.to_email;
                message.subject = msgData.subject;
                message.body = msgData.body;
                message.body_html = `<p>${msgData.body.replace(/\n/g, '</p><p>')}</p>`;
                message.direction = msgData.direction;
                message.status = msgData.status;
                message.external_provider = 'gmail';
                message.created_at = new Date(Date.now() - (template.messages.length - j) * 86400000);
                
                if (msgData.direction === 'inbound') {
                    message.received_at = new Date();
                }

                await messageRepo.save(message);
            }

            // Update lead flags
            lead.email_contacted = true;
            lead.first_email_sent_at = new Date(Date.now() - 7 * 86400000); // 7 days ago
            if (template.messages.some(m => m.direction === 'inbound')) {
                lead.customer_answered = true;
                lead.customer_answered_at = new Date(Date.now() - 3 * 86400000); // 3 days ago
            }
            await leadRepo.save(lead);
        }

        console.log(`\n✓ Sample email threads created successfully!`);
        console.log(`\nYou can now view these threads via:`);
        console.log(`GET /api/email-threads?entityTypeId=1&entityId={leadId}`);

        await AppDataSource.destroy();
    } catch (error) {
        console.error('Error creating sample email threads:', error);
        process.exit(1);
    }
}

createSampleEmailThreads();
