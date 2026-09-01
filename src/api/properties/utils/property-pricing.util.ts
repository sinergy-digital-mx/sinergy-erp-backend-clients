/**
 * Precio de lote: el UI puede mandar monto total o precio por m² (opcional).
 * Si viene price_per_m2, el total se calcula como área × precio/m².
 */

export class PropertyPricingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PropertyPricingError';
  }
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function derivePricePerM2(
  totalPrice: number | null | undefined,
  totalArea: number | null | undefined,
): number | null {
  const price = Number(totalPrice);
  const area = Number(totalArea);
  if (!Number.isFinite(price) || !Number.isFinite(area) || area <= 0) {
    return null;
  }
  return roundMoney(price / area);
}

export function resolvePropertyPricing(params: {
  totalArea?: number | null;
  totalPrice?: number | null;
  pricePerM2?: number | null;
  existingTotalPrice?: number | null;
  existingPricePerM2?: number | null;
  isCreate?: boolean;
}): { total_price: number; price_per_m2: number | null } {
  const area = Number(params.totalArea);
  const hasUnitPrice =
    params.pricePerM2 !== undefined && params.pricePerM2 !== null;
  const hasTotal =
    params.totalPrice !== undefined && params.totalPrice !== null;

  if (hasUnitPrice) {
    const unit = Number(params.pricePerM2);
    if (!Number.isFinite(unit) || unit < 0) {
      throw new PropertyPricingError('El precio por m² debe ser un número mayor o igual a 0');
    }
    if (!Number.isFinite(area) || area <= 0) {
      throw new PropertyPricingError(
        'Para calcular el total con precio por m² se necesita un área mayor a 0',
      );
    }
    return {
      total_price: roundMoney(area * unit),
      price_per_m2: roundMoney(unit),
    };
  }

  if (hasTotal) {
    const total = Number(params.totalPrice);
    if (!Number.isFinite(total) || total < 0) {
      throw new PropertyPricingError('El precio total debe ser un número mayor o igual a 0');
    }
    return {
      total_price: roundMoney(total),
      price_per_m2: Number.isFinite(area) && area > 0 ? roundMoney(total / area) : null,
    };
  }

  if (params.isCreate) {
    throw new PropertyPricingError(
      'Envía total_price o price_per_m2 (el sistema calcula el total si mandas precio por m²)',
    );
  }

  const existingTotal = Number(params.existingTotalPrice);
  if (!Number.isFinite(existingTotal)) {
    throw new PropertyPricingError('El lote no tiene precio total');
  }

  const existingUnit =
    params.existingPricePerM2 != null ? Number(params.existingPricePerM2) : null;

  if (params.totalArea !== undefined && existingUnit != null && existingUnit >= 0) {
    if (!Number.isFinite(area) || area <= 0) {
      throw new PropertyPricingError('El área debe ser mayor a 0');
    }
    return {
      total_price: roundMoney(area * existingUnit),
      price_per_m2: roundMoney(existingUnit),
    };
  }

  return {
    total_price: roundMoney(existingTotal),
    price_per_m2:
      existingUnit != null && Number.isFinite(existingUnit)
        ? roundMoney(existingUnit)
        : derivePricePerM2(existingTotal, params.totalArea),
  };
}
