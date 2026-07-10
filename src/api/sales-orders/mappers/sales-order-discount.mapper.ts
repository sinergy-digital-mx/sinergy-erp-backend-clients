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

export function mapAppliedLineDiscountsFromOrder(
  order: Pick<SalesOrder, 'line_items'>,
): SalesOrderAppliedLineDiscountDto[] {
  const applied: SalesOrderAppliedLineDiscountDto[] = [];

  for (const item of order.line_items ?? []) {
    if (!item.product_discount_id) continue;

    const qty = Number(item.quantity) || 0;
    const discountUnit = Number(item.discount_unit) || 0;

    applied.push({
      line_item_id: item.id,
      product_id: item.product_id,
      product_name: item.product?.name ?? '',
      product_sku: item.product?.sku ?? null,
      product_discount_id: item.product_discount_id,
      discount_name: item.product_discount?.name ?? 'Descuento',
      discount_type: item.product_discount?.discount_type ?? ProductDiscountType.PERCENTAGE,
      discount_value: Number(item.product_discount?.value ?? item.discount_percentage ?? 0),
      quantity: qty,
      discount_unit: discountUnit,
      discount_amount: Number((discountUnit * qty).toFixed(2)),
    });
  }

  return applied;
}

export function mapAppliedGlobalDiscountFromOrder(
  order: Pick<SalesOrder, 'global_discount_id' | 'global_discount_amount' | 'global_discount'>,
): SalesOrderAppliedGlobalDiscountDto | null {
  if (!order.global_discount_id) return null;

  return {
    global_discount_id: order.global_discount_id,
    discount_name: order.global_discount?.name ?? 'Descuento global',
    discount_type: order.global_discount?.discount_type ?? GlobalDiscountType.PERCENTAGE,
    discount_value: Number(order.global_discount?.value ?? 0),
    discount_amount: Number(order.global_discount_amount) || 0,
  };
}

/** @deprecated Usar mapAppliedLineDiscountsFromOrder */
export function mapAppliedDiscountsFromOrder(
  order: Pick<SalesOrder, 'line_items'>,
): SalesOrderAppliedLineDiscountDto[] {
  return mapAppliedLineDiscountsFromOrder(order);
}

export function mapLineItemWithDiscount(item: SalesOrderDetail) {
  const qty = Number(item.quantity) || 0;
  const discountUnit = Number(item.discount_unit) || 0;
  const lineSubtotal = qty * Number(item.unit_price || 0);

  return {
    ...item,
    line_subtotal: Number(lineSubtotal.toFixed(2)),
    line_discount_amount: Number((discountUnit * qty).toFixed(2)),
    applied_product_discount: item.product_discount_id
      ? {
          id: item.product_discount_id,
          name: item.product_discount?.name ?? null,
          discount_type: item.product_discount?.discount_type ?? null,
          value: item.product_discount ? Number(item.product_discount.value) : null,
        }
      : null,
  };
}

export function mapOrderDiscountSummary(order: SalesOrder) {
  const lineDiscounts = mapAppliedLineDiscountsFromOrder(order);
  const globalDiscount = mapAppliedGlobalDiscountFromOrder(order);
  const lineDiscountTotal = Number(order.discount_total) || 0;
  const globalDiscountAmount = Number(order.global_discount_amount) || 0;

  return {
    line_discount_total: lineDiscountTotal,
    global_discount_amount: globalDiscountAmount,
    discount_total: Number((lineDiscountTotal + globalDiscountAmount).toFixed(2)),
    line_items: lineDiscounts,
    global_discount: globalDiscount,
  };
}
