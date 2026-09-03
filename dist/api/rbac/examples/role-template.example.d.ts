import { RoleTemplateService } from '../services/role-template.service';
import { RoleService } from '../services/role.service';
export declare class RoleTemplateExample {
    private roleTemplateService;
    private roleService;
    private readonly logger;
    constructor(roleTemplateService: RoleTemplateService, roleService: RoleService);
    createSystemRolesForNewTenant(tenantId: string): Promise<void>;
    createAdminRoleForTenant(tenantId: string): Promise<void>;
    createCustomSalesRole(tenantId: string): Promise<void>;
    updateRoleToMatchOperatorTemplate(roleId: string): Promise<void>;
    validateRoleAgainstTemplate(roleId: string, templateName: string): Promise<void>;
    listAvailableSystemTemplates(): void;
    createAndUseCustomTemplate(tenantId: string): Promise<void>;
    assignUsersToTemplateRoles(tenantId: string, userIds: string[]): Promise<void>;
    completeTenantSetup(tenantId: string, adminUserId: string): Promise<void>;
}
