import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { WhatsappWebhookService } from './services/whatsapp-webhook.service';
export declare class WhatsappWebhookController {
    private readonly service;
    constructor(service: WhatsappWebhookService);
    receive(req: RawBodyRequest<Request>, body: Record<string, unknown>, hmac?: string, algorithm?: string): Promise<{
        ok: boolean;
    }>;
}
