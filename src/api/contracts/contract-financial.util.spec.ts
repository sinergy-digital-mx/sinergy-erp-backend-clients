import {
  buildInstallmentAmounts,
  computeFinancedAmount,
  computeMonthlyPayment,
  computeDownPaymentRemaining,
  resolveCreateDownPaymentTarget,
  resolveEffectiveDownPaymentTarget,
} from './contract-financial.util';

describe('resolveCreateDownPaymentTarget', () => {
  it('guarda la meta aunque el abono inicial sea 0', () => {
    expect(
      resolveCreateDownPaymentTarget({
        financed: true,
        downPayment: 0,
        downPaymentTarget: 36000,
      }),
    ).toBe(36000);
  });

  it('usa down_payment si el alta vieja no manda meta', () => {
    expect(
      resolveCreateDownPaymentTarget({
        financed: true,
        downPayment: 15000,
      }),
    ).toBe(15000);
  });

  it('no guarda meta en un enganche de contado', () => {
    expect(
      resolveCreateDownPaymentTarget({
        financed: false,
        downPayment: 15000,
        downPaymentTarget: 15000,
      }),
    ).toBeNull();
  });
});

describe('resolveEffectiveDownPaymentTarget', () => {
  it('usa la meta guardada cuando existe', () => {
    expect(resolveEffectiveDownPaymentTarget(15000, 8000)).toBe(15000);
  });

  it('usa la suma de cuotas si no hay meta', () => {
    expect(resolveEffectiveDownPaymentTarget(null, 8000)).toBe(8000);
    expect(resolveEffectiveDownPaymentTarget(0, 8000)).toBe(8000);
  });

  it('devuelve null si no hay meta ni cuotas', () => {
    expect(resolveEffectiveDownPaymentTarget(null, 0)).toBeNull();
    expect(resolveEffectiveDownPaymentTarget(undefined, 0)).toBeNull();
  });
});

describe('computeMonthlyPayment', () => {
  const financed = {
    down_payment: 35000,
    down_payment_target: 35000,
    down_payment_financed: true,
    total_price: 52500,
    payment_months: 12,
    status: 'activo' as const,
  };

  it('divide el saldo después del enganche, no la meta', () => {
    expect(computeFinancedAmount(52500, financed)).toBe(17500);
    expect(computeMonthlyPayment(52500, financed, 12)).toBe(1458.33);
  });

  it('deja la mensualidad en 0 si la meta financiada aún no existe', () => {
    expect(
      computeMonthlyPayment(
        52500,
        { ...financed, down_payment_target: null, down_payment: 0 },
        12,
      ),
    ).toBe(0);
  });

  it('en contrato de contado usa precio menos enganche', () => {
    expect(
      computeMonthlyPayment(
        52500,
        { ...financed, down_payment_financed: false, down_payment_target: null },
        12,
      ),
    ).toBe(1458.33);
  });
});

describe('buildInstallmentAmounts', () => {
  it('cierra el saldo en la última cuota', () => {
    const amounts = buildInstallmentAmounts(17500, 12);
    expect(amounts[0]).toBe(1458.33);
    expect(amounts[11]).toBe(1458.37);
    const sum = Math.round(amounts.reduce((total, amount) => total + amount, 0) * 100) / 100;
    expect(sum).toBe(17500);
  });
});

describe('computeDownPaymentRemaining', () => {
  it('resta lo abonado a la meta', () => {
    expect(computeDownPaymentRemaining(15000, 4000)).toBe(11000);
  });

  it('nunca es negativo', () => {
    expect(computeDownPaymentRemaining(5000, 7000)).toBe(0);
  });

  it('es 0 si no hay meta', () => {
    expect(computeDownPaymentRemaining(null, 2500)).toBe(0);
    expect(computeDownPaymentRemaining(undefined, 0)).toBe(0);
  });
});
