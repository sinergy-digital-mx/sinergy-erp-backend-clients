import { Product } from './product.entity';
import { ProductUoM } from './product-uom.entity';
export declare enum ProductDiscountType {
    PERCENTAGE = "percentage",
    FIXED = "fixed"
}
export declare class ProductDiscount {
    id: string;
    product: Product;
    product_id: string;
    name: string;
    discount_type: ProductDiscountType;
    value: number;
    product_uom: ProductUoM | null;
    product_uom_id: string | null;
    is_active: boolean;
    valid_from: Date | null;
    valid_to: Date | null;
    created_at: Date;
    updated_at: Date;
}
