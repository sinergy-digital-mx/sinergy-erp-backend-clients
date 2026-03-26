import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResendConfiguration } from '../../entities/mailer-configuration/resend-configuration.entity';
import { MailerConfigurationService } from './services/mailer-configuration.service';
import { MailerConfigurationEncryptionService } from './services/encryption.service';
import { AuditService } from './services/audit.service';
import { MailerConfigurationRepository } from './repositories/mailer-configuration.repository';
import { MailerConfigurationController } from './controllers/mailer-configuration.controller';
import { MailerConfigurationRbacGuard } from './guards/mailer-configuration-rbac.guard';
import { RBACModule } from '../rbac/rbac.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ResendConfiguration]),
    RBACModule.forFeature(),
  ],
  controllers: [MailerConfigurationController],
  providers: [
    MailerConfigurationService,
    MailerConfigurationEncryptionService,
    AuditService,
    MailerConfigurationRepository,
    MailerConfigurationRbacGuard,
  ],
  exports: [MailerConfigurationService, MailerConfigurationEncryptionService],
})
export class MailerConfigurationModule {}
