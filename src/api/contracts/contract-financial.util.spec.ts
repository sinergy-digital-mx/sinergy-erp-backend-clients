import {
  computeDownPaymentRemaining,
  resolveEffectiveDownPaymentTarget,
} from './contract-financial.util';

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
