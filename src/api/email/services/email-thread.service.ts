import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailThread } from '../../../entities/email/email-thread.entity';
import { EmailMessage } from '../../../entities/email/email-message.entity';
import { Lead } from '../../../entities/leads/lead.entity';
import { EntityRegistry } from '../../../entities/entity-registry/entity-registry.entity';

@Injectable()
export class EmailThreadService {
  constructor(
    @InjectRepository(EmailThread)
    private threadRepo: Repository<EmailThread>,
    @InjectRepository(EmailMessage)
    private messageRepo: Repository<EmailMessage>,
    @InjectRepository(Lead)
    private leadRepo: Repository<Lead>,
    @InjectRepository(EntityRegistry)
    private entityRegistryRepo: Repository<EntityRegistry>,
  ) {}

  /**
   * Helper method to resolve entity type code to entity_type_id
   */
  private async resolveEntityTypeId(entityTypeCode: string): Promise<number> {
    const entityType = await this.entityRegistryRepo.findOne({
      where: { code: entityTypeCode },
    });

    if (!entityType) {
      throw new NotFoundException(`Entity type '${entityTypeCode}' not found in registry`);
    }

    return entityType.id;
  }

  /**
   * Create a new email thread
   */
  async createThread(
    tenantId: string,
    entityTypeId: number,
    entityId: string,
    emailTo: string,
    subject: string,
    body: string,
    userId: string,
  ): Promise<{ thread: EmailThread; message: EmailMessage }> {
    let leadId: number | null = null;

    // If entity type is 'lead', get the lead ID for backward compatibility
    const entityType = await this.entityRegistryRepo.findOne({
      where: { id: entityTypeId },
    });

    if (!entityType) {
      throw new NotFoundException(`Entity type with ID ${entityTypeId} not found`);
    }

    if (entityType.code === 'lead') {
      const lead = await this.leadRepo.findOne({
        where: { id: parseInt(entityId) },
      });
      if (lead) {
        leadId = lead.id;
      }
    }

    // Create thread with entity_type_id
    const thread = this.threadRepo.create({
      tenant_id: tenantId,
      entity_type_id: entityTypeId,
      entity_id: entityId,
      lead_id: leadId || undefined,
      subject,
      email_from: 'noreply@example.com', // Will be replaced with actual sender
      email_to: emailTo,
      status: 'draft',
      created_by: userId,
    });

    const savedThread = await this.threadRepo.save(thread);

    // Create first message
    const message = this.messageRepo.create({
      tenant_id: tenantId,
      thread_id: savedThread.id,
      message_id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      from_email: 'noreply@example.com',
      to_email: emailTo,
      subject,
      body,
      direction: 'outbound',
      status: 'pending',
    });

    const savedMessage = await this.messageRepo.save(message);

    // Update lead if entity_type is 'lead'
    if (entityType.code === 'lead') {
      await this.leadRepo.update(entityId, {
        email_contacted: true,
        first_email_sent_at: new Date(),
        assigned_rep_id: userId,
      });
    }

    return { thread: savedThread, message: savedMessage };
  }

  /**
   * Get threads by entity using entity_type_id and entity_id
   */
  async getThreadsByEntity(
    tenantId: string,
    entityTypeId: number,
    entityId: string,
  ): Promise<EmailThread[]> {
    const threads = await this.threadRepo.find({
      where: {
        tenant_id: tenantId,
        entity_type_id: entityTypeId,
        entity_id: entityId,
      },
      relations: ['messages', 'entityType'],
      order: { last_message_at: 'DESC' },
    });

    return threads;
  }

  /**
   * Get thread details with messages
   */
  async getThreadDetails(tenantId: string, threadId: string): Promise<EmailThread> {
    const thread = await this.threadRepo.findOne({
      where: { id: threadId, tenant_id: tenantId },
      relations: ['messages', 'entityType'],
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    // Sort messages by created_at
    thread.messages = thread.messages.sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );

    return thread;
  }

  /**
   * Update thread status
   */
  async updateThreadStatus(
    tenantId: string,
    threadId: string,
    status: 'draft' | 'sent' | 'replied' | 'closed' | 'archived',
  ): Promise<EmailThread> {
    const thread = await this.threadRepo.findOne({
      where: { id: threadId, tenant_id: tenantId },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    thread.status = status;
    return this.threadRepo.save(thread);
  }

  /**
   * Mark thread as read
   */
  async markThreadAsRead(tenantId: string, threadId: string): Promise<EmailThread> {
    const thread = await this.threadRepo.findOne({
      where: { id: threadId, tenant_id: tenantId },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    thread.is_read = true;
    return this.threadRepo.save(thread);
  }

  /**
   * Get all threads for a tenant
   */
  async getAllThreads(
    tenantId: string,
    filters?: {
      entityTypeId?: number;
      status?: string;
      archived?: boolean;
    },
  ): Promise<EmailThread[]> {
    const query = this.threadRepo
      .createQueryBuilder('thread')
      .leftJoinAndSelect('thread.entityType', 'entityType')
      .where('thread.tenant_id = :tenantId', { tenantId });

    if (filters?.entityTypeId) {
      query.andWhere('thread.entity_type_id = :entityTypeId', { entityTypeId: filters.entityTypeId });
    }

    if (filters?.status) {
      query.andWhere('thread.status = :status', { status: filters.status });
    }

    if (filters?.archived === false) {
      query.andWhere('thread.status != :archived', { archived: 'archived' });
    }

    return query.orderBy('thread.last_message_at', 'DESC').getMany();
  }
}
