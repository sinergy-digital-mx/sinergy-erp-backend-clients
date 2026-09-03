import { SalesOrder } from '../../../entities/sales-orders/sales-order.entity';
import { SalesOrderDetail } from '../../../entities/sales-orders/sales-order-detail.entity';
import { ProductDiscountType } from '../../../entities/products/product-discount.entity';
import { GlobalDiscountType } from '../../../entities/global-discounts/global-discount.entity';
export interface SalesOrderAppliedLineDiscountDto {
    line_item_id: string;
    product_id: string;
    product_name: string;
    product_sku: string | null;
    product_discount_id: string;
    discount_name: string;
    discount_type: ProductDiscountType;
    discount_value: number;
    quantity: number;
    discount_unit: number;
    discount_amount: number;
}
export interface SalesOrderAppliedGlobalDiscountDto {
    global_discount_id: string;
    discount_name: string;
    discount_type: GlobalDiscountType;
    discount_value: number;
    discount_amount: number;
}
export declare function mapAppliedLineDiscountsFromOrder(order: Pick<SalesOrder, 'line_items'>): SalesOrderAppliedLineDiscountDto[];
export declare function mapAppliedGlobalDiscountFromOrder(order: Pick<SalesOrder, 'global_discount_id' | 'global_discount_amount' | 'global_discount'>): SalesOrderAppliedGlobalDiscountDto | null;
export declare function mapAppliedDiscountsFromOrder(order: Pick<SalesOrder, 'line_items'>): SalesOrderAppliedLineDiscountDto[];
export declare function mapLineItemWithDiscount(item: SalesOrderDetail): {
    line_subtotal: number;
    line_discount_amount: number;
    line_iva: number;
    line_ieps: number;
    line_total: number;
    applied_product_discount: {
        id: string;
        name: string | null;
        discount_type: ProductDiscountType | null;
        value: number | null;
    } | null;
    id: string;
    sales_order: SalesOrder;
    sales_order_id: string;
    product: import("../../../entities/products").Product;
    product_id: string;
    product_uom: import("../../../entities/products").ProductUoM;
    product_uom_id: string;
    quantity: number;
    quantity_base_uom: number;
    base_uom: import("../../../entities/uom-catalog/uom-catalog.entity").UoMCatalog;
    base_uom_id: string;
    unit_price: number;
    discount_percentage: number;
    discount_unit: number;
    product_discount: import("../../../entities/products/product-discount.entity").ProductDiscount | null;
    product_discount_id: string | null;
    iva_percentage: number;
    iva_unit: number;
    ieps_percentage: number;
    ieps_unit: number;
    created_by: string;
    created_at: Date;
    updated_by: string;
    updated_at: Date;
    batch_allocations: import("../../../entities/sales-orders").SalesOrderBatchAllocation[];
};
export declare function mapOrderDiscountSummary(order: SalesOrder): {
    line_discount_total: number;
    global_discount_amount: number;
    discount_total: number;
    line_items: SalesOrderAppliedLineDiscountDto[];
    global_discount: SalesOrderAppliedGlobalDiscountDto | null;
};
