import {
  calendarYearInMexico,
  sickLeaveDaysInYear,
  summarizeSickLeaveYear,
} from './sick-leave-year.util';

describe('sick leave year', () => {
  it('uses the calendar year in Mexico City', () => {
    expect(calendarYearInMexico(new Date('2026-01-01T05:30:00Z'))).toBe(2025);
    expect(calendarYearInMexico(new Date('2026-01-01T07:00:00Z'))).toBe(2026);
  });

  it('keeps stored days, including half days, when the range is inside the year', () => {
    expect(
      sickLeaveDaysInYear(
        {
          start_date: '2026-03-12',
          end_date: '2026-03-12',
          days: 0.5,
          status: 'approved',
        },
        2026,
      ),
    ).toBe(0.5);
  });

  it('ignores requests outside the year', () => {
    expect(
      sickLeaveDaysInYear(
        {
          start_date: '2025-12-01',
          end_date: '2025-12-03',
          days: 3,
          status: 'approved',
        },
        2026,
      ),
    ).toBe(0);
  });

  it('counts only the days that fall inside the year when a request crosses it', () => {
    expect(
      sickLeaveDaysInYear(
        {
          start_date: '2025-12-30',
          end_date: '2026-01-02',
          days: 4,
          status: 'approved',
        },
        2026,
      ),
    ).toBe(2);
  });

  it('splits approved and pending, and skips rejected or cancelled', () => {
    const summary = summarizeSickLeaveYear(
      [
        {
          start_date: '2026-02-01',
          end_date: '2026-02-03',
          days: 3,
          status: 'approved',
        },
        {
          start_date: '2026-04-01',
          end_date: '2026-04-01',
          days: 0.5,
          status: 'pending',
        },
        {
          start_date: '2026-05-01',
          end_date: '2026-05-02',
          days: 2,
          status: 'rejected',
        },
        {
          start_date: '2025-01-01',
          end_date: '2025-01-02',
          days: 2,
          status: 'approved',
        },
      ],
      2026,
    );

    expect(summary).toEqual({
      year: 2026,
      approved_days: 3,
      pending_days: 0.5,
      request_count: 2,
    });
  });
});
