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
  include_in_invoice?: boolean;
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
  extras_usd: number | null;
  contracted_mxn: number | null;
  contracted_usd: number | null;
  invoice_extras_mxn: number | null;
  invoice_mxn: number | null;
  invoice_usd: number | null;
  operating_extras_mxn: number | null;
  operating_extras_usd: number | null;
  igi_mxn: number | null;
  igi_usd: number | null;
  total_usd: number | null;
  total_mxn: number | null;
  lines: RealCostLineResult[];
};

export type PersistedLandedCashTotals = {
  extras_usd: number | null;
  total_usd: number | null;
  total_mxn: number;
  igi_mxn: number;
  igi_usd: number | null;
  contracted_mxn: number;
  contracted_usd: number | null;
  invoice_mxn: number;
  invoice_usd: number | null;
  operating_extras_mxn: number;
  operating_extras_usd: number | null;
};

export function isInvoiceExtraFlag(value: unknown): boolean {
  return value === true || value === 1 || value === '1';
}

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

function sumConvertedExtras(
  extras: RealCostExtraInput[],
  to: RealCostCurrency,
  exchangeRate: number | null,
): number {
  return extras.reduce((sum, extra) => {
    const amount = Math.max(parseRealCostNumber(extra.amount), 0);
    const converted = convertAmount(amount, extra.currency, to, exchangeRate);
    return converted == null ? sum : sum + converted;
  }, 0);
}

