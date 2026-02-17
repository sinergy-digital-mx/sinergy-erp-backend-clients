import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailMessage } from '../../../entities/email/email-message.entity';
import { EmailThread } from '../../../entities/email/email-thread.entity';

@Injectable()
export class EmailMessageService {
  constructor(
    @InjectRepository(EmailMessage)
    private messageRepo: Repository<EmailMessage>,
    @InjectRepository(EmailThread)
    private threadRepo: Repository<EmailThread>,
  ) {}

  /**
   * Send a message in a thread
   */
  async sendMessage(
    tenantId: string,
    threadId: string,
    fromEmail: string,
    toEmail: string,
    subject: string,
    body: string,
    bodyHtml?: string,
    cc?: string,
    bcc?: string,
  ): Promise<EmailMessage> {
    // Verify thread exists and belongs to tenant
    const thread = await this.threadRepo.findOne({
      where: { id: threadId, tenant_id: tenantId },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    // Create message
    const message = this.messageRepo.create({
      tenant_id: tenantId,
      thread_id: threadId,
      message_id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      from_email: fromEmail,
      to_email: toEmail,
      cc,
      bcc,
      subject,
      body,
      body_html: bodyHtml,
      direction: 'outbound',
      status: 'pending',
      external_provider: 'gmail',
    });

    const savedMessage = await this.messageRepo.save(message);

    // Update thread metadata
    await this.threadRepo.update(threadId, {
      last_message_at: new Date(),
      message_count: () => 'message_count + 1',
      status: 'sent',
    });

    return savedMessage;
  }

  /**
   * Receive a message in a thread (from external provider like Gmail)
   */
  async receiveMessage(
    tenantId: string,
    threadId: string,
    externalId: string,
    fromEmail: string,
    toEmail: string,
    subject: string,
    body: string,
    bodyHtml?: string,
    cc?: string,
    bcc?: string,
    inReplyTo?: string,
  ): Promise<EmailMessage> {
    // Verify thread exists and belongs to tenant
    const thread = await this.threadRepo.findOne({
      where: { id: threadId, tenant_id: tenantId },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    // Check if message already exists (prevent duplicates)
    const existingMessage = await this.messageRepo.findOne({
      where: { external_id: externalId, tenant_id: tenantId },
    });

    if (existingMessage) {
      throw new BadRequestException('Message already exists');
    }

    // Create message
    const message = this.messageRepo.create({
      tenant_id: tenantId,
      thread_id: threadId,
      message_id: externalId,
      external_id: externalId,
      from_email: fromEmail,
      to_email: toEmail,
      cc,
      bcc,
      subject,
      body,
      body_html: bodyHtml,
      in_reply_to: inReplyTo,
      direction: 'inbound',
      status: 'received',
      external_provider: 'gmail',
      received_at: new Date(),
    });

    const savedMessage = await this.messageRepo.save(message);

    // Update thread metadata
    await this.threadRepo.update(threadId, {
      last_message_at: new Date(),
      message_count: () => 'message_count + 1',
      status: 'replied',
      is_read: false,
    });

    return savedMessage;
  }

  /**
   * Get all messages in a thread
   */
  async getThreadMessages(tenantId: string, threadId: string): Promise<EmailMessage[]> {
    // Verify thread exists
    const thread = await this.threadRepo.findOne({
      where: { id: threadId, tenant_id: tenantId },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    return this.messageRepo.find({
      where: { thread_id: threadId, tenant_id: tenantId },
      order: { created_at: 'ASC' },
    });
  }

  /**
   * Mark message as read
   */
  async markAsRead(tenantId: string, messageId: string): Promise<EmailMessage> {
    const message = await this.messageRepo.findOne({
      where: { id: messageId, tenant_id: tenantId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    message.read_at = new Date();
    return this.messageRepo.save(message);
  }

  /**
   * Mark all messages in thread as read
   */
  async markThreadMessagesAsRead(tenantId: string, threadId: string): Promise<void> {
    await this.messageRepo.update(
      { thread_id: threadId, tenant_id: tenantId },
      { read_at: new Date() },
    );
  }

  /**
   * Get message by ID
   */
  async getMessageById(tenantId: string, messageId: string): Promise<EmailMessage> {
    const message = await this.messageRepo.findOne({
      where: { id: messageId, tenant_id: tenantId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    return message;
  }
}
