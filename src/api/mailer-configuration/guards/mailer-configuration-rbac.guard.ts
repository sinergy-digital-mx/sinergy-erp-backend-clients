import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { MailerConfigurationService } from '../services/mailer-configuration.service';

/**
 * Guard that verifies tenant ownership of mailer configurations
 * This guard ensures that users can only access configurations belonging to their tenant
 */
@Injectable()
export class MailerConfigurationRbacGuard implements CanActivate {
  private readonly logger = new Logger(MailerConfigurationRbacGuard.name);

  constructor(private readonly service: MailerConfigurationService) {}

  /**
   * Validates that the configuration belongs to the requesting tenant
   * @param context - The execution context containing request information
   * @returns Promise<boolean> - True if access is granted, false otherwise
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const configId = request.params.id;

    // If no config ID in params, allow (e.g., for create or list operations)
    if (!configId) {
      return true;
    }

    if (!user || !user.tenant_id) {
      this.logger.warn('No user or tenant context found in request');
      throw new ForbiddenException('Tenant context is required');
    }

    try {
      // Verify the configuration belongs to the tenant
      const config = await this.service.findById(user.tenant_id, configId);

      if (!config) {
        this.logger.warn(
          `Configuration ${configId} not found for tenant ${user.tenant_id}`,
        );
        throw new ForbiddenException('Configuration not found or access denied');
      }

      // Attach configuration to request for potential use in controller
      request.mailerConfiguration = config;

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      this.logger.error(
        `Error verifying configuration ownership: ${error.message}`,
        error.stack,
      );
      throw new ForbiddenException('Failed to verify configuration access');
    }
  }
}
