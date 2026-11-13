import { PosSalePaymentMethod } from '../../../entities/pos/pos-sale-payment-method.enum';

export interface AdvancePaymentAmounts {
  cashMxn: number;
  transferMxn: number;
  cardMxn: number;
  checkMxn: number;
}

export function paymentMethodFromFormaPago(
  formaPago: string | undefined | null,
): PosSalePaymentMethod | null {
  switch ((formaPago ?? '').trim()) {
    case '01':
      return PosSalePaymentMethod.CASH;
    case '02':
      return PosSalePaymentMethod.CHECK;
    case '03':
      return PosSalePaymentMethod.TRANSFER;
    case '04':
    case '28':
      return PosSalePaymentMethod.CARD;
    default:
      return null;
  }
}

export function formaPagoFromPaymentMethod(
  method: string | undefined | null,
): string | null {
  switch (method) {
    case PosSalePaymentMethod.CASH:
      return '01';
    case PosSalePaymentMethod.CHECK:
      return '02';
    case PosSalePaymentMethod.TRANSFER:
      return '03';
    case PosSalePaymentMethod.CARD:
      return '04';
    default:
      return null;
  }
}

export function formaPagoFromAdvancePayment(
  method: string | undefined | null,
  amounts?: AdvancePaymentAmounts,
): string | null {
  if (method === PosSalePaymentMethod.MIXED) {
    return predominantFormaPago(amounts);
  }
  return formaPagoFromPaymentMethod(method);
}

export function predominantFormaPago(
  amounts: AdvancePaymentAmounts | undefined | null,
): string | null {
  if (!amounts) {
    return null;
  }
  const parts = [
    { code: '01', amount: Number(amounts.cashMxn || 0) },
    { code: '03', amount: Number(amounts.transferMxn || 0) },
    { code: '04', amount: Number(amounts.cardMxn || 0) },
    { code: '02', amount: Number(amounts.checkMxn || 0) },
  ];
  const best = parts.reduce((current, part) =>
    part.amount > current.amount ? part : current,
  );
  return best.amount > 0 ? best.code : null;
}

export function advanceShiftAmountSplits(
  method: string,
  amountMxn: number,
  amounts?: Partial<AdvancePaymentAmounts> | null,
): AdvancePaymentAmounts {
  const total = roundAdvanceMoney(amountMxn);
  if (method === PosSalePaymentMethod.MIXED) {
    return {
      cashMxn: roundAdvanceMoney(amounts?.cashMxn ?? 0),
      transferMxn: roundAdvanceMoney(amounts?.transferMxn ?? 0),
      cardMxn: roundAdvanceMoney(amounts?.cardMxn ?? 0),
      checkMxn: roundAdvanceMoney(amounts?.checkMxn ?? 0),
    };
  }
  return {
    cashMxn: method === PosSalePaymentMethod.CASH ? total : 0,
    transferMxn: method === PosSalePaymentMethod.TRANSFER ? total : 0,
    cardMxn: method === PosSalePaymentMethod.CARD ? total : 0,
    checkMxn: method === PosSalePaymentMethod.CHECK ? total : 0,
  };
}

export function advancePaymentMethodLabel(method: string): string {
  switch (method) {
    case PosSalePaymentMethod.CASH:
      return 'Efectivo';
    case PosSalePaymentMethod.CARD:
      return 'Tarjeta';
    case PosSalePaymentMethod.TRANSFER:
      return 'Transferencia';
    case PosSalePaymentMethod.CHECK:
      return 'Cheque';
    case PosSalePaymentMethod.MIXED:
      return 'Mixto';
    default:
      return method;
  }
}

function roundAdvanceMoney(value: number): number {
  return Number(Number(value || 0).toFixed(2));
}
