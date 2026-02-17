import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../api/auth/jwt-auth.guard';
import { PermissionGuard } from '../../../api/rbac/guards/permission.guard';
import { RequirePermissions } from '../../../api/rbac/decorators/require-permissions.decorator';
import { TenantContextService } from '../../../api/rbac/services/tenant-context.service';
import { EmailThreadService } from '../services/email-thread.service';
import { EmailMessageService } from '../services/email-message.service';
import { GmailSendService } from '../services/gmail-send.service';

@Controller('tenant/email-threads')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class EmailThreadController {
  constructor(
    private threadService: EmailThreadService,
    private messageService: EmailMessageService,
    private gmailSendService: GmailSendService,
    private tenantContext: TenantContextService,
  ) {
    console.log('[EmailThreadController] Initialized');
  }

  /**
   * Create a new email thread
   * POST /api/tenant/email-threads
   */
  @Post()
  @RequirePermissions({ entityType: 'EmailThread', action: 'Create' })
  async createThread(
    @Req() req: any,
    @Body()
    body: {
      entityTypeId: number;
      entityId: string;
      emailTo: string;
      subject: string;
      body: string;
    },
  ) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    const userId = req.user.sub;

    const result = await this.threadService.createThread(
      tenantId,
      body.entityTypeId,
      body.entityId,
      body.emailTo,
      body.subject,
      body.body,
      userId,
    );

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Check if Gmail is configured
   * GET /api/tenant/email-threads/gmail/status
   */
  @Get('gmail/status')
  @RequirePermissions({ entityType: 'EmailMessage', action: 'Read' })
  async getGmailStatus() {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    const isConfigured = await this.gmailSendService.isGmailConfigured(tenantId);

    return {
      success: true,
      gmailConfigured: isConfigured,
    };
  }

  /**
   * Test Gmail configuration
   * POST /api/tenant/email-threads/gmail/test
   */
  @Post('gmail/test')
  @RequirePermissions({ entityType: 'EmailMessage', action: 'Read' })
  async testGmailConfig() {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    const result = await this.gmailSendService.testGmailConfig(tenantId);

    return {
      success: result.success,
      message: result.message,
    };
  }

  /**
   * Get threads for an entity
   * GET /api/tenant/email-threads/by-entity?entityTypeId=1&entityId=xxx
   */
  @Get('by-entity')
  @RequirePermissions({ entityType: 'EmailThread', action: 'Read' })
  async getThreadsByEntity(
    @Query('entityTypeId') entityTypeId?: string,
    @Query('entityId') entityId?: string,
    @Query('status') status?: string,
    @Query('archived') archived?: string,
  ) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    if (entityTypeId && entityId) {
      const threads = await this.threadService.getThreadsByEntity(
        tenantId,
        parseInt(entityTypeId, 10),
        entityId,
      );
      return {
        success: true,
        data: threads,
      };
    }

    // Get all threads with optional filters
    const filters: any = {};
    if (entityTypeId) filters.entityTypeId = parseInt(entityTypeId, 10);
    if (status) filters.status = status;
    if (archived !== undefined) filters.archived = archived === 'false' ? false : true;

    const threads = await this.threadService.getAllThreads(tenantId, filters);
    return {
      success: true,
      data: threads,
    };
  }

  /**
   * Get thread details with messages
   * GET /api/tenant/email-threads/:threadId
   */
  @Get(':threadId')
  @RequirePermissions({ entityType: 'EmailThread', action: 'Read' })
  async getThreadDetails(@Param('threadId') threadId: string) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    const thread = await this.threadService.getThreadDetails(tenantId, threadId);

    return {
      success: true,
      data: thread,
    };
  }

  /**
   * Update thread status
   * PUT /api/tenant/email-threads/:threadId/status
   */
  @Put(':threadId/status')
  @RequirePermissions({ entityType: 'EmailThread', action: 'Update' })
  async updateThreadStatus(
    @Param('threadId') threadId: string,
    @Body() body: { status: 'draft' | 'sent' | 'replied' | 'closed' | 'archived' },
  ) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    const thread = await this.threadService.updateThreadStatus(
      tenantId,
      threadId,
      body.status,
    );

    return {
      success: true,
      data: thread,
    };
  }

  /**
   * Mark thread as read
   * PUT /api/tenant/email-threads/:threadId/mark-read
   */
  @Put(':threadId/mark-read')
  @RequirePermissions({ entityType: 'EmailThread', action: 'Update' })
  async markThreadAsRead(@Param('threadId') threadId: string) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    const thread = await this.threadService.markThreadAsRead(tenantId, threadId);

    return {
      success: true,
      data: thread,
    };
  }

  /**
   * Send a message in a thread
   * POST /api/tenant/email-threads/:threadId/messages
   */
  @Post(':threadId/messages')
  @RequirePermissions({ entityType: 'EmailMessage', action: 'Create' })
  async sendMessage(
    @Param('threadId') threadId: string,
    @Body()
    body: {
      fromEmail: string;
      toEmail: string;
      subject: string;
      body: string;
      bodyHtml?: string;
      cc?: string;
      bcc?: string;
    },
  ) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    const message = await this.messageService.sendMessage(
      tenantId,
      threadId,
      body.fromEmail,
      body.toEmail,
      body.subject,
      body.body,
      body.bodyHtml,
      body.cc,
      body.bcc,
    );

    return {
      success: true,
      data: message,
    };
  }

  /**
   * Get messages in a thread
   * GET /api/tenant/email-threads/:threadId/messages
   */
  @Get(':threadId/messages')
  @RequirePermissions({ entityType: 'EmailMessage', action: 'Read' })
  async getThreadMessages(@Param('threadId') threadId: string) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    const messages = await this.messageService.getThreadMessages(tenantId, threadId);

    return {
      success: true,
      data: messages,
    };
  }

  /**
   * Mark message as read
   * PUT /api/tenant/email-threads/:threadId/messages/:messageId/mark-read
   */
  @Put(':threadId/messages/:messageId/mark-read')
  @RequirePermissions({ entityType: 'EmailMessage', action: 'Update' })
  async markMessageAsRead(
    @Param('threadId') threadId: string,
    @Param('messageId') messageId: string,
  ) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    const message = await this.messageService.markAsRead(tenantId, messageId);

    return {
      success: true,
      data: message,
    };
  }

  /**
   * Mark all messages in thread as read
   * PUT /api/tenant/email-threads/:threadId/messages/mark-all-read
   */
  @Put(':threadId/messages/mark-all-read')
  @RequirePermissions({ entityType: 'EmailMessage', action: 'Update' })
  async markAllMessagesAsRead(@Param('threadId') threadId: string) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    await this.messageService.markThreadMessagesAsRead(tenantId, threadId);

    return {
      success: true,
      message: 'All messages marked as read',
    };
  }

  /**
   * Send message via Gmail
   * POST /api/tenant/email-threads/:threadId/messages/send-via-gmail
   */
  @Post(':threadId/messages/send-via-gmail')
  @RequirePermissions({ entityType: 'EmailMessage', action: 'Create' })
  async sendMessageViaGmail(
    @Param('threadId') threadId: string,
    @Body()
    body: {
      fromEmail: string;
      toEmail: string;
      subject: string;
      body: string;
      bodyHtml?: string;
      cc?: string;
      bcc?: string;
    },
  ) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    const gmailMessageId = await this.gmailSendService.sendViaGmail(
      tenantId,
      threadId,
      body.fromEmail,
      body.toEmail,
      body.subject,
      body.body,
      body.bodyHtml,
      body.cc,
      body.bcc,
    );

    return {
      success: true,
      message: 'Email enviado a través de Gmail',
      gmailMessageId,
    };
  }
}
