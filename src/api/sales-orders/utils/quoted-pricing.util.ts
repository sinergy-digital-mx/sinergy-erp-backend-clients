import { roundUnitAmount } from '../../../common/utils/unit-amount.util';

export type QuotedLineItemInput = {
  quantity: number | string;
  unit_price: number | string;
  discount_percentage?: number | string | null;
  discount_unit?: number | string | null;
  product_discount_id?: string | null;
};

export function quotedUnitPrice(value: number | string | null | undefined): number {
  return roundUnitAmount(Number(value) || 0);
}

/** Descuentos ya pactados en la cotización: no se recalculan con el catálogo actual. */
export function quotedLineDiscountAmounts(item: QuotedLineItemInput): {
  discount_percentage: number;
  discount_unit: number;
  line_discount: number;
  product_discount_id: string | null;
} {
  const quantity = Number(item.quantity) || 0;
  const unitPrice = quotedUnitPrice(item.unit_price);
  const discountPercentage = Number(item.discount_percentage || 0);
  const discountUnit =
    item.discount_unit == null || item.discount_unit === ''
      ? quantity > 0
        ? (unitPrice * discountPercentage) / 100
        : 0
      : Number(item.discount_unit) || 0;

  return {
    discount_percentage: discountPercentage,
    discount_unit: discountUnit,
    line_discount: discountUnit * quantity,
    product_discount_id: item.product_discount_id ?? null,
  };
}

export function quotedGlobalDiscountAmount(
  value: number | string | null | undefined,
): number {
  return Number(value || 0);
}
