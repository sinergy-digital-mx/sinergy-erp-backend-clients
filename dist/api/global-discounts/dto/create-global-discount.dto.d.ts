import { GlobalDiscountType } from '../../../entities/global-discounts/global-discount.entity';
export declare class CreateGlobalDiscountDto {
    name: string;
    discount_type: GlobalDiscountType;
    value: number;
    is_active?: boolean;
    valid_from?: string | null;
    valid_to?: string | null;
}
