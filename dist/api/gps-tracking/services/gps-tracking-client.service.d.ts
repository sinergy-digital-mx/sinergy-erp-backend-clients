import { NormalizedGpsUnit } from '../utils/gps-tracking.util';
export declare class GpsProviderError extends Error {
    readonly code?: string | undefined;
    constructor(message: string, code?: string | undefined);
}
interface SessionToken {
    userIdGuid: string;
    sessionId: string;
    expiresAt: number;
}
export declare class GpsTrackingClientService {
    private readonly logger;
    private readonly sessions;
    invalidate(configId: string): void;
    session(configId: string, username: string, password: string): Promise<SessionToken>;
    authenticate(username: string, password: string): Promise<{
        userIdGuid: string;
        sessionId: string;
    }>;
    latestPositions(token: Pick<SessionToken, 'userIdGuid' | 'sessionId'>, since?: Date): Promise<NormalizedGpsUnit[]>;
    listUnits(token: Pick<SessionToken, 'userIdGuid' | 'sessionId'>): Promise<Array<{
        uid: string;
        name: string;
        imei: string | null;
    }>>;
    private readUnits;
    private get;
    private toError;
}
export {};
