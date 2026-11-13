import { VendorCreditLedgerEntryType } from '../../../entities/vendor/vendor-credit-ledger-entry-type.enum';

export type VendorCreditCurrency = 'MXN' | 'USD';

export function roundVendorCreditMoney(value: number): number {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export function normalizeVendorCreditCurrency(
  value: string | null | undefined,
): VendorCreditCurrency {
  return String(value ?? '').trim().toUpperCase() === 'USD' ? 'USD' : 'MXN';
}

export function splitVendorPayment(
  amount: number,
  pending: number,
): { applied: number; credit: number } {
  const pay = roundVendorCreditMoney(amount);
  const due = Math.max(0, roundVendorCreditMoney(pending));
  const applied = Math.min(pay, due);
  return {
    applied,
    credit: roundVendorCreditMoney(Math.max(0, pay - applied)),
  };
}

export function vendorCreditSignedAmount(
  type: VendorCreditLedgerEntryType | string,
  amount: number,
): number {
  const value = roundVendorCreditMoney(amount);
  return type === VendorCreditLedgerEntryType.CREDIT ? value : -value;
}

export function vendorCreditBalances(
  entries: Array<{ currency?: string | null; entry_type: string; amount: number | string }>,
): { mxn: number; usd: number } {
  let mxn = 0;
  let usd = 0;
  for (const entry of entries) {
    const delta = vendorCreditSignedAmount(entry.entry_type, Number(entry.amount || 0));
    if (normalizeVendorCreditCurrency(entry.currency) === 'USD') {
      usd += delta;
    } else {
      mxn += delta;
    }
  }
  return {
    mxn: roundVendorCreditMoney(mxn),
    usd: roundVendorCreditMoney(usd),
  };
}

export function vendorCreditNet(pending: number, credit: number): number {
  return roundVendorCreditMoney(roundVendorCreditMoney(pending) - roundVendorCreditMoney(credit));
}

export function withRunningVendorCreditBalance<
  T extends { currency?: string | null; entry_type: string; amount: number | string },
>(entries: T[]): Array<T & { balance_after: number }> {
  const running: Record<VendorCreditCurrency, number> = { MXN: 0, USD: 0 };
  return entries.map((entry) => {
    const currency = normalizeVendorCreditCurrency(entry.currency);
    running[currency] = roundVendorCreditMoney(
      running[currency] + vendorCreditSignedAmount(entry.entry_type, Number(entry.amount || 0)),
    );
    return { ...entry, balance_after: running[currency] };
  });
}
