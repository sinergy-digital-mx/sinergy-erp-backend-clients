import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailThread } from '../../entities/email/email-thread.entity';
import { EmailMessage } from '../../entities/email/email-message.entity';
import { EmailThreadService } from './services/email-thread.service';
import { EmailMessageService } from './services/email-message.service';
import { GmailSendService } from './services/gmail-send.service';
import { EmailThreadController } from './controllers/email-thread.controller';
import { Lead } from '../../entities/leads/lead.entity';
import { RBACModule } from '../rbac/rbac.module';
import { ThirdPartyConfig } from '../../entities/integrations/third-party-config.entity';
import { EncryptionService } from '../integrations/services/encryption.service';
import { EntityRegistry } from '../../entities/entity-registry/entity-registry.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailThread, EmailMessage, Lead, ThirdPartyConfig, EntityRegistry]),
    RBACModule,
  ],
  providers: [EmailThreadService, EmailMessageService, GmailSendService, EncryptionService],
  controllers: [EmailThreadController],
  exports: [EmailThreadService, EmailMessageService, GmailSendService],
})
export class EmailModule {}
