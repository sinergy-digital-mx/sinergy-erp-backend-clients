import { GlobalDiscount, GlobalDiscountType } from '../../../entities/global-discounts/global-discount.entity';
export interface ApplicableGlobalDiscountSummary {
    id: string;
    name: string;
    discount_type: GlobalDiscountType;
    value: number;
}
export declare function isGlobalDiscountApplicable(discount: Pick<GlobalDiscount, 'is_active' | 'valid_from' | 'valid_to'>, referenceDate?: Date): boolean;
export declare function calculateGlobalDiscountAmount(netSubtotal: number, discount: Pick<GlobalDiscount, 'discount_type' | 'value'>): number;
export declare function mapApplicableGlobalDiscount(discount: GlobalDiscount): ApplicableGlobalDiscountSummary;
export declare function assertGlobalDiscountApplicable(discount: GlobalDiscount): void;
