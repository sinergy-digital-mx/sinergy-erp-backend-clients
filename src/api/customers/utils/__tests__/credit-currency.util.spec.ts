import { amountInCreditCurrency, creditConversionRate } from '../credit-currency.util';

describe('amountInCreditCurrency', () => {
  it('no convierte si la orden y el crédito están en dólares', () => {
    expect(
      amountInCreditCurrency({
        amount: 250,
        orderCurrency: 'USD',
        creditCurrency: 'USD',
      }).amount,
    ).toBe(250);
  });

  it('pasa una orden en dólares a pesos con el tipo de cambio de la orden', () => {
    expect(
      amountInCreditCurrency({
        amount: 100,
        orderCurrency: 'USD',
        creditCurrency: 'MXN',
        exchangeRate: 17.2,
      }).amount,
    ).toBe(1720);
  });

  it('pasa una orden en pesos a dólares con el tipo de cambio de la orden', () => {
    expect(
      amountInCreditCurrency({
        amount: 1720,
        orderCurrency: 'MXN',
        creditCurrency: 'USD',
        exchangeRate: 17.2,
      }).amount,
    ).toBe(100);
  });

  it('pide tipo de cambio si las monedas no coinciden', () => {
    expect(
      amountInCreditCurrency({
        amount: 100,
        orderCurrency: 'USD',
        creditCurrency: 'MXN',
      }).error,
    ).toBe('No hay tipo de cambio para convertir el crédito de la orden');
  });
});

describe('creditConversionRate', () => {
  it('una orden en dólares usa su propio tipo de cambio', () => {
    expect(
      creditConversionRate({
        orderCurrency: 'USD',
        creditCurrency: 'MXN',
        orderExchangeRate: 16.8,
        dailyExchangeRate: 18,
      }),
    ).toBe(16.8);
  });

  it('una orden en pesos sin TC usa el del día de la orden', () => {
    expect(
      creditConversionRate({
        orderCurrency: 'MXN',
        creditCurrency: 'USD',
        dailyExchangeRate: 17.5,
      }),
    ).toBe(17.5);
  });

  it('una orden en pesos conserva el TC ya guardado', () => {
    expect(
      creditConversionRate({
        orderCurrency: 'MXN',
        creditCurrency: 'USD',
        orderExchangeRate: 16.5,
        dailyExchangeRate: 18,
      }),
    ).toBe(16.5);
  });
});
