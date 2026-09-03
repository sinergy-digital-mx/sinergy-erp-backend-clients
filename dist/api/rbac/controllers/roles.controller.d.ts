import { RoleService } from '../services/role.service';
import { TenantContextService } from '../services/tenant-context.service';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { AssignPermissionsDto } from '../dto/assign-permissions.dto';
import { ReplaceRolePermissionsDto } from '../dto/replace-role-permissions.dto';
export declare class RolesController {
    private roleService;
    private tenantContextService;
    constructor(roleService: RoleService, tenantContextService: TenantContextService);
    getRolesSummary(): Promise<{
        summary: {
            total_roles: number;
            roles_with_permissions: number;
            roles_without_permissions: number;
            total_permission_assignments: number;
        };
        roles: {
            id: string;
            name: string;
            permission_count: number;
            user_count: number;
            is_system_role: boolean;
        }[];
    }>;
    getAvailablePermissions(): Promise<{
        modules: import("../utils/group-modules-by-category.util").GroupedModuleItem[];
        categories: import("../utils/group-modules-by-category.util").ModuleCategoryGroup[];
    }>;
    getRoles(): Promise<{
        roles: {
            user_count: number;
            permission_count: number;
            id: string;
            name: string;
            description: string;
            is_system_role: boolean;
            is_admin: boolean;
            tenant: any;
            tenant_id: string;
            user_roles: any[];
            role_permissions: any[];
            created_at: Date;
            updated_at: Date;
        }[];
    }>;
    getAvailablePermissionsForRole(roleId: string): Promise<{
        role: {
            id: string;
            name: string;
        };
        modules: import("../utils/group-modules-by-category.util").GroupedModuleItem[];
        categories: import("../utils/group-modules-by-category.util").ModuleCategoryGroup[];
    }>;
    getRole(roleId: string): Promise<{
        role: {
            user_count: number;
            permission_count: number;
            id: string;
            name: string;
            description: string;
            is_system_role: boolean;
            is_admin: boolean;
            tenant: any;
            tenant_id: string;
            user_roles: any[];
            role_permissions: any[];
            created_at: Date;
            updated_at: Date;
        };
        permissions: {
            id: string;
            module: string;
            action: string;
            description: string;
        }[];
    }>;
    createRole(createRoleDto: CreateRoleDto): Promise<{
        role: import("..").Role;
        permissions: {
            id: string;
            module: string;
            action: string;
            description: string;
        }[];
    }>;
    updateRole(roleId: string, updateRoleDto: UpdateRoleDto): Promise<{
        role: import("..").Role;
        permissions: {
            id: string;
            module: string;
            action: string;
            description: string;
        }[];
    }>;
    deleteRole(roleId: string): Promise<void>;
    getRolePermissions(roleId: string): Promise<{
        role: {
            id: string;
            name: string;
        };
        permissions: {
            id: string;
            module: string;
            action: string;
            description: string;
        }[];
    }>;
    replaceRolePermissions(roleId: string, replaceRolePermissionsDto: ReplaceRolePermissionsDto): Promise<{
        role: {
            id: string;
            name: string;
        };
        permissions: {
            id: string;
            module: string;
            action: string;
            description: string;
        }[];
    }>;
    assignPermissionsToRole(roleId: string, assignPermissionsDto: AssignPermissionsDto): Promise<{
        permissions: {
            id: string;
            module: string;
            action: string;
            description: string;
        }[];
    }>;
    removePermissionFromRole(roleId: string, permissionId: string): Promise<void>;
}
