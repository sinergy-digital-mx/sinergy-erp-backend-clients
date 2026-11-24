import { JwtPermissionUser } from '../../rbac/utils/jwt-permission.util';
export declare const POS_PRICE_DISCOUNT_ACTION = "ApplyPriceDiscount";
export interface PosPriceDiscountLine {
    product_id?: string | null;
    product_uom_id?: string | null;
    discount_percentage?: number | string | null;
    product_discount_id?: string | null;
}
export declare function isPosPriceDiscountLine(line: PosPriceDiscountLine | null | undefined): boolean;
export declare function assertPosPriceDiscountAllowed(user: JwtPermissionUser | null | undefined, incoming: PosPriceDiscountLine[] | null | undefined, existing?: PosPriceDiscountLine[] | null): void;
