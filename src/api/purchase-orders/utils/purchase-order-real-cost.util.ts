import { BadRequestException } from '@nestjs/common';
import { roundPoMoney, roundPoUnitCost } from './purchase-order-line-breakdown.util';

export type RealCostCurrency = 'MXN' | 'USD';

export type RealCostLineInput = {
  id: string;
  quantity: number | string;
  received_quantity?: number | string | null;
  vendor_unit_cost: number | string;
  igi_percentage?: number | string | null;
};

export type RealCostExtraInput = {
  amount: number | string;
  currency: RealCostCurrency;
};

export type ComputeRealCostInput = {
  payment_currency: RealCostCurrency;
  customs_exchange_rate: number | string | null;
  lines: RealCostLineInput[];
  extras: RealCostExtraInput[];
};

export type RealCostLineResult = {
  id: string;
  quantity: number;
  vendor_unit_cost: number;
  igi_percentage: number;
  real_unit_cost_usd: number | null;
  real_unit_cost_mxn: number | null;
};

export type ComputeRealCostResult = {
  has_real_cost: boolean;
  increment_ratio: number;
  increment_percentage: number;
  merchandise_amount: number;
  merchandise_mxn: number | null;
  extras_amount: number;
  extras_mxn: number | null;
  lines: RealCostLineResult[];
};

export function parseRealCostNumber(value: unknown, fallback = 0): number {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function realCostLineQuantity(line: RealCostLineInput): number {
  const received = parseRealCostNumber(line.received_quantity, 0);
  if (received > 0) {
    return received;
  }
  return Math.max(parseRealCostNumber(line.quantity, 0), 0);
}

export function parseCustomsExchangeRate(value: unknown): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new BadRequestException('El tipo de cambio de aduana debe ser mayor a 0');
  }
  return parsed;
}

export function extrasNeedExchangeRate(
  paymentCurrency: RealCostCurrency,
  extras: Array<{ currency: string }>,
): boolean {
  return extras.some((extra) => extra.currency !== paymentCurrency);
}

export function assertExchangeRateIfNeeded(
  paymentCurrency: RealCostCurrency,
  extras: Array<{ currency: string }>,
  exchangeRate: number | null,
): void {
  if (extrasNeedExchangeRate(paymentCurrency, extras) && exchangeRate == null) {
    throw new BadRequestException(
      'Indica el tipo de cambio de aduana para convertir gastos en otra moneda',
    );
  }
}

function convertAmount(
  amount: number,
  from: RealCostCurrency,
  to: RealCostCurrency,
  exchangeRate: number | null,
): number | null {
  if (from === to) {
    return amount;
  }
  if (exchangeRate == null) {
    return null;
  }
  return from === 'USD' ? amount * exchangeRate : amount / exchangeRate;
}

export function computePurchaseOrderRealCost(
  input: ComputeRealCostInput,
): ComputeRealCostResult {
  const paymentCurrency = input.payment_currency;
  const exchangeRate = parseCustomsExchangeRate(input.customs_exchange_rate);
  const extras = input.extras ?? [];
  const hasExtras = extras.length > 0;
  const hasRealCost = hasExtras || exchangeRate != null;

  const preparedLines = (input.lines ?? []).map((line) => {
    const quantity = realCostLineQuantity(line);
    const vendorUnitCost = roundPoUnitCost(parseRealCostNumber(line.vendor_unit_cost));
    const igiPercentage = Math.max(parseRealCostNumber(line.igi_percentage), 0);
    return { id: line.id, quantity, vendorUnitCost, igiPercentage };
  });

  const merchandiseAmount = preparedLines.reduce(
    (sum, line) => sum + line.quantity * line.vendorUnitCost,
    0,
  );
  const extrasAmount = extras.reduce(
    (sum, extra) => sum + Math.max(parseRealCostNumber(extra.amount), 0),
    0,
  );

  const merchandiseMxn = convertAmount(
    merchandiseAmount,
    paymentCurrency,
    'MXN',
    exchangeRate,
  );
  const extrasMxn = extras.reduce((sum, extra) => {
    const amount = Math.max(parseRealCostNumber(extra.amount), 0);
    const converted = convertAmount(amount, extra.currency, 'MXN', exchangeRate);
    return converted == null ? sum : sum + converted;
  }, 0);

  const extrasForRatio =
    merchandiseMxn != null && (hasExtras || exchangeRate != null)
      ? extrasMxn
      : extras
          .filter((extra) => extra.currency === paymentCurrency)
          .reduce((sum, extra) => sum + Math.max(parseRealCostNumber(extra.amount), 0), 0);

  const merchandiseForRatio =
    merchandiseMxn != null ? merchandiseMxn : merchandiseAmount;
  const incrementRatio =
    hasRealCost && merchandiseForRatio > 0 ? extrasForRatio / merchandiseForRatio : 0;
  const incrementPercentage = roundPoUnitCost(incrementRatio * 100);

  const lines: RealCostLineResult[] = preparedLines.map((line) => {
    const taxedVendor = line.vendorUnitCost * (1 + line.igiPercentage / 100);
    const landedVendor = taxedVendor * (1 + incrementRatio);
    const realUsd = convertAmount(landedVendor, paymentCurrency, 'USD', exchangeRate);
    const realMxn = convertAmount(landedVendor, paymentCurrency, 'MXN', exchangeRate);

    return {
      id: line.id,
      quantity: line.quantity,
      vendor_unit_cost: line.vendorUnitCost,
      igi_percentage: line.igiPercentage,
      real_unit_cost_usd: hasRealCost && realUsd != null ? roundPoUnitCost(realUsd) : null,
      real_unit_cost_mxn: hasRealCost && realMxn != null ? roundPoUnitCost(realMxn) : null,
    };
  });

  return {
    has_real_cost: hasRealCost,
    increment_ratio: incrementRatio,
    increment_percentage: incrementPercentage,
    merchandise_amount: roundPoMoney(merchandiseAmount),
    merchandise_mxn: merchandiseMxn == null ? null : roundPoMoney(merchandiseMxn),
    extras_amount: roundPoMoney(extrasAmount),
    extras_mxn: hasRealCost && (merchandiseMxn != null || extras.every((e) => e.currency === 'MXN'))
      ? roundPoMoney(extrasMxn)
      : null,
    lines,
  };
}

export function isRealCostEnabled(
  exchangeRate: unknown,
  extrasCount: number,
): boolean {
  return extrasCount > 0 || parseRealCostNumber(exchangeRate, 0) > 0;
}
