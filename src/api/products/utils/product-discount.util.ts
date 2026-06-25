import { BadRequestException } from '@nestjs/common';
import {
  ProductDiscount,
  ProductDiscountType,
} from '../../../entities/products/product-discount.entity';

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

export function isProductDiscountApplicable(
  discount: Pick<
    ProductDiscount,
    'is_active' | 'valid_from' | 'valid_to' | 'product_uom_id'
  >,
  productUomId: string,
  referenceDate: Date = new Date(),
): boolean {
  if (!discount.is_active) return false;

  if (discount.valid_from) {
    const from = new Date(discount.valid_from);
    from.setHours(0, 0, 0, 0);
    if (referenceDate < from) return false;
  }

  if (discount.valid_to) {
    const to = new Date(discount.valid_to);
    to.setHours(23, 59, 59, 999);
    if (referenceDate > to) return false;
  }

  if (discount.product_uom_id && discount.product_uom_id !== productUomId) {
    return false;
  }

  return true;
}

export function calculateProductDiscountLineAmounts(
  unitPrice: number,
  quantity: number,
  discount: Pick<ProductDiscount, 'discount_type' | 'value'>,
): ProductDiscountLineAmounts {
  const price = Number(unitPrice) || 0;
  const qty = Number(quantity) || 0;
  const value = Number(discount.value) || 0;

  let discountUnit = 0;
  if (discount.discount_type === ProductDiscountType.PERCENTAGE) {
    discountUnit = (price * value) / 100;
  } else {
    discountUnit = Math.min(value, price);
  }

  discountUnit = Math.max(Number(discountUnit.toFixed(2)), 0);
  const lineDiscount = Number((discountUnit * qty).toFixed(2));
  const discountPercentage =
    price > 0 ? Number(((discountUnit / price) * 100).toFixed(2)) : 0;

  return {
    discount_percentage: discountPercentage,
    discount_unit: discountUnit,
    line_discount: lineDiscount,
  };
}

export function mapApplicableProductDiscount(
  discount: ProductDiscount,
): ApplicableProductDiscountSummary {
  return {
    id: discount.id,
    name: discount.name,
    discount_type: discount.discount_type,
    value: Number(discount.value),
    product_uom_id: discount.product_uom_id,
  };
}

export function assertProductDiscountApplicable(
  discount: ProductDiscount,
  productId: string,
  productUomId: string,
): void {
  if (discount.product_id !== productId) {
    throw new BadRequestException('El descuento no pertenece al producto de la línea');
  }

  if (!isProductDiscountApplicable(discount, productUomId)) {
    throw new BadRequestException(
      `El descuento "${discount.name}" no está disponible para esta UOM o vigencia`,
    );
  }
}
