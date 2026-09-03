export declare class AuditService {
    private logger;
    recordAuditEvent(configurationId: string, tenantId: string, action: string, performedBy: string, details?: string): Promise<void>;
}
