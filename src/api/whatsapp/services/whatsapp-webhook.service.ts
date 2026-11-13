import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ackToMessageStatus, deriveWebhookKey, verifyWebhookHmac } from '../utils/whatsapp.util';
import { WhatsappMessageService } from './whatsapp-message.service';
import { WhatsappSessionService, webhookSecret } from './whatsapp-session.service';

interface WahaWebhookBody {
  event?: string;
  session?: string;
  me?: { id?: string; pushName?: string } | null;
  payload?: Record<string, unknown>;
}

@Injectable()
export class WhatsappWebhookService {
  private readonly logger = new Logger(WhatsappWebhookService.name);

  constructor(
    private readonly sessions: WhatsappSessionService,
    private readonly messages: WhatsappMessageService,
  ) {}

  async handle(
    body: WahaWebhookBody,
    rawBody: Buffer | string,
    hmac: string | undefined,
    algorithm: string | undefined,
  ): Promise<void> {
    const sessionName = typeof body?.session === 'string' ? body.session : '';
    const secret = webhookSecret();
    if (!sessionName || !secret) throw new UnauthorizedException('Firma inválida.');
    const key = deriveWebhookKey(secret, sessionName);
    if (!verifyWebhookHmac(rawBody, key, hmac, algorithm)) {
      this.logger.warn(`Webhook con firma inválida para la sesión ${sessionName}`);
      throw new UnauthorizedException('Firma inválida.');
    }

    switch (body.event) {
      case 'session.status': {
        const status = typeof body.payload?.status === 'string' ? body.payload.status : undefined;
        await this.sessions.applyWebhookStatus(sessionName, status, body.me);
        break;
      }
      case 'message.ack': {
        const payload = body.payload ?? {};
        const id = typeof payload.id === 'string' ? payload.id : null;
        if (!id || payload.fromMe === false) break;
        const next = ackToMessageStatus(
          payload.ack as number | string | undefined,
          payload.ackName as string | undefined,
        );
        if (next) await this.messages.applyAck(sessionName, id, next);
        break;
      }
      default:
        break;
    }
  }
}
