import { TenantContextService } from '../rbac/services/tenant-context.service';
import { QueryWhatsappMessagesDto, SendWhatsappFileDto, SendWhatsappTextDto, WhatsappPairingCodeDto } from './dto/whatsapp.dto';
import { WhatsappMessageService } from './services/whatsapp-message.service';
import { WhatsappSessionService } from './services/whatsapp-session.service';
export declare class WhatsappController {
    private readonly sessions;
    private readonly messages;
    private readonly tenantContext;
    constructor(sessions: WhatsappSessionService, messages: WhatsappMessageService, tenantContext: TenantContextService);
    status(): Promise<import("./services/whatsapp-session.service").WhatsappSessionView>;
    connect(): Promise<import("./services/whatsapp-session.service").WhatsappSessionView>;
    qr(): Promise<import("./services/whatsapp-session.service").WhatsappSessionView & {
        qr_data_url: string | null;
    }>;
    pairingCode(dto: WhatsappPairingCodeDto): Promise<{
        code: string;
    }>;
    restart(): Promise<import("./services/whatsapp-session.service").WhatsappSessionView>;
    logout(): Promise<import("./services/whatsapp-session.service").WhatsappSessionView>;
    remove(): Promise<{
        ok: boolean;
    }>;
    groups(): Promise<{
        data: import("./utils/whatsapp.util").WhatsappGroupView[];
    }>;
    sendText(dto: SendWhatsappTextDto): Promise<import("./services/whatsapp-message.service").WhatsappMessageView>;
    sendFile(dto: SendWhatsappFileDto): Promise<import("./services/whatsapp-message.service").WhatsappMessageView>;
    list(query: QueryWhatsappMessagesDto): Promise<{
        data: import("./services/whatsapp-message.service").WhatsappMessageView[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    }>;
    findOne(id: string): Promise<import("./services/whatsapp-message.service").WhatsappMessageView>;
    private tenantId;
    private userId;
}
