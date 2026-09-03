export declare class TenantContextService {
    private tenantId;
    private userId;
    setTenantContext(tenantId: string, userId: string | null): void;
    getCurrentTenantId(): string | null;
    getCurrentUserId(): string | null;
    hasContext(): boolean;
    clearContext(): void;
    validateContext(expectedTenantId?: string, expectedUserId?: string): boolean;
}
