import { resolveStoredContractCurrency } from '../../contracts/contract-currency.util';
import { derivePricePerM2 } from './property-pricing.util';

export interface PropertyLotLookup {
  id: string;
  code: string;
  name: string;
  block: string | null;
  lot_number: string | null;
  status: string;
  total_area: number;
  total_price: number;
  price_per_m2: number | null;
  currency: string;
}

export interface PropertyLotLookupInput {
  id: string;
  code: string;
  name: string;
  block?: string | null;
  lot_number?: string | null;
  status: string;
  total_area: number | string;
  total_price: number | string;
  price_per_m2?: number | string | null;
  currency?: string | null;
}

export function toPropertyLotLookup(
  property: PropertyLotLookupInput,
): PropertyLotLookup {
  const totalPrice = Number(property.total_price);
  const totalArea = Number(property.total_area);
  const storedUnit =
    property.price_per_m2 != null && property.price_per_m2 !== ''
      ? Number(property.price_per_m2)
      : null;

  return {
    id: property.id,
    code: property.code,
    name: property.name,
    block: property.block ?? null,
    lot_number: property.lot_number ?? null,
    status: property.status,
    total_area: Number.isFinite(totalArea) ? totalArea : 0,
    total_price: Number.isFinite(totalPrice) ? totalPrice : 0,
    price_per_m2:
      storedUnit != null && Number.isFinite(storedUnit)
        ? storedUnit
        : derivePricePerM2(totalPrice, totalArea),
    currency: resolveStoredContractCurrency(property.currency),
  };
}
