import { resolvePosDocumentCurrency } from './sales-order-currency.util';

const base = {
  amountCashMxn: 0,
  amountCashUsd: 0,
  usdExchangeRate: null as number | null,
  amountTransferMxn: 0,
  amountCardMxn: 0,
  amountCheckMxn: 0,
  amountCheckUsd: 0,
  amountCreditMxn: 0,
};

describe('resolvePosDocumentCurrency', () => {
  it('a crédito permite dejar la orden en USD con el T.C. indicado', () => {
    const result = resolvePosDocumentCurrency({
      ...base,
      requested: 'USD',
      isCredit: true,
      amountCreditMxn: 3465,
      usdExchangeRate: 17.9,
    });
    expect(result).toEqual({ currency: 'USD', exchangeRate: 17.9, error: null });
  });

  it('a crédito en USD sin tipo de cambio marca error', () => {
    const result = resolvePosDocumentCurrency({
      ...base,
      requested: 'USD',
      isCredit: true,
      amountCreditMxn: 3465,
    });
    expect(result.error).toBe('No hay tipo de cambio para dejar la orden en dólares.');
  });

  it('a crédito sin pedir USD queda en MXN', () => {
    const result = resolvePosDocumentCurrency({ ...base, isCredit: true, amountCreditMxn: 3465 });
    expect(result).toEqual({ currency: 'MXN', exchangeRate: null, error: null });
  });

  it('sin crédito mantiene la regla: USD solo si el pago en dólares es mayor', () => {
    const result = resolvePosDocumentCurrency({
      ...base,
      requested: 'USD',
      amountTransferMxn: 3465,
      usdExchangeRate: 17.9,
    });
    expect(result.error).toBe(
      'La orden solo puede ser en dólares si el pago en dólares es mayor que el pago en pesos.',
    );
  });
});
