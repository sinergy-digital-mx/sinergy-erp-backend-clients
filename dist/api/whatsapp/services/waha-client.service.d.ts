export declare class WahaError extends Error {
    readonly status: number;
    readonly detail?: string | undefined;
    constructor(message: string, status: number, detail?: string | undefined);
    get isNotFound(): boolean;
    get isSessionUnavailable(): boolean;
}
export interface WahaSession {
    name: string;
    status: string;
    me?: {
        id?: string;
        pushName?: string;
    } | null;
    config?: Record<string, unknown> | null;
}
export interface WahaServerVersion {
    version?: string;
    engine?: string;
    tier?: string;
}
export interface WahaSessionConfig {
    webhooks?: Array<Record<string, unknown>>;
    metadata?: Record<string, string>;
    [key: string]: unknown;
}
export declare class WahaClientService {
    private readonly logger;
    isConfigured(): boolean;
    serverVersion(): Promise<WahaServerVersion>;
    getSession(name: string): Promise<WahaSession>;
    createSession(name: string, config: WahaSessionConfig): Promise<WahaSession>;
    updateSession(name: string, config: WahaSessionConfig): Promise<WahaSession>;
    startSession(name: string): Promise<void>;
    stopSession(name: string): Promise<void>;
    restartSession(name: string): Promise<void>;
    logoutSession(name: string): Promise<void>;
    deleteSession(name: string): Promise<void>;
    getQr(name: string): Promise<{
        mimetype: string;
        data: string;
    }>;
    requestPairingCode(name: string, phoneNumber: string): Promise<string>;
    checkNumberExists(session: string, phone: string): Promise<{
        numberExists: boolean;
        chatId?: string | null;
    }>;
    startTyping(session: string, chatId: string): Promise<void>;
    stopTyping(session: string, chatId: string): Promise<void>;
    sendText(session: string, chatId: string, text: string): Promise<unknown>;
    sendFile(session: string, chatId: string, file: {
        url: string;
        filename?: string;
        mimetype?: string;
    }, caption?: string): Promise<unknown>;
    private baseUrl;
    private request;
    private raw;
}
