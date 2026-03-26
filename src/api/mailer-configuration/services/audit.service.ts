import { Injectable, Logger } from '@nestjs/common';

/**
 * AuditService
 * Minimal audit service for Resend-only configuration
 */
@Injectable()
export class AuditService {
  private logger = new Logger('MailerConfigurationAudit');

  async recordAuditEvent(
    configurationId: string,
    tenantId: string,
    action: string,
    performedBy: string,
    details?: string,
  ): Promise<void> {
    this.logger.log(
      `[${action}] Config: ${configurationId}, Tenant: ${tenantId}, User: ${performedBy}, Details: ${details || 'N/A'}`,
    );
  }
}
