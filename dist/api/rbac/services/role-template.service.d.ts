import { Repository } from 'typeorm';
import { Role } from '../../../entities/rbac/role.entity';
import { Permission } from '../../../entities/rbac/permission.entity';
import { RolePermission } from '../../../entities/rbac/role-permission.entity';
import { EntityRegistry } from '../../../entities/entity-registry/entity-registry.entity';
import { RoleTemplate } from '../templates/role-templates';
import { PermissionService } from './permission.service';
export interface RoleCreationResult {
    role: Role | null;
    permissionsCreated: number;
    permissionsAssigned: number;
    warnings: string[];
}
export interface BulkRoleCreationResult {
    roles: RoleCreationResult[];
    totalRoles: number;
    totalPermissions: number;
    errors: string[];
}
export declare class RoleTemplateService {
    private roleRepository;
    private permissionRepository;
    private rolePermissionRepository;
    private entityRegistryRepository;
    private permissionService;
    private readonly logger;
    constructor(roleRepository: Repository<Role>, permissionRepository: Repository<Permission>, rolePermissionRepository: Repository<RolePermission>, entityRegistryRepository: Repository<EntityRegistry>, permissionService: PermissionService);
    createRoleFromTemplate(template: RoleTemplate, tenantId: string, skipExisting?: boolean): Promise<RoleCreationResult>;
    createSystemRolesForTenant(tenantId: string, skipExisting?: boolean): Promise<BulkRoleCreationResult>;
    createRoleFromSystemTemplate(templateName: string, tenantId: string, skipExisting?: boolean): Promise<RoleCreationResult>;
    createRoleFromCustomTemplate(name: string, description: string, permissions: Array<{
        entityType: string;
        actions: string[];
    }>, tenantId: string, isSystemRole?: boolean): Promise<RoleCreationResult>;
    getSystemRoleTemplates(): RoleTemplate[];
    getSystemRoleTemplate(name: string): RoleTemplate | undefined;
    updateRoleToMatchTemplate(roleId: string, template: RoleTemplate): Promise<RoleCreationResult>;
    validateRoleAgainstTemplate(roleId: string, template: RoleTemplate): Promise<{
        matches: boolean;
        missingPermissions: string[];
        extraPermissions: string[];
    }>;
    private createAndAssignPermissions;
    private getRolePermissions;
    private getAvailableEntityTypes;
}
