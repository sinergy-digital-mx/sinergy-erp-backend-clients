import { CreateSalesOrderDto } from '../dto/create-sales-order.dto';
interface CloneSourceLine {
    id: string;
    product_id: string;
    product_uom_id: string;
    quantity: number | string;
    unit_price: number | string;
    discount_percentage?: number | string | null;
    product_discount_id?: string | null;
    iva_percentage?: number | string | null;
    ieps_percentage?: number | string | null;
    custom_description?: string | null;
}
export interface CloneSourceOrder {
    fiscal_configuration_id: string;
    billing_branch_id: string | null;
    customer_id: number;
    sales_order_type: string;
    currency: string;
    sale_scope: string;
    fiscal_razon_social?: string | null;
    notes?: string | null;
    seller_user_id?: string | null;
    assigned_seller_user_id?: string | null;
    global_discount_id?: string | null;
    requires_selection_assembly?: boolean | null;
    line_items?: CloneSourceLine[];
}
export interface CloneLineOverride {
    line_id: string;
    custom_description?: string;
    unit_price?: number;
}
export interface CloneOverrides {
    lines?: CloneLineOverride[];
    notes?: string;
    expected_delivery_date?: string;
}
export declare function buildCloneSalesOrderDto(source: CloneSourceOrder, overrides: CloneOverrides, today: string): CreateSalesOrderDto;
interface CarryLine {
    product_id: string;
    product_uom_id: string;
    custom_description?: string | null;
}
export declare function carryOverCustomDescriptions(previous: CarryLine[], incoming: Array<{
    product_id: string;
    product_uom_id: string;
    custom_description?: string;
}>): void;
export {};
