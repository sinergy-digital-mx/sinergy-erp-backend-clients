import {
  computeSuggestedLateInterest,
  countDaysPastDue,
  isLateInterestEligible,
  normalizeInterestRatePercent,
  resolveLateInterest,
  resolveLateInterestConfig,
} from './late-interest.util';

describe('normalizeInterestRatePercent', () => {
  it('acepta 10 como 10%', () => {
    expect(normalizeInterestRatePercent(10)).toBe(10);
  });

  it('acepta 0.10 como 10%', () => {
    expect(normalizeInterestRatePercent(0.1)).toBe(10);
  });

  it('deja 0 si no hay tasa', () => {
    expect(normalizeInterestRatePercent(null)).toBe(0);
    expect(normalizeInterestRatePercent(0)).toBe(0);
  });
});

describe('late interest eligibility', () => {
  const today = new Date(2026, 9, 23);
  const config = { ratePercent: 10, graceDays: 6 };

  it('cuenta días desde el vencimiento', () => {
    expect(countDaysPastDue('2026-10-17', today)).toBe(6);
    expect(countDaysPastDue('2026-10-23', today)).toBe(0);
  });

  it('aplica a partir de los días de gracia', () => {
    expect(isLateInterestEligible('pendiente', 6, config)).toBe(true);
    expect(isLateInterestEligible('pendiente', 5, config)).toBe(false);
    expect(isLateInterestEligible('pagado', 10, config)).toBe(false);
  });

  it('calcula 10% sobre la cuota', () => {
    expect(computeSuggestedLateInterest(271.47, config, true)).toBe(27.15);
    expect(computeSuggestedLateInterest(271.47, config, false)).toBe(0);
  });
});

describe('resolveLateInterest', () => {
  const today = new Date(2026, 9, 23);
  const config = resolveLateInterestConfig({ interest_rate: 10, payment_due_day: 6 });

  it('sugiere el interés si ya pasaron los días', () => {
    const resolved = resolveLateInterest(
      { amount: 271.47, status: 'pendiente', due_date: '2026-10-17' },
      config,
      today,
    );
    expect(resolved.late_interest_eligible).toBe(true);
    expect(resolved.late_interest_amount).toBe(27.15);
    expect(resolved.late_interest_manual).toBe(false);
  });

  it('respeta omitir el interés', () => {
    const resolved = resolveLateInterest(
      {
        amount: 271.47,
        status: 'pendiente',
        due_date: '2026-10-17',
        late_interest_waived: true,
        late_interest_amount: 27.15,
      },
      config,
      today,
    );
    expect(resolved.late_interest_amount).toBe(0);
    expect(resolved.late_interest_waived).toBe(true);
  });

  it('deja un monto manual', () => {
    const resolved = resolveLateInterest(
      {
        amount: 271.47,
        status: 'pendiente',
        due_date: '2026-10-17',
        late_interest_amount: 15,
      },
      config,
      today,
    );
    expect(resolved.late_interest_amount).toBe(15);
    expect(resolved.late_interest_manual).toBe(true);
  });
});
