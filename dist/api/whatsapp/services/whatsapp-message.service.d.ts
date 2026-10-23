import { OnApplicationBootstrap } from '@nestjs/common';
import { Repository } from 'typeorm';
import { WhatsappMessage } from '../../../entities/whatsapp/whatsapp-message.entity';
import { QueryWhatsappMessagesDto, SendWhatsappFileDto, SendWhatsappTextDto } from '../dto/whatsapp.dto';
import { WhatsappMessageStatus } from '../whatsapp.constants';
import { WahaClientService } from './waha-client.service';
import { WhatsappSessionService } from './whatsapp-session.service';
export interface WhatsappMessageView {
    id: string;
    to_phone: string;
    chat_id: string | null;
    destination: 'phone' | 'group';
    type: string;
    body: string | null;
    file_name: string | null;
    status: string;
    error_message: string | null;
    reference_type: string | null;
    reference_id: string | null;
    sent_at: Date | null;
    delivered_at: Date | null;
    read_at: Date | null;
    created_by: string;
    created_at: Date;
}
export declare class WhatsappMessageService implements OnApplicationBootstrap {
    private readonly messageRepo;
    private readonly sessions;
    private readonly waha;
    private readonly logger;
    private readonly chains;
    private readonly files;
    constructor(messageRepo: Repository<WhatsappMessage>, sessions: WhatsappSessionService, waha: WahaClientService);
    onApplicationBootstrap(): void;
    sendText(tenantId: string, userId: string, dto: SendWhatsappTextDto): Promise<WhatsappMessageView>;
    sendFile(tenantId: string, userId: string, dto: SendWhatsappFileDto): Promise<WhatsappMessageView>;
    sendBuffer(tenantId: string, userId: string, input: {
        phone?: string;
        group_id?: string;
        data: Buffer;
        file_name: string;
        mimetype: string;
        caption?: string | null;
        reference_type?: string | null;
        reference_id?: string | null;
    }): Promise<WhatsappMessageView>;
    list(tenantId: string, query: QueryWhatsappMessagesDto): Promise<{
        data: WhatsappMessageView[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    }>;
    findOne(tenantId: string, id: string): Promise<WhatsappMessageView>;
    applyAck(sessionName: string, wahaMessageId: string, next: WhatsappMessageStatus): Promise<void>;
    private enqueue;
    private assertDailyLimit;
    private schedule;
    private process;
    private simulateTyping;
    private fail;
    private recover;
    private resolveDestination;
    private resolveChatId;
    private toView;
}
