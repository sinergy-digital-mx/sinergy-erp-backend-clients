import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhatsappMessage } from '../../entities/whatsapp/whatsapp-message.entity';
import { WhatsappSession } from '../../entities/whatsapp/whatsapp-session.entity';
import { AuthModule } from '../auth/auth.module';
import { RBACModule } from '../rbac/rbac.module';
import { WahaClientService } from './services/waha-client.service';
import { WhatsappMessageService } from './services/whatsapp-message.service';
import { WhatsappSessionService } from './services/whatsapp-session.service';
import { WhatsappWebhookService } from './services/whatsapp-webhook.service';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappWebhookController } from './whatsapp-webhook.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WhatsappSession, WhatsappMessage]), AuthModule, RBACModule],
  controllers: [WhatsappController, WhatsappWebhookController],
  providers: [
    WahaClientService,
    WhatsappSessionService,
    WhatsappMessageService,
    WhatsappWebhookService,
  ],
  exports: [WhatsappMessageService, WhatsappSessionService],
})
export class WhatsappModule {}