export function derivePersistedLandedCashTotals(input: {
  merchandise_mxn: number | string | null | undefined;
  extras_mxn: number | string | null | undefined;
  invoice_extras_mxn?: number | string | null | undefined;
  igi_mxn?: number | string | null | undefined;
  customs_exchange_rate: number | string | null | undefined;
}): PersistedLandedCashTotals {
  const merchandiseMxn = roundPoMoney(parseRealCostNumber(input.merchandise_mxn));
  const extrasMxn = roundPoMoney(parseRealCostNumber(input.extras_mxn));
  const invoiceExtrasMxn = Math.min(
    roundPoMoney(parseRealCostNumber(input.invoice_extras_mxn)),
    extrasMxn,
  );
  const operatingExtrasMxn = roundPoMoney(extrasMxn - invoiceExtrasMxn);
  const igiMxn = roundPoMoney(parseRealCostNumber(input.igi_mxn));
  const totalMxn = roundPoMoney(merchandiseMxn + extrasMxn + igiMxn);
  const invoiceMxn = roundPoMoney(merchandiseMxn + invoiceExtrasMxn);
  const rate =
    input.customs_exchange_rate == null || input.customs_exchange_rate === ''
      ? null
      : parseRealCostNumber(input.customs_exchange_rate, 0);
  if (rate == null || rate <= 0) {
    return {
      extras_usd: null,
      total_usd: null,
      total_mxn: totalMxn,
      igi_mxn: igiMxn,
      igi_usd: null,
      contracted_mxn: merchandiseMxn,
      contracted_usd: null,
      invoice_mxn: invoiceMxn,
      invoice_usd: null,
      operating_extras_mxn: operatingExtrasMxn,
      operating_extras_usd: null,
    };
  }
  return {
    extras_usd: roundPoMoney(extrasMxn / rate),
    total_usd: roundPoMoney(totalMxn / rate),
    total_mxn: totalMxn,
    igi_mxn: igiMxn,
    igi_usd: roundPoMoney(igiMxn / rate),
    contracted_mxn: merchandiseMxn,
    contracted_usd: roundPoMoney(merchandiseMxn / rate),
    invoice_mxn: invoiceMxn,
    invoice_usd: roundPoMoney(invoiceMxn / rate),
    operating_extras_mxn: operatingExtrasMxn,
    operating_extras_usd: roundPoMoney(operatingExtrasMxn / rate),
  };
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
  const extrasMxn = sumConvertedExtras(extras, 'MXN', exchangeRate);
  const extrasUsd = sumConvertedExtras(extras, 'USD', exchangeRate);
  const merchandiseUsd = convertAmount(
    merchandiseAmount,
    paymentCurrency,
    'USD',
    exchangeRate,
  );

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
    // IGI% y GTOS% se suman sobre el precio del proveedor (no se multiplican entre sí).
    const landedVendor = line.vendorUnitCost * (1 + line.igiPercentage / 100 + incrementRatio);
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

  const igiAmount = preparedLines.reduce(
    (sum, line) => sum + line.quantity * line.vendorUnitCost * (line.igiPercentage / 100),
    0,
  );
  const igiMxnRaw = convertAmount(igiAmount, paymentCurrency, 'MXN', exchangeRate);
  const igiUsdRaw = convertAmount(igiAmount, paymentCurrency, 'USD', exchangeRate);
  const igiMxnResult = igiMxnRaw == null ? null : roundPoMoney(igiMxnRaw);
  const igiUsdResult = igiUsdRaw == null ? null : roundPoMoney(igiUsdRaw);

  const invoiceExtras = extras.filter((extra) => extra.include_in_invoice === true);
  const invoiceExtrasMxnRaw = sumConvertedExtras(invoiceExtras, 'MXN', exchangeRate);
  const extrasMxnResult =
    hasRealCost && (merchandiseMxn != null || extras.every((extra) => extra.currency === 'MXN'))
      ? roundPoMoney(extrasMxn)
      : null;
  const invoiceExtrasMxnResult =
    extrasMxnResult == null ? null : roundPoMoney(Math.min(invoiceExtrasMxnRaw, extrasMxnResult));
  const operatingExtrasMxnResult =
    extrasMxnResult == null || invoiceExtrasMxnResult == null
      ? null
      : roundPoMoney(extrasMxnResult - invoiceExtrasMxnResult);
  const extrasUsdResult =
    extrasMxnResult != null && exchangeRate != null
      ? roundPoMoney(extrasMxnResult / exchangeRate)
      : hasRealCost && extras.every((extra) => extra.currency === 'USD')
        ? roundPoMoney(extrasUsd)
        : null;
  const merchandiseMxnResult = merchandiseMxn == null ? null : roundPoMoney(merchandiseMxn);
  const merchandiseUsdResult = merchandiseUsd == null ? null : roundPoMoney(merchandiseUsd);
  const invoiceMxnResult =
    merchandiseMxnResult == null || invoiceExtrasMxnResult == null
      ? null
      : roundPoMoney(merchandiseMxnResult + invoiceExtrasMxnResult);
  const operatingExtrasUsdResult =
    operatingExtrasMxnResult == null || exchangeRate == null
      ? null
      : roundPoMoney(operatingExtrasMxnResult / exchangeRate);
  const invoiceUsdResult =
    invoiceMxnResult == null || exchangeRate == null
      ? null
      : roundPoMoney(invoiceMxnResult / exchangeRate);

  return {
    has_real_cost: hasRealCost,
    increment_ratio: incrementRatio,
    increment_percentage: incrementPercentage,
    merchandise_amount: roundPoMoney(merchandiseAmount),
    merchandise_mxn: merchandiseMxnResult,
    extras_amount: roundPoMoney(extrasAmount),
    extras_mxn: extrasMxnResult,
    extras_usd: extrasUsdResult,
    contracted_mxn: merchandiseMxnResult,
    contracted_usd: merchandiseUsdResult,
    invoice_extras_mxn: invoiceExtrasMxnResult,
    invoice_mxn: invoiceMxnResult,
    invoice_usd: invoiceUsdResult,
    operating_extras_mxn: operatingExtrasMxnResult,
    operating_extras_usd: operatingExtrasUsdResult,
    igi_mxn: igiMxnResult,
    igi_usd: igiUsdResult,
    total_usd:
      merchandiseUsdResult != null && extrasUsdResult != null
        ? roundPoMoney(merchandiseUsdResult + extrasUsdResult + (igiUsdResult ?? 0))
        : null,
    total_mxn:
      merchandiseMxnResult != null && extrasMxnResult != null
        ? roundPoMoney(merchandiseMxnResult + extrasMxnResult + (igiMxnResult ?? 0))
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

export function computeLinesIgiMxn(
  lines: RealCostLineInput[] | null | undefined,
  paymentCurrency: RealCostCurrency | string | null | undefined,
  exchangeRate: number | string | null | undefined,
): number {
  const rate =
    exchangeRate == null || exchangeRate === '' ? null : parseRealCostNumber(exchangeRate, 0) || null;
  const amount = (lines ?? []).reduce((sum, line) => {
    const igi = Math.max(parseRealCostNumber(line.igi_percentage), 0);
    if (igi <= 0) {
      return sum;
    }
    const unit = roundPoUnitCost(parseRealCostNumber(line.vendor_unit_cost));
    return sum + realCostLineQuantity(line) * unit * (igi / 100);
  }, 0);
  const mxn = convertAmount(amount, paymentCurrency === 'USD' ? 'USD' : 'MXN', 'MXN', rate);
  return mxn == null ? 0 : roundPoMoney(mxn);
}
