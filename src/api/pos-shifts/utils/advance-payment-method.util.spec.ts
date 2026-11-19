import { PosSalePaymentMethod } from '../../../entities/pos/pos-sale-payment-method.enum';
import {
  advancePaymentMethodLabel,
  advanceShiftAmountSplits,
  formaPagoFromAdvancePayment,
  paymentMethodFromFormaPago,
} from './advance-payment-method.util';

describe('paymentMethodFromFormaPago', () => {
  it('maps SAT payment codes used at the counter', () => {
    expect(paymentMethodFromFormaPago('01')).toBe(PosSalePaymentMethod.CASH);
    expect(paymentMethodFromFormaPago('02')).toBe(PosSalePaymentMethod.CHECK);
    expect(paymentMethodFromFormaPago('03')).toBe(PosSalePaymentMethod.TRANSFER);
    expect(paymentMethodFromFormaPago('04')).toBe(PosSalePaymentMethod.CARD);
    expect(paymentMethodFromFormaPago('28')).toBe(PosSalePaymentMethod.CARD);
  });

  it('rejects a code that does not move money in the shift', () => {
    expect(paymentMethodFromFormaPago('99')).toBeNull();
    expect(paymentMethodFromFormaPago('')).toBeNull();
  });

  it('labels the method in Spanish', () => {
    expect(advancePaymentMethodLabel(PosSalePaymentMethod.CASH)).toBe('Efectivo');
    expect(advancePaymentMethodLabel(PosSalePaymentMethod.MIXED)).toBe('Mixto');
  });
});

describe('formaPagoFromAdvancePayment', () => {
  it('uses the SAT code of a single method', () => {
    expect(formaPagoFromAdvancePayment(PosSalePaymentMethod.TRANSFER)).toBe('03');
  });

  it('uses the largest part of a mixed payment so the CFDI can stay PUE', () => {
    expect(
      formaPagoFromAdvancePayment(PosSalePaymentMethod.MIXED, {
        cashMxn: 400,
        transferMxn: 1264,
        cardMxn: 0,
        checkMxn: 0,
      }),
    ).toBe('03');
  });

  it('prefers cash when mixed parts tie', () => {
    expect(
      formaPagoFromAdvancePayment(PosSalePaymentMethod.MIXED, {
        cashMxn: 500,
        transferMxn: 500,
        cardMxn: 0,
        checkMxn: 0,
      }),
    ).toBe('01');
  });
});

describe('advanceShiftAmountSplits', () => {
  it('puts a single method in its bucket', () => {
    expect(advanceShiftAmountSplits(PosSalePaymentMethod.CHECK, 1664)).toEqual({
      cashMxn: 0,
      transferMxn: 0,
      cardMxn: 0,
      checkMxn: 1664,
    });
  });

  it('keeps the mixed breakdown for the cash drawer', () => {
    expect(
      advanceShiftAmountSplits(PosSalePaymentMethod.MIXED, 1664, {
        cashMxn: 664,
        transferMxn: 1000,
      }),
    ).toEqual({
      cashMxn: 664,
      transferMxn: 1000,
      cardMxn: 0,
      checkMxn: 0,
    });
  });
});
