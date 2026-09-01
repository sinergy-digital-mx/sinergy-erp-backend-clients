import {
  buildVacationSummary,
  inclusiveBusinessDayCount,
  inclusiveDayCount,
  resolveLeaveDays,
} from './mexican-labor-law';

describe('mexican-labor-law leave days', () => {
  it('counts 16–24 April as 9 calendar days and 7 business days', () => {
    expect(inclusiveDayCount('2026-04-16', '2026-04-24')).toBe(9);
    expect(inclusiveBusinessDayCount('2026-04-16', '2026-04-24')).toBe(7);
  });

  it('counts vacation days as weekdays by default', () => {
    const result = resolveLeaveDays({
      type: 'vacation',
      startDate: '2026-04-16',
      endDate: '2026-04-24',
    });
    expect(result.days).toBe(7);
    expect(result.counted_weekends).toBe(false);
    expect(result.calendar_days).toBe(9);
  });

  it('allows RH to override days and to include weekends', () => {
    expect(
      resolveLeaveDays({
        type: 'vacation',
        startDate: '2026-04-16',
        endDate: '2026-04-24',
        days: 7,
      }).days,
    ).toBe(7);

    expect(
      resolveLeaveDays({
        type: 'vacation',
        startDate: '2026-04-16',
        endDate: '2026-04-24',
        countWeekends: true,
      }).days,
    ).toBe(9);
  });
});

describe('buildVacationSummary carryover', () => {
  it('adds controlled leftover days to the legal entitlement', () => {
    const summary = buildVacationSummary('2024-04-01', 7, 0, 4, new Date('2026-09-01'));
    expect(summary.years_of_service).toBe(2);
    expect(summary.entitled_days).toBe(14);
    expect(summary.carryover_days).toBe(4);
    expect(summary.balance_days).toBe(18);
    expect(summary.taken_days).toBe(7);
    expect(summary.available_days).toBe(11);
  });
});
