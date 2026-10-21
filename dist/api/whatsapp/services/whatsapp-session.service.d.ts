import { Repository } from 'typeorm';
import { WhatsappSession } from '../../../entities/whatsapp/whatsapp-session.entity';
import { WhatsappConnectionState } from '../whatsapp.constants';
import { WahaClientService } from './waha-client.service';
export interface WhatsappSessionView {
    configured: boolean;
    service_available: boolean;
    state: WhatsappConnectionState;
    status: string | null;
    phone_number: string | null;
    push_name: string | null;
    connected_at: Date | null;
    last_status_at: Date | null;
    last_error: string | null;
}
export type WhatsappSessionMode = 'single' | 'multi';
export declare class WhatsappSessionService {
    private readonly sessionRepo;
    private readonly waha;
    private readonly logger;
    private modeCache;
    constructor(sessionRepo: Repository<WhatsappSession>, waha: WahaClientService);
    getStatus(tenantId: string): Promise<WhatsappSessionView>;
    connect(tenantId: string, userId: string): Promise<WhatsappSessionView>;
    qr(tenantId: string): Promise<WhatsappSessionView & {
        qr_data_url: string | null;
    }>;
    pairingCode(tenantId: string, phone: string): Promise<{
        code: string;
    }>;
    restart(tenantId: string, userId: string): Promise<WhatsappSessionView>;
    logout(tenantId: string, userId: string): Promise<WhatsappSessionView>;
    remove(tenantId: string): Promise<void>;
    requireConnected(tenantId: string): Promise<WhatsappSession>;
    findBySessionName(sessionName: string): Promise<WhatsappSession | null>;
    applyWebhookStatus(sessionName: string, status: string | undefined, me?: {
        id?: string;
        pushName?: string;
    } | null): Promise<void>;
    markUnavailable(sessionName: string, reason: string): Promise<void>;
    mode(): Promise<WhatsappSessionMode>;
    private findByTenant;
    private requireRow;
    private ensureRow;
    private fetchSession;
    private refresh;
    private markMissing;
    private applySession;
    private sessionConfig;
    private assertServiceConfigured;
    private emptyView;
    private toView;
}
export declare function webhookSecret(): string | null;
