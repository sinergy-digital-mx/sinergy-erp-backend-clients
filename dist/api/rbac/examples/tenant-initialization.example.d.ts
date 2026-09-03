import { TenantService } from '../services/tenant.service';
export declare class TenantInitializationExample {
    private readonly tenantService;
    private readonly logger;
    constructor(tenantService: TenantService);
    createBasicTenant(): Promise<void>;
    createTenantWithCustomRoles(): Promise<void>;
    createTenantWithoutSystemRoles(): Promise<void>;
    initializeRolesForExistingTenant(tenantId: string): Promise<void>;
    completeTenantSetupWorkflow(tenantName: string, subdomain: string, adminUserId?: string): Promise<string>;
    demonstrateErrorHandling(): Promise<void>;
}
