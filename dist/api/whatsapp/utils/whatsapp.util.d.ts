import { WhatsappConnectionState, WhatsappMessageStatus } from '../whatsapp.constants';
export declare function buildSessionName(tenantId: string): string;
export declare function normalizeWhatsappPhone(raw: string, defaultCountryCode?: string): string | null;
export declare function phoneFromWahaId(id?: string | null): string | null;
export declare function isWhatsappGroupId(value?: string | null): boolean;
export declare function normalizeWhatsappGroupId(raw: string): string | null;
export interface WhatsappGroupView {
    id: string;
    name: string;
    description: string | null;
}
export declare function mapWahaGroups(payload: unknown): WhatsappGroupView[];
export declare function toConnectionState(status?: string | null): WhatsappConnectionState;
export declare function ackToMessageStatus(ack: number | string | null | undefined, ackName?: string | null): WhatsappMessageStatus | null;
export declare function shouldAdvanceStatus(current: WhatsappMessageStatus, next: WhatsappMessageStatus): boolean;
export declare function extractWahaMessageId(payload: unknown): string | null;
export declare function deriveWebhookKey(secret: string, sessionName: string): string;
export declare function verifyWebhookHmac(rawBody: Buffer | string, key: string, receivedHmac: string | undefined, algorithm?: string): boolean;
export declare function isSafePublicHttpsUrl(value: string): boolean;
export declare function supportsMultipleSessions(version?: {
    version?: string;
    tier?: string;
} | null): boolean;
export declare function randomDelay(minMs: number, maxMs: number): number;
