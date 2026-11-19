import {
  allocateOvertimePay,
  DEFAULT_OVERTIME_POLICY,
  minuteRange,
  rangesOverlap,
  resolveOvertimeSchedule,
  weekRange,
} from './overtime-pay.util';

describe('overtime pay', () => {
  const policy = DEFAULT_OVERTIME_POLICY;

  it('calcula las horas entre inicio y término, incluso si cruza la medianoche', () => {
    expect(
      resolveOvertimeSchedule('2026-10-26', '18:00', '21:30', '2026-10-27'),
    ).toEqual({
      ok: true,
      schedule: {
        work_date: '2026-10-26',
        start_time: '18:00',
        end_time: '21:30',
        requested_hours: 3.5,
      },
    });

    expect(
      resolveOvertimeSchedule('2026-10-26', '22:00', '01:00', '2026-10-27')
        .ok &&
        resolveOvertimeSchedule('2026-10-26', '22:00', '01:00', '2026-10-27'),
    ).toMatchObject({
      ok: true,
      schedule: { requested_hours: 3 },
    });
  });

  it('rechaza fecha futura, hora igual y fecha inexistente', () => {
    expect(resolveOvertimeSchedule('2026-10-28', '18:00', '20:00', '2026-10-27').ok).toBe(
      false,
    );
    expect(resolveOvertimeSchedule('2026-10-26', '18:00', '18:00', '2026-10-27').ok).toBe(
      false,
    );
    expect(resolveOvertimeSchedule('2026-02-31', '18:00', '20:00', '2026-10-27').ok).toBe(
      false,
    );
  });

  it('toma la semana de lunes a domingo', () => {
    expect(weekRange('2026-10-27')).toEqual({
      week_start: '2026-10-26',
      week_end: '2026-11-01',
    });
    expect(weekRange('2026-10-25')).toEqual({
      week_start: '2026-10-19',
      week_end: '2026-10-25',
    });
  });

  it('detecta empalme, también cuando un turno cruza al día siguiente', () => {
    const evening = minuteRange('2026-10-27', '18:00', '21:00')!;
    const later = minuteRange('2026-10-27', '21:00', '23:00')!;
    const overlap = minuteRange('2026-10-27', '20:00', '22:00')!;
    expect(rangesOverlap(evening, later)).toBe(false);
    expect(rangesOverlap(evening, overlap)).toBe(true);

    const overnight = minuteRange('2026-10-27', '22:00', '01:00')!;
    const nextMorning = minuteRange('2026-10-28', '00:30', '02:00')!;
    expect(rangesOverlap(overnight, nextMorning)).toBe(true);
  });

  it('paga al doble las primeras 3 horas del día y 9 de la semana, y el resto al triple', () => {
    expect(
      allocateOvertimePay({
        hours: 5,
        monthlySalary: 12000,
        priorDayHours: 0,
        priorWeekHours: 0,
        policy,
      }),
    ).toEqual({
      hourly_rate: 50,
      daily_salary: 400,
      double_hours: 3,
      excess_hours: 2,
      amount: 600,
    });

    expect(
      allocateOvertimePay({
        hours: 2,
        monthlySalary: 12000,
        priorDayHours: 0,
        priorWeekHours: 8,
        policy,
      }),
    ).toMatchObject({ double_hours: 1, excess_hours: 1, amount: 250 });

    expect(
      allocateOvertimePay({
        hours: 2,
        monthlySalary: 12000,
        priorDayHours: 3,
        priorWeekHours: 3,
        policy,
      }),
    ).toMatchObject({ double_hours: 0, excess_hours: 2, amount: 300 });
  });
});
