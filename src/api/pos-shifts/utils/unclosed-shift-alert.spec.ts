import {
  buildUnclosedShiftAlert,
  getTodayDateString,
  isPreviousDayOpenShift,
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

  it('formats today as YYYY-MM-DD', () => {
    expect(getTodayDateString(new Date('2026-08-17T18:50:00.000Z'))).toBe(
      '2026-08-17',
    );
  });
});
