import { ProductDiscount, ProductDiscountType } from '../../../entities/products/product-discount.entity';
export interface ProductDiscountLineAmounts {
    discount_percentage: number;
    discount_unit: number;
    line_discount: number;
}
export interface ApplicableProductDiscountSummary {
    id: string;
    name: string;
    discount_type: ProductDiscountType;
    value: number;
    product_uom_id: string | null;
}
export declare function isProductDiscountApplicable(discount: Pick<ProductDiscount, 'is_active' | 'valid_from' | 'valid_to' | 'product_uom_id'>, productUomId: string, referenceDate?: Date): boolean;
export declare function calculateProductDiscountLineAmounts(unitPrice: number, quantity: number, discount: Pick<ProductDiscount, 'discount_type' | 'value'>): ProductDiscountLineAmounts;
export declare function mapApplicableProductDiscount(discount: ProductDiscount): ApplicableProductDiscountSummary;
export declare function assertProductDiscountApplicable(discount: ProductDiscount, productId: string, productUomId: string): void;
