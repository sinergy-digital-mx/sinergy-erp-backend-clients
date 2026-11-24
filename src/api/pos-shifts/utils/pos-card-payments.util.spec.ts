import {
  mixedPaymentPartCount,
  normalizeCardPayments,
  sumCardPayments,
} from './pos-card-payments.util';

describe('pos-card-payments', () => {
  it('acepta dos cargos de tarjeta en mixto', () => {
    const payments = normalizeCardPayments({
      card_payments: [
        { amount_mxn: 400, reference: '4242' },
        { amount_mxn: 430.5, reference: '1111' },
      ],
    });
    expect(payments).toHaveLength(2);
    expect(sumCardPayments(payments)).toBe(830.5);
    expect(
      mixedPaymentPartCount({
        cashTotal: 0,
        amountTransferMxn: 0,
        amountCheckMxn: 0,
        cardPayments: payments,
      }),
    ).toBe(2);
  });

  it('sin card_payments usa amount_card_mxn', () => {
    const payments = normalizeCardPayments({
      amount_card_mxn: 200,
      card_reference: '9999',
    });
    expect(payments).toEqual([{ amount_mxn: 200, reference: '9999', card_kind: null }]);
  });

  it('un cheque en dólares cuenta como una forma', () => {
    expect(
      mixedPaymentPartCount({
        cashTotal: 100,
        amountTransferMxn: 0,
        amountCheckMxn: 0,
        amountCheckUsd: 20,
        cardPayments: [],
      }),
    ).toBe(2);
  });

  it('efectivo + una tarjeta cuenta como dos formas', () => {
    expect(
      mixedPaymentPartCount({
        cashTotal: 100,
        amountTransferMxn: 0,
        amountCheckMxn: 0,
        cardPayments: [{ amount_mxn: 50, reference: null, card_kind: 'debit' }],
      }),
    ).toBe(2);
  });
});
