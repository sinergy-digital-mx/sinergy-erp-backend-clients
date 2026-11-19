import {
  buildPaymentMethodTotal,
  buildPaymentMethodTotals,
  collectionTenderAmounts,
  creditPaymentAmountMxn,
  emptyPaymentMethodTotals,
  isCreditChargeCollection,
  paymentMethodMatchSql,
  summarizePaidCreditRows,
} from './pos-collection-payment-totals.util';

describe('pos-collection-payment-totals.util', () => {
  it('calcula ticket como monto / ventas', () => {
    expect(buildPaymentMethodTotal(4, 1000)).toEqual({
      orders: 4,
      amount: 1000,
      ticket: 250,
    });
  });

  it('ticket es 0 si no hay ventas', () => {
    expect(buildPaymentMethodTotal(0, 250)).toEqual({
      orders: 0,
      amount: 250,
      ticket: 0,
    });
  });

  it('arma efectivo, transferencia, tarjeta, cheque y crédito', () => {
    expect(
      buildPaymentMethodTotals({
        cash_orders: 2,
        cash_amount: 200,
        transfer_orders: '1',
        transfer_amount: '50.5',
        card_orders: 0,
        card_amount: 0,
        check_orders: 3,
        check_amount: 90,
        credit_orders: 4,
        credit_amount: 800,
      }),
    ).toEqual({
      cash: { orders: 2, amount: 200, ticket: 100 },
      transfer: { orders: 1, amount: 50.5, ticket: 50.5 },
      card: { orders: 0, amount: 0, ticket: 0 },
      check: { orders: 3, amount: 90, ticket: 30 },
      credit: { orders: 4, amount: 800, ticket: 200 },
    });
  });

  it('empty arranca en ceros', () => {
    expect(emptyPaymentMethodTotals()).toEqual({
      cash: { orders: 0, amount: 0, ticket: 0 },
      transfer: { orders: 0, amount: 0, ticket: 0 },
      card: { orders: 0, amount: 0, ticket: 0 },
      check: { orders: 0, amount: 0, ticket: 0 },
      credit: { orders: 0, amount: 0, ticket: 0 },
    });
  });

  it('un cargo a crédito no cuenta como venta cobrada', () => {
    expect(
      isCreditChargeCollection({ isCredit: true, paymentMethod: 'credit', amountCreditMxn: 500 }),
    ).toBe(true);
    expect(
      isCreditChargeCollection({ isCredit: false, paymentMethod: 'cash', amountCreditMxn: 0 }),
    ).toBe(false);
  });

  it('convierte el abono en dólares con el tipo de cambio de la orden', () => {
    expect(creditPaymentAmountMxn({ amount: 10, currency: 'USD', exchangeRate: 18.5 })).toBe(185);
    expect(creditPaymentAmountMxn({ amount: 40, currency: 'MXN' })).toBe(40);
  });

  it('separa el efectivo y el cheque en dólares', () => {
    expect(
      collectionTenderAmounts({
        amount_cash_mxn: 100,
        amount_cash_usd: 2,
        amount_check_usd: 1,
        usd_exchange_rate: 20,
      }),
    ).toEqual({ cash: 140, transfer: 0, card: 0, check: 20 });
  });

  it('el crédito del resumen son solo abonos y el efectivo incluye ese abono', () => {
    const summary = summarizePaidCreditRows([
      {
        total: 200,
        isWalkIn: true,
        invoiced: false,
        isCreditPayment: false,
        amounts: { cash: 200, transfer: 0, card: 0, check: 0 },
      },
      {
        total: 80,
        isWalkIn: false,
        invoiced: true,
        isCreditPayment: true,
        amounts: { cash: 0, transfer: 0, card: 80, check: 0 },
      },
    ]);

    expect(summary.orders_collected).toBe(2);
    expect(summary.amount_collected).toBe(280);
    expect(summary.walk_in_count).toBe(1);
    expect(summary.invoiced_count).toBe(1);
    expect(summary.shipping_count).toBe(0);
    expect(summary.by_payment_method.card).toEqual({ orders: 1, amount: 80, ticket: 80 });
    expect(summary.by_payment_method.credit).toEqual({ orders: 1, amount: 80, ticket: 80 });
  });

  it('el cheque cuenta con dólares aunque el importe en pesos sea cero', () => {
    expect(paymentMethodMatchSql('check')).toContain('amount_check_usd');
    expect(paymentMethodMatchSql('credit')).toContain('amount_credit_mxn');
  });
});
