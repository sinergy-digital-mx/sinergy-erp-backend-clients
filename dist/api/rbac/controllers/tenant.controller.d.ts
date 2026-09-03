import { TenantService } from '../services/tenant.service';
export declare class CreateTenantDto {
    name: string;
    subdomain: string;
    isActive?: boolean;
    skipSystemRoles?: boolean;
    customRoleTemplates?: Array<{
        name: string;
        description: string;
        permissions: Array<{
            entityType: string;
            actions: string[];
        }>;
    }>;
}
export declare class UpdateTenantStatusDto {
    isActive: boolean;
}
export declare class TenantController {
    private readonly tenantService;
    private readonly logger;
    constructor(tenantService: TenantService);
    createTenant(createTenantDto: CreateTenantDto): Promise<{
        message: string;
        tenant: any;
        systemRoles: {
            totalRoles: number;
            totalPermissions: number;
            errors: string[];
        };
        customRoles: {
            totalRoles: number;
            totalPermissions: number;
            errors: string[];
        };
        warnings: string[];
    }>;
    getTenant(tenantId: string): Promise<{
        tenant: any;
    }>;
    initializeRoles(tenantId: string): Promise<{
        message: string;
        systemRoles: {
            totalRoles: number;
            totalPermissions: number;
            errors: string[];
        };
        customRoles: {
            totalRoles: number;
            totalPermissions: number;
            errors: string[];
        };
    }>;
    updateTenantStatus(tenantId: string, updateStatusDto: UpdateTenantStatusDto): Promise<{
        message: string;
        tenant: any;
    }>;
    deleteTenant(tenantId: string, request: any): Promise<{
        message: string;
        deletionResult: {
            tenantId: string;
            tenantName: string;
            deletedAt: Date;
            cascadeResults: {
                userRoles: number;
                rolePermissions: number;
                roles: number;
                auditLogs: number;
            };
            warnings: string[];
        };
    }>;
    validateOrphanedReferences(tenantId: string): Promise<{
        tenantId: string;
        warnings: string[];
        isValid: boolean;
    }>;
}
