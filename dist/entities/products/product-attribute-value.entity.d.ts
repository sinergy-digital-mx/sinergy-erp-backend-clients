import { ProductAttribute } from './product-attribute.entity';
export declare class ProductAttributeValue {
    id: string;
    attribute: ProductAttribute;
    attribute_id: string;
    value: string;
    display_order: number;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
