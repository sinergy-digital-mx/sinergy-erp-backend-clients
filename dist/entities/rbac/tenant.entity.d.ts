export declare class RBACTenant {
    id: string;
    name: string;
    subdomain: string;
    legacy_tenant_id?: string;
    is_active: boolean;
    roles: any[];
    user_roles: any[];
    created_at: Date;
    updated_at: Date;
}
