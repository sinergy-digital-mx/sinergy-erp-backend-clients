import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  JwtPermissionUser,
  userHasJwtPermission,
} from '../../rbac/utils/jwt-permission.util';

/** Acción del módulo POS: ver y aplicar el descuento porcentual al precio. */
export const POS_PRICE_DISCOUNT_ACTION = 'ApplyPriceDiscount';

export interface PosPriceDiscountLine {
  product_id?: string | null;
  product_uom_id?: string | null;
  discount_percentage?: number | string | null;
  product_discount_id?: string | null;
}

function hasProductDiscount(line: PosPriceDiscountLine): boolean {
  return typeof line.product_discount_id === 'string' && line.product_discount_id.trim().length > 0;
}

function roundPercent(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Línea con porcentaje directo al precio, sin descuento de catálogo. */
export function isPosPriceDiscountLine(line: PosPriceDiscountLine | null | undefined): boolean {
  if (!line || hasProductDiscount(line)) return false;
  const pct = Number(line.discount_percentage ?? 0);
  return Number.isFinite(pct) && pct > 0;
}

function priceDiscountKey(line: PosPriceDiscountLine): string | null {
  if (!isPosPriceDiscountLine(line)) return null;
  const pct = roundPercent(Number(line.discount_percentage));
  return `${line.product_id ?? ''}|${line.product_uom_id ?? ''}|${pct.toFixed(2)}`;
}

function countPriceDiscounts(lines: PosPriceDiscountLine[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const line of lines) {
    const key = priceDiscountKey(line);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

/**
 * El porcentaje baja el precio de la línea. No es descuento de producto ni global.
 * Sin permiso se puede reenviar el mismo descuento ya guardado; no uno nuevo ni distinto.
 */
export function assertPosPriceDiscountAllowed(
  user: JwtPermissionUser | null | undefined,
  incoming: PosPriceDiscountLine[] | null | undefined,
  existing?: PosPriceDiscountLine[] | null,
): void {
  const discounted = (incoming ?? []).filter(isPosPriceDiscountLine);
  for (const line of discounted) {
    const pct = roundPercent(Number(line.discount_percentage));
    if (pct <= 0 || pct > 100) {
      throw new BadRequestException('El descuento en precio debe estar entre 0.01% y 100%');
    }
  }

  if (!discounted.length || userHasJwtPermission(user, 'POS', POS_PRICE_DISCOUNT_ACTION)) {
    return;
  }

  const stored = countPriceDiscounts(existing ?? []);
  const asked = countPriceDiscounts(discounted);
  for (const [key, count] of asked) {
    if ((stored.get(key) ?? 0) < count) {
      throw new ForbiddenException('No tienes permiso para aplicar descuento al precio en POS');
    }
  }
}
