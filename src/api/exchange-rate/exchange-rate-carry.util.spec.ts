import { buildMissingDailyRates } from './exchange-rate-carry.util';

describe('buildMissingDailyRates', () => {
  it('copia la tasa del día anterior en los días sin captura', () => {
    const missing = buildMissingDailyRates(
      [
        { rate_date: '2026-10-01', exchange_rate: 16.8 },
        { rate_date: '2026-10-03', exchange_rate: 17.1 },
      ],
      '2026-10-05',
    );

    expect(missing).toEqual([
      { rate_date: '2026-10-02', exchange_rate: 16.8 },
      { rate_date: '2026-10-04', exchange_rate: 17.1 },
      { rate_date: '2026-10-05', exchange_rate: 17.1 },
    ]);
  });

  it('no agrega días si el historial ya está al día', () => {
    expect(
      buildMissingDailyRates([{ rate_date: '2026-10-14', exchange_rate: '16.8000' }], '2026-10-14'),
    ).toEqual([]);
  });

  it('si el mismo día tiene varias capturas, usa la primera de la lista', () => {
    const missing = buildMissingDailyRates(
      [
        { rate_date: '2026-10-01', exchange_rate: 18 },
        { rate_date: '2026-10-01', exchange_rate: 16.8 },
      ],
      '2026-10-02',
    );

    expect(missing).toEqual([{ rate_date: '2026-10-02', exchange_rate: 18 }]);
  });

  it('no inventa una tasa si no hay ninguna captura', () => {
    expect(buildMissingDailyRates([], '2026-10-14')).toEqual([]);
  });
});
