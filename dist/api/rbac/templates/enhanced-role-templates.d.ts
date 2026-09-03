import { RoleTemplate } from './role-templates';
export declare const BUSINESS_ROLE_TEMPLATES: RoleTemplate[];
export declare function getBusinessRoleTemplates(): RoleTemplate[];
export declare function getAllRoleTemplates(): RoleTemplate[];
export declare function getAnyRoleTemplateByName(name: string): RoleTemplate | undefined;
export declare function getRoleTemplatesByCategory(category?: 'system' | 'business' | 'all'): RoleTemplate[];
export declare function createDepartmentRoleTemplate(departmentName: string, permissions: Array<{
    entityType: string;
    actions: string[];
}>, description?: string): RoleTemplate;
export declare const PERMISSION_SETS: {
    FULL_CUSTOMER_ACCESS: {
        entityType: string;
        actions: string[];
    };
    READ_ONLY_CUSTOMER: {
        entityType: string;
        actions: string[];
    };
    FULL_LEAD_ACCESS: {
        entityType: string;
        actions: string[];
    };
    LEAD_MANAGEMENT: {
        entityType: string;
        actions: string[];
    };
    FULL_ACTIVITY_ACCESS: {
        entityType: string;
        actions: string[];
    };
    ACTIVITY_MANAGEMENT: {
        entityType: string;
        actions: string[];
    };
    READ_ONLY_ACTIVITY: {
        entityType: string;
        actions: string[];
    };
    USER_MANAGEMENT: {
        entityType: string;
        actions: string[];
    };
    REPORTING_ACCESS: {
        entityType: string;
        actions: string[];
    };
    AUDIT_ACCESS: {
        entityType: string;
        actions: string[];
    };
    EMAIL_THREAD_MANAGEMENT: {
        entityType: string;
        actions: string[];
    };
    EMAIL_MESSAGE_MANAGEMENT: {
        entityType: string;
        actions: string[];
    };
    EMAIL_READ_ONLY: {
        entityType: string;
        actions: string[];
    };
};
export declare function buildRoleFromPermissionSets(name: string, description: string, permissionSetKeys: (keyof typeof PERMISSION_SETS)[]): RoleTemplate;
