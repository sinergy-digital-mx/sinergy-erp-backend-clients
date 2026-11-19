import {
  addMonths,
  billingDate,
  formatPeriodLabel,
  listPeriodMonths,
} from './service-subscription-months.util';

describe('service-subscription-months', () => {
  it('arma los meses inclusivos de enero a diciembre', () => {
    const months = listPeriodMonths('2026-01', '2026-12');
    expect(months).toHaveLength(12);
    expect(months[0]).toBe('2026-01-01');
    expect(months[11]).toBe('2026-12-01');
  });

  it('rechaza más de 12 meses', () => {
    expect(() => listPeriodMonths('2026-01-01', '2027-01-01')).toThrow(
      'La suscripción cubre como máximo 12 meses',
    );
  });

  it('renueva el mismo plazo a partir del mes siguiente', () => {
    expect(addMonths('2026-12-01', 1)).toBe('2027-01-01');
    expect(formatPeriodLabel('2026-03-01')).toBe('marzo 2026');
    expect(billingDate('2026-02-01', 31)).toBe('2026-02-28');
  });
});
