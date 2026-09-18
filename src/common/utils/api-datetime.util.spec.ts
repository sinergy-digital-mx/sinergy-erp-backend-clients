import {
  getCalendarMonthKey,
  isUnpaidOverdue,
  parseDateOnly,
  parseDbDateTimeAsUtc,
} from './api-datetime.util';

describe('parseDateOnly', () => {
  it('no corre el día en YYYY-MM-DD', () => {
    const date = parseDateOnly('2026-01-01');
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(0);
    expect(date?.getDate()).toBe(1);
  });

  it('trata medianoche UTC como día de calendario', () => {
    const date = parseDateOnly(new Date('2025-12-01T00:00:00.000Z'));
    expect(date?.getFullYear()).toBe(2025);
    expect(date?.getMonth()).toBe(11);
    expect(date?.getDate()).toBe(1);
    expect(getCalendarMonthKey(date)).toBe('2025-12');
  });
});

describe('isUnpaidOverdue', () => {
  it('marca pendiente con fecha anterior a hoy', () => {
    expect(isUnpaidOverdue('2026-01-05', 'pendiente', new Date(2026, 8, 11))).toBe(
      true,
    );
    expect(isUnpaidOverdue('2026-09-11', 'pendiente', new Date(2026, 8, 11))).toBe(
      false,
    );
    expect(isUnpaidOverdue('2026-01-05', 'pagado', new Date(2026, 8, 11))).toBe(
      false,
    );
  });
});

describe('parseDbDateTimeAsUtc', () => {
  it('trata el datetime de MySQL sin zona como UTC', () => {
    const date = parseDbDateTimeAsUtc('2026-09-07 23:46:00');
    expect(date?.toISOString()).toBe('2026-09-07T23:46:00.000Z');
  });

  it('respeta ISO con Z', () => {
    const date = parseDbDateTimeAsUtc('2026-09-07T22:58:00.000Z');
    expect(date?.toISOString()).toBe('2026-09-07T22:58:00.000Z');
  });
});
