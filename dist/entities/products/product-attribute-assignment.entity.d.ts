import { Product } from './product.entity';
import { ProductAttributeValue } from './product-attribute-value.entity';
export declare class ProductAttributeAssignment {
    id: string;
    product: Product;
    product_id: string;
    attribute_value: ProductAttributeValue;
    attribute_value_id: string;
    created_at: Date;
    updated_at: Date;
}
