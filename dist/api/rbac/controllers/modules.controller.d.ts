import { ModuleService } from '../services/module.service';
import { MenuPermissionService } from '../services/menu-permission.service';
export declare class ModulesController {
    private moduleService;
    private menuPermissionService;
    constructor(moduleService: ModuleService, menuPermissionService: MenuPermissionService);
    getEnabledModules(): Promise<{
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
    getVisibleMenuItems(): Promise<{
        modules: Array<{
            code: string;
            name: string;
            description?: string;
            permissions: string[];
        }>;
    }>;
    getMenuPermissions(): Promise<import("../services/menu-permission.service").MenuItemPermission[]>;
}
