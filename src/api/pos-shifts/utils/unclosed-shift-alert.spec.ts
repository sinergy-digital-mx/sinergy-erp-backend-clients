import {
  buildUnclosedShiftAlert,
  getTodayDateString,
  isPreviousDayOpenShift,
  resolvePosCalendarRange,
} from './unclosed-shift-alert';

describe('unclosed-shift-alert', () => {
  const today = '2026-08-17';

  it('detects a shift from a previous day', () => {
    expect(isPreviousDayOpenShift('2026-08-16', today)).toBe(true);
    expect(isPreviousDayOpenShift('2026-08-14', today)).toBe(true);
    expect(isPreviousDayOpenShift('2026-08-17', today)).toBe(false);
  });

  it('returns null when there is no open shift', () => {
    expect(buildUnclosedShiftAlert(null, today)).toBeNull();
  });

  it('returns null when the open shift is from today', () => {
    expect(
      buildUnclosedShiftAlert(
        { id: 'shift-1', shift_date: today },
        today,
      ),
    ).toBeNull();
  });

  it('builds a blocking alert for yesterday', () => {
    const alert = buildUnclosedShiftAlert(
      { id: 'shift-1', shift_date: '2026-08-16' },
      today,
    );

    expect(alert).toEqual({
      active: true,
      daily_shift_id: 'shift-1',
      shift_date: '2026-08-16',
      today,
      days_open: 1,
      title: 'Corte del día anterior sin cerrar',
      message:
        'No se cerró el corte de ayer (2026-08-16). Es necesario cerrarlo para continuar.',
      severity: 'blocking',
    });
  });

  it('builds a blocking alert when the shift is several days old', () => {
    const alert = buildUnclosedShiftAlert(
      { id: 'shift-2', shift_date: '2026-08-14' },
      today,
    );

    expect(alert?.days_open).toBe(3);
    expect(alert?.message).toBe(
      'Quedó un corte abierto del 2026-08-14 sin cerrar. Es necesario cerrarlo para continuar.',
    );
  });

  it('keeps a picked calendar day instead of shifting YYYY-MM-DD through UTC', () => {
    expect(resolvePosCalendarRange('range', '2026-10-01', '2026-10-01')).toEqual({
      from: '2026-10-01',
      to: '2026-10-01',
    });
  });

  it('keeps Hoy on the POS calendar day even after midnight UTC', () => {
    const lateUtc = new Date('2026-09-27T05:30:00.000Z');
    expect(resolvePosCalendarRange('today', undefined, undefined, lateUtc)).toEqual({
      from: '2026-09-26',
      to: '2026-09-26',
    });
  });

  it('starts the week on Monday of the POS calendar', () => {
    const saturday = new Date('2026-09-26T20:00:00.000Z');
    expect(resolvePosCalendarRange('week', undefined, undefined, saturday)).toEqual({
      from: '2026-09-21',
      to: '2026-09-26',
    });
    expect(resolvePosCalendarRange('month', undefined, undefined, saturday)).toEqual({
      from: '2026-09-01',
      to: '2026-09-26',
    });
  });

  it('formats today as YYYY-MM-DD in America/Tijuana', () => {
    expect(getTodayDateString(new Date('2026-08-17T18:50:00.000Z'))).toBe(
      '2026-08-17',
    );
    expect(getTodayDateString(new Date('2026-08-18T04:00:00.000Z'))).toBe(
      '2026-08-17',
    );
    // 06:30 UTC ya es el día siguiente en Ciudad de México y sigue siendo el mismo día en Tijuana.
    expect(getTodayDateString(new Date('2026-10-02T06:30:00.000Z'))).toBe(
      '2026-10-01',
    );
  });
});
