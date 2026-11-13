import { roundPosMoney } from './cash-drawer';

export function cashReceivedEquivalentMxn(
  receivedMxn: number,
  receivedUsd: number,
  rate: number,
): number {
  const usdMxn = receivedUsd > 0 && rate > 0 ? Number(receivedUsd) * Number(rate) : 0;
  return roundPosMoney(Number(receivedMxn || 0) + usdMxn);
}

export function usdCentToleranceMxn(rate: number): number {
  const fx = Number(rate) || 0;
  if (fx <= 0) {
    return 0.01;
  }
  return Math.max(0.01, roundPosMoney(0.01 * fx));
}

export interface CashPaymentSplit {
  amountCashMxn: number;
  amountCashUsd: number;
  changeCashMxn: number;
  changeCashUsd: number;
  covers: boolean;
}

export function splitCashPayment(
  orderTotal: number,
  receivedMxn: number,
  receivedUsd: number,
  rate: number,
): CashPaymentSplit {
  const total = roundPosMoney(Math.max(0, Number(orderTotal) || 0));
  const mxnIn = roundPosMoney(Math.max(0, Number(receivedMxn) || 0));
  const usdIn = roundPosMoney(Math.max(0, Number(receivedUsd) || 0));
  const fx = Number(rate) || 0;

  const amountCashMxn = roundPosMoney(Math.min(mxnIn, total));
  const remainderMxn = roundPosMoney(total - amountCashMxn);

  let amountCashUsd = 0;
  if (remainderMxn > 0.001 && usdIn > 0 && fx > 0) {
    amountCashUsd = roundPosMoney(Math.min(usdIn, remainderMxn / fx));
  }

  const appliedMxn = cashReceivedEquivalentMxn(amountCashMxn, amountCashUsd, fx);
  const gap = roundPosMoney(total - appliedMxn);
  const covers = gap <= usdCentToleranceMxn(amountCashUsd > 0 ? fx : 0) + 0.001;

  return {
    amountCashMxn,
    amountCashUsd,
    changeCashMxn: roundPosMoney(Math.max(0, mxnIn - amountCashMxn)),
    changeCashUsd: roundPosMoney(Math.max(0, usdIn - amountCashUsd)),
    covers,
  };
}

export function displayCashChange(
  changeMxn: number,
  changeUsd: number,
  rate: number,
): { mxn: number; usd: number } {
  const mxn = roundPosMoney(Math.max(0, Number(changeMxn) || 0));
  const usd = roundPosMoney(Math.max(0, Number(changeUsd) || 0));
  const fx = Number(rate) || 0;
  if (fx <= 0) {
    return { mxn, usd };
  }
  if (usd > 0 && mxn <= 0) {
    return { mxn: roundPosMoney(usd * fx), usd };
  }
  if (mxn > 0 && usd <= 0) {
    return { mxn, usd: roundPosMoney(mxn / fx) };
  }
  return { mxn, usd };
}

export function cashCoversOrder(
  orderTotal: number,
  receivedMxn: number,
  receivedUsd: number,
  rate: number,
): boolean {
  return splitCashPayment(orderTotal, receivedMxn, receivedUsd, rate).covers;
}
