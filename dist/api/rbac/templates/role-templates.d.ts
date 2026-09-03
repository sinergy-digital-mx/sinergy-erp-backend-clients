export interface RoleTemplate {
    name: string;
    description: string;
    permissions: Array<{
        entityType: string;
        actions: string[];
    }>;
    isSystemRole?: boolean;
}
export declare const SYSTEM_ROLE_TEMPLATES: RoleTemplate[];
export declare function getSystemRoleTemplates(): RoleTemplate[];
export declare function getRoleTemplateByName(name: string): RoleTemplate | undefined;
export declare function validateRoleTemplate(template: RoleTemplate): boolean;
export declare function getSupportedActions(): string[];
export declare function validateAction(action: string): boolean;
export declare function expandWildcardPermissions(template: RoleTemplate, availableEntityTypes: string[]): RoleTemplate;
export declare function createCustomRoleTemplate(name: string, description: string, permissions: Array<{
    entityType: string;
    actions: string[];
}>, isSystemRole?: boolean): RoleTemplate;
