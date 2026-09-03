import { RBACTenant } from '../rbac/tenant.entity';
export declare class PropertyGroup {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    name: string;
    description: string;
    location: string;
    total_area: number;
    total_properties: number;
    available_properties: number;
    sold_properties: number;
    created_at: Date;
    updated_at: Date;
}
