import { ModuleService } from '../services/module.service';
import { TenantService } from '../services/tenant.service';
import { Repository } from 'typeorm';
import { RBACTenant } from '../../../entities/rbac/tenant.entity';
import { Module } from '../../../entities/rbac/module.entity';
import { TenantModule } from '../../../entities/rbac/tenant-module.entity';
import { Permission } from '../../../entities/rbac/permission.entity';
export declare class AdminTenantModulesController {
    private readonly moduleService;
    private readonly tenantService;
    private tenantRepository;
    private moduleRepository;
    private tenantModuleRepository;
    private permissionRepository;
    constructor(moduleService: ModuleService, tenantService: TenantService, tenantRepository: Repository<RBACTenant>, moduleRepository: Repository<Module>, tenantModuleRepository: Repository<TenantModule>, permissionRepository: Repository<Permission>);
    getAllTenants(): Promise<{
        tenants: {
            id: string;
            name: string;
            subdomain: string;
            isActive: boolean;
            createdAt: Date;
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
    getTenantModules(tenantId: string): Promise<{
        error: string;
        tenant?: undefined;
        modules?: undefined;
    } | {
        tenant: {
            id: string;
            name: string;
            subdomain: string;
        };
        modules: {
            id: string;
            name: string;
            code: string;
            description: string;
            category: string | null;
            sort_order: number;
            isEnabled: boolean;
        }[];
        error?: undefined;
    }>;
    enableModule(tenantId: string, moduleId: string): Promise<{
        message: string;
        error?: undefined;
    } | {
        error: any;
        message?: undefined;
    }>;
    disableModule(tenantId: string, moduleId: string): Promise<{
        message: string;
        error?: undefined;
    } | {
        error: any;
        message?: undefined;
    }>;
    enableAllModules(tenantId: string): Promise<{
        message: string;
        total: number;
        error?: undefined;
    } | {
        error: any;
        message?: undefined;
        total?: undefined;
    }>;
    getAllPermissions(): Promise<{
        permissions: {
            id: string;
            entityType: string;
            action: string;
            description: string;
            moduleId: string;
            moduleName: any;
            moduleCode: any;
            isSystemPermission: boolean;
        }[];
    }>;
    getModulePermissions(moduleId: string): Promise<{
        error: string;
        module?: undefined;
        permissions?: undefined;
    } | {
        module: {
            id: string;
            name: string;
            code: string;
        };
        permissions: {
            id: any;
            entityType: any;
            action: any;
            description: any;
            isSystemPermission: any;
        }[];
        error?: undefined;
    }>;
    createPermission(moduleId: string, body: {
        action: string;
        description?: string;
    }): Promise<{
        error: string;
        hint: string;
        message?: undefined;
        permission?: undefined;
    } | {
        message: string;
        permission: {
            id: string;
            entityType: string;
            action: string;
            description: string;
        };
        error?: undefined;
        hint?: undefined;
    } | {
        error: any;
        hint?: undefined;
        message?: undefined;
        permission?: undefined;
    }>;
    updatePermission(permissionId: string, body: {
        action?: string;
        description?: string;
    }): Promise<{
        message: string;
        permission: {
            id: string;
            entityType: any;
            action: string;
            description: string;
        };
        error?: undefined;
    } | {
        error: any;
        message?: undefined;
        permission?: undefined;
    }>;
    deletePermission(permissionId: string): Promise<{
        message: string;
        error?: undefined;
    } | {
        error: any;
        message?: undefined;
    }>;
}
