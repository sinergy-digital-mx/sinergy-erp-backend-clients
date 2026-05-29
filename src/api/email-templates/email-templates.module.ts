import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailTemplate } from '../../entities/email-templates/email-template.entity';
import { TenantModule } from '../../entities/rbac/tenant-module.entity';
import { RBACTenant } from '../../entities/rbac/tenant.entity';
import { Payment } from '../../entities/contracts/payment.entity';
import { Contract } from '../../entities/contracts/contract.entity';
import { Customer } from '../../entities/customers/customer.entity';
import { Lead } from '../../entities/leads/lead.entity';
import { RBACModule } from '../rbac/rbac.module';
import { MailerConfigurationModule } from '../mailer-configuration/mailer-configuration.module';
import { EmailTemplatesController } from './email-templates.controller';
import { EmailTemplatesService } from './email-templates.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmailTemplate,
      TenantModule,
      RBACTenant,
      Payment,
      Contract,
      Customer,
      Lead,
    ]),
    RBACModule,
    MailerConfigurationModule,
  ],
  controllers: [EmailTemplatesController],
  providers: [EmailTemplatesService],
  exports: [EmailTemplatesService],
})
export class EmailTemplatesModule {}
