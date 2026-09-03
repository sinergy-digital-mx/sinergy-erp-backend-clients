export interface CustomRoleTemplate {
    name: string;
    description: string;
    permissions: Array<{
        entityType: string;
        actions: string[];
    }>;
}
export interface RBACConfig {
    customRoleTemplates: CustomRoleTemplate[];
    tenantInitialization: {
        autoCreateSystemRoles: boolean;
        autoCreateCustomRoles: boolean;
    };
    permissions: {
        cacheTimeout: number;
        defaultActions: string[];
    };
}
declare const _default: (() => RBACConfig) & import("@nestjs/config").ConfigFactoryKeyHost<RBACConfig>;
export default _default;
export declare function parseCustomRoleTemplatesFromEnv(): CustomRoleTemplate[];
