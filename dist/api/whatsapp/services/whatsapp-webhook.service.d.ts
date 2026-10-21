import { WhatsappMessageService } from './whatsapp-message.service';
import { WhatsappSessionService } from './whatsapp-session.service';
interface WahaWebhookBody {
    event?: string;
    session?: string;
    me?: {
        id?: string;
        pushName?: string;
    } | null;
    payload?: Record<string, unknown>;
}
export declare class WhatsappWebhookService {
    private readonly sessions;
    private readonly messages;
    private readonly logger;
    constructor(sessions: WhatsappSessionService, messages: WhatsappMessageService);
    handle(body: WahaWebhookBody, rawBody: Buffer | string, hmac: string | undefined, algorithm: string | undefined): Promise<void>;
}
export {};
