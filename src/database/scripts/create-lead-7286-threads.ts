import { AppDataSource } from '../data-source';
import { EmailThread } from '../../entities/email/email-thread.entity';
import { EmailMessage } from '../../entities/email/email-message.entity';
import { Lead } from '../../entities/leads/lead.entity';

async function createThreadsForLead7286() {
  try {
    await AppDataSource.initialize();

    // Get lead 7286
    const lead = await AppDataSource.getRepository(Lead).findOne({
      where: { id: 7286 },
    });

    if (!lead) {
      console.log('Lead 7286 not found');
      process.exit(1);
    }

    console.log(`Found lead: ${lead.name} ${lead.lastname} (${lead.email})`);

    const threadRepo = AppDataSource.getRepository(EmailThread);
    const messageRepo = AppDataSource.getRepository(EmailMessage);

    // Thread 1: Initial contact (sent, no reply yet)
    const thread1 = threadRepo.create({
      tenant_id: lead.tenant_id,
      lead_id: lead.id,
      entity_type: 'lead',
      entity_id: lead.id.toString(),
      subject: 'Initial Contact - Product Inquiry',
      email_from: 'sales@company.com',
      email_to: lead.email,
      status: 'sent',
      is_read: false,
      message_count: 1,
      created_by: undefined,
    } as any);

    const savedThread1 = await threadRepo.save(thread1 as unknown as EmailThread);
    console.log(`✓ Created thread 1: ${(savedThread1 as EmailThread).id}`);

    // Add message to thread 1
    const msg1 = messageRepo.create({
      thread_id: (savedThread1 as EmailThread).id,
      tenant_id: lead.tenant_id,
      from_email: 'sales@company.com',
      to_email: lead.email,
      subject: 'Initial Contact - Product Inquiry',
      body: `Hi ${lead.name},\n\nWe noticed your interest in our services. Would you like to schedule a demo?\n\nBest regards,\nSales Team`,
      body_html: `<p>Hi ${lead.name},</p><p>We noticed your interest in our services. Would you like to schedule a demo?</p><p>Best regards,<br>Sales Team</p>`,
      message_id: `msg-${Date.now()}-1`,
      direction: 'outbound',
      status: 'sent',
      created_by: undefined,
    } as any);

    await messageRepo.save(msg1);
    console.log(`✓ Added message to thread 1`);

    // Thread 2: Follow-up (replied by customer)
    const thread2 = threadRepo.create({
      tenant_id: lead.tenant_id,
      lead_id: lead.id,
      entity_type: 'lead',
      entity_id: lead.id.toString(),
      subject: 'Re: Initial Contact - Product Inquiry',
      email_from: 'sales@company.com',
      email_to: lead.email,
      status: 'replied',
      is_read: false,
      message_count: 2,
      created_by: undefined,
    } as any);

    const savedThread2 = await threadRepo.save(thread2 as unknown as EmailThread);
    console.log(`✓ Created thread 2: ${(savedThread2 as EmailThread).id}`);

    // Add messages to thread 2
    const msg2a = messageRepo.create({
      thread_id: (savedThread2 as EmailThread).id,
      tenant_id: lead.tenant_id,
      from_email: 'sales@company.com',
      to_email: lead.email,
      subject: 'Re: Initial Contact - Product Inquiry',
      body: `Hi ${lead.name},\n\nFollowing up on our previous message. Are you available for a call next week?\n\nBest regards,\nSales Team`,
      body_html: `<p>Hi ${lead.name},</p><p>Following up on our previous message. Are you available for a call next week?</p><p>Best regards,<br>Sales Team</p>`,
      message_id: `msg-${Date.now()}-2a`,
      direction: 'outbound',
      status: 'sent',
      created_by: undefined,
    } as any);

    await messageRepo.save(msg2a);

    const msg2b = messageRepo.create({
      thread_id: (savedThread2 as EmailThread).id,
      tenant_id: lead.tenant_id,
      from_email: lead.email,
      to_email: 'sales@company.com',
      subject: 'Re: Initial Contact - Product Inquiry',
      body: `Hi,\n\nYes, I'm interested! Tuesday at 2 PM works for me.\n\nThanks,\n${lead.name}`,
      body_html: `<p>Hi,</p><p>Yes, I'm interested! Tuesday at 2 PM works for me.</p><p>Thanks,<br>${lead.name}</p>`,
      message_id: `msg-${Date.now()}-2b`,
      direction: 'inbound',
      status: 'received',
      created_by: undefined,
    } as any);

    await messageRepo.save(msg2b);
    console.log(`✓ Added 2 messages to thread 2`);

    // Update lead with email tracking
    lead.email_contacted = true;
    lead.first_email_sent_at = new Date();
    lead.customer_answered = true;
    lead.customer_answered_at = new Date();
    lead.last_email_thread_status = 'replied';
    lead.last_email_thread_id = (savedThread2 as EmailThread).id;
    lead.email_thread_count = 2;

    await AppDataSource.getRepository(Lead).save(lead);
    console.log(`✓ Updated lead 7286 with email tracking`);

    console.log('\n✅ Successfully created 2 email threads for lead 7286');
    console.log(`   Thread 1 (sent, no reply): ${(savedThread1 as EmailThread).id}`);
    console.log(`   Thread 2 (replied): ${(savedThread2 as EmailThread).id}`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createThreadsForLead7286();
