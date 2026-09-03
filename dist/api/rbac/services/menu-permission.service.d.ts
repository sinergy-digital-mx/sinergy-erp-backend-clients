import { PermissionService } from './permission.service';
import { TenantContextService } from './tenant-context.service';
import { ModuleService } from './module.service';
export interface MenuItemPermission {
    moduleCode: string;
    moduleName: string;
    hasViewPermission: boolean;
    permissions: string[];
}
export declare class MenuPermissionService {
    private permissionService;
    private tenantContextService;
    private moduleService;
    private readonly logger;
    constructor(permissionService: PermissionService, tenantContextService: TenantContextService, moduleService: ModuleService);
    canViewMenu(moduleCode: string): Promise<boolean>;
    getVisibleModulesForCurrentUser(): Promise<MenuItemPermission[]>;
    getAuthorizedMenuStructure(): Promise<{
        modules: Array<{
            code: string;
            name: string;
            description?: string;
            permissions: string[];
        }>;
    }>;
    checkMultipleMenuPermissions(moduleCodes: string[]): Promise<Map<string, boolean>>;
    canViewMenuInCurrentContext(moduleCode: string): Promise<boolean>;
}
