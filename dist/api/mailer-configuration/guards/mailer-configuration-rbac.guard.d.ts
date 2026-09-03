import { CanActivate, ExecutionContext } from '@nestjs/common';
import { MailerConfigurationService } from '../services/mailer-configuration.service';
export declare class MailerConfigurationRbacGuard implements CanActivate {
    private readonly service;
    private readonly logger;
    constructor(service: MailerConfigurationService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
