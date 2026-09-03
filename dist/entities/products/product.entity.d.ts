import { RBACTenant } from '../rbac/tenant.entity';
import { Category } from '../categories/category.entity';
import { Subcategory } from '../categories/subcategory.entity';
export declare class Product {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    sku: string;
    external_sku: string | null;
    name: string;
    description: string;
    photo: string | null;
    is_active: boolean;
    category: Category | null;
    category_id: string | null;
    subcategory: Subcategory | null;
    subcategory_id: string | null;
    sat_clave: string | null;
    created_at: Date;
    updated_at: Date;
}
