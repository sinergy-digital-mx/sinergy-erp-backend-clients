import { Repository } from 'typeorm';
import { Module } from '../../../entities/rbac/module.entity';
import { TenantModule } from '../../../entities/rbac/tenant-module.entity';
import { Permission } from '../../../entities/rbac/permission.entity';
import { TenantContextService } from './tenant-context.service';
import { PermissionVersionService } from './permission-version.service';
import { PermissionCacheService } from './permission-cache.service';
export declare class ModuleService {
    private moduleRepository;
    private tenantModuleRepository;
    private permissionRepository;
    private tenantContextService;
    private permissionVersionService;
    private permissionCacheService;
    private readonly logger;
    constructor(moduleRepository: Repository<Module>, tenantModuleRepository: Repository<TenantModule>, permissionRepository: Repository<Permission>, tenantContextService: TenantContextService, permissionVersionService: PermissionVersionService, permissionCacheService: PermissionCacheService);
    refreshTenantUserPermissionVersions(tenantId: string): Promise<void>;
    getEnabledModulesForCurrentTenant(): Promise<{
        modules: {
            id: string;
            name: string;
            code: string;
            description: string;
            category: string | null;
            category_label: string;
            sort_order: number;
            is_enabled: boolean;
            permissions: {
                id: any;
                action: any;
                description: any;
            }[];
        }[];
    }>;
    getAllModules(): Promise<{
        modules: {
            id: string;
            name: string;
            code: string;
            description: string;
            category: string | null;
            category_label: string;
            sort_order: number;
            permissions: {
                id: any;
                action: any;
                description: any;
            }[];
        }[];
    }>;
    createModule(data: {
        name: string;
        code: string;
        description?: string;
        category?: string;
        sort_order?: number;
    }): Promise<Module>;
    createPermissionForModule(moduleId: string, data: {
        action: string;
        description?: string;
    }): Promise<Permission>;
    enableModuleForTenant(tenantId: string, moduleId: string, options?: {
        skipPermissionRefresh?: boolean;
    }): Promise<TenantModule>;
    disableModuleForTenant(tenantId: string, moduleId: string): Promise<TenantModule>;
    getModuleByCode(code: string): Promise<Module>;
}
