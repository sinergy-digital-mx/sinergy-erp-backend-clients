import { ProductDiscountType } from '../../../entities/products/product-discount.entity';
export declare class CreateProductDiscountDto {
    name: string;
    discount_type: ProductDiscountType;
    value: number;
    product_uom_id?: string | null;
    is_active?: boolean;
    valid_from?: string | null;
    valid_to?: string | null;
}
