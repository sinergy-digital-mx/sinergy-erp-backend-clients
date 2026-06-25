import { SalesOrder } from '../../../entities/sales-orders/sales-order.entity';
import { SalesOrderDetail } from '../../../entities/sales-orders/sales-order-detail.entity';
import { ProductDiscountType } from '../../../entities/products/product-discount.entity';

export interface SalesOrderAppliedDiscountDto {
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

export function mapAppliedDiscountsFromOrder(
  order: Pick<SalesOrder, 'line_items'>,
): SalesOrderAppliedDiscountDto[] {
  const applied: SalesOrderAppliedDiscountDto[] = [];

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
