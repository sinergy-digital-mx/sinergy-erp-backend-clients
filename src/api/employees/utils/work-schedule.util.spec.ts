import {
  draftWorkSchedule,
  hoursBetweenClocks,
  presentWorkSchedule,
  resolveWorkSchedule,
} from './work-schedule.util';

describe('work schedule', () => {
  it('cuenta un turno que cruza medianoche', () => {
    expect(hoursBetweenClocks('22:00', '06:00')).toBe(8);
    expect(hoursBetweenClocks('09:00', '18:00')).toBe(9);
    expect(hoursBetweenClocks('09:00', '09:00')).toBeNull();
  });

  it('el borrador arranca lun–vie de 09:00 a 18:00', () => {
    const draft = draftWorkSchedule();
    expect(draft.days.filter((day) => day.is_workday).map((day) => day.weekday)).toEqual([
      1, 2, 3, 4, 5,
    ]);
    expect(draft.weekly_hours).toBe(45);
  });

  it('arma el horario y suma las horas de la semana', () => {
    const result = resolveWorkSchedule({
      notes: 'Turno matutino',
      days: [
        { weekday: 1, is_workday: true, start_time: '08:00', end_time: '16:00' },
        { weekday: 6, is_workday: true, start_time: '08:00', end_time: '14:00' },
      ],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.schedule.weekly_hours).toBe(14);
    expect(result.schedule.notes).toBe('Turno matutino');
    expect(result.schedule.days[0]).toEqual(
      expect.objectContaining({ weekday: 1, start_time: '08:00', end_time: '16:00', hours: 8 }),
    );
    expect(result.schedule.days[5]).toEqual(
      expect.objectContaining({ weekday: 6, is_workday: true, hours: 6 }),
    );
    expect(result.schedule.days[6].is_workday).toBe(false);
  });

  it('rechaza un día laboral sin hora o repetido', () => {
    expect(
      resolveWorkSchedule({
        days: [{ weekday: 1, is_workday: true, start_time: '09:00' }],
      }).ok,
    ).toBe(false);
    expect(
      resolveWorkSchedule({
        days: [
          { weekday: 1, is_workday: true, start_time: '09:00', end_time: '18:00' },
          { weekday: 1, is_workday: true, start_time: '10:00', end_time: '19:00' },
        ],
      }).ok,
    ).toBe(false);
    expect(resolveWorkSchedule({ days: [] }).ok).toBe(false);
  });

  it('presenta null si no hay horario guardado', () => {
    expect(presentWorkSchedule(null)).toBeNull();
    expect(presentWorkSchedule({})).toBeNull();
  });
});
