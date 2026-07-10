import { BadRequestException } from '@nestjs/common';
import {
  GlobalDiscount,
  GlobalDiscountType,
} from '../../../entities/global-discounts/global-discount.entity';

export interface ApplicableGlobalDiscountSummary {
  id: string;
  name: string;
  discount_type: GlobalDiscountType;
  value: number;
}

export function isGlobalDiscountApplicable(
  discount: Pick<GlobalDiscount, 'is_active' | 'valid_from' | 'valid_to'>,
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

  return true;
}

export function calculateGlobalDiscountAmount(
  netSubtotal: number,
  discount: Pick<GlobalDiscount, 'discount_type' | 'value'>,
): number {
  const base = Math.max(Number(netSubtotal) || 0, 0);
  const value = Number(discount.value) || 0;

  let amount = 0;
  if (discount.discount_type === GlobalDiscountType.PERCENTAGE) {
    amount = (base * value) / 100;
  } else {
    amount = Math.min(value, base);
  }

  return Number(Math.max(amount, 0).toFixed(2));
}

export function mapApplicableGlobalDiscount(
  discount: GlobalDiscount,
): ApplicableGlobalDiscountSummary {
  return {
    id: discount.id,
    name: discount.name,
    discount_type: discount.discount_type,
    value: Number(discount.value),
  };
}

export function assertGlobalDiscountApplicable(discount: GlobalDiscount): void {
  if (!isGlobalDiscountApplicable(discount)) {
    throw new BadRequestException(
      `El descuento global "${discount.name}" no está disponible por vigencia o estado`,
    );
  }
}
