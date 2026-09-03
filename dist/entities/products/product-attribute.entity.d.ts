import { ProductAttributeValue } from './product-attribute-value.entity';
export declare class ProductAttribute {
    id: string;
    tenant_id: string;
    name: string;
    is_active: boolean;
    values: ProductAttributeValue[];
    created_at: Date;
    updated_at: Date;
}
