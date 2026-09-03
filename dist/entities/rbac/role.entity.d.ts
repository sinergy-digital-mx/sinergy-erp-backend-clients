export declare class Role {
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
}
