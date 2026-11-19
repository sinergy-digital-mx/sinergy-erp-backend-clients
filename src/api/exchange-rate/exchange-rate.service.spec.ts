import { ExchangeRateService } from './exchange-rate.service';
import { ExchangeRate } from '../../entities/billing/exchange-rate.entity';

describe('ExchangeRateService', () => {
  function createService(seed: Array<Partial<ExchangeRate>> = []) {
    const rows: ExchangeRate[] = seed.map((row, index) => ({
      id: row.id ?? `id-${index + 1}`,
      tenant_id: row.tenant_id ?? 'tenant-1',
      rate_date: row.rate_date ?? '2026-10-01',
      exchange_rate: row.exchange_rate ?? 16.8,
      notes: row.notes ?? null,
      created_at: row.created_at ?? new Date(`2026-10-0${index + 1}T00:00:00.000Z`),
      updated_at: row.updated_at ?? new Date(`2026-10-0${index + 1}T00:00:00.000Z`),
    }));

    const repo = {
      create: (row: Partial<ExchangeRate>) => row,
      save: jest.fn(async (input: ExchangeRate | ExchangeRate[]) => {
        const list = Array.isArray(input) ? input : [input];
        for (const row of list) {
          const current = rows.find((item) => item.id && item.id === row.id);
          if (current) {
            Object.assign(current, row);
          } else {
            rows.push({
              id: row.id ?? `id-${rows.length + 1}`,
              created_at: new Date(),
              updated_at: new Date(),
              notes: null,
              ...row,
            } as ExchangeRate);
          }
        }
        return Array.isArray(input) ? list : list[0];
      }),
      createQueryBuilder: jest.fn(() => {
        const filters: Array<(row: ExchangeRate) => boolean> = [];
        let order: Array<{ field: keyof ExchangeRate; direction: 'ASC' | 'DESC' }> = [];
        const qb = {
          where: jest.fn((_sql: string, params: { tenantId: string }) => {
            filters.push((row) => row.tenant_id === params.tenantId);
            return qb;
          }),
          andWhere: jest.fn((sql: string, params: { untilDate?: string; rateDate?: string }) => {
            if (sql.includes('<=')) {
              filters.push((row) => String(row.rate_date) <= String(params.untilDate));
            } else if (sql.includes('=')) {
              filters.push((row) => String(row.rate_date) === String(params.rateDate));
            }
            return qb;
          }),
          orderBy: jest.fn((field: string, direction: 'ASC' | 'DESC') => {
            order = [{ field: field.replace('rate.', '') as keyof ExchangeRate, direction }];
            return qb;
          }),
          addOrderBy: jest.fn((field: string, direction: 'ASC' | 'DESC') => {
            order.push({ field: field.replace('rate.', '') as keyof ExchangeRate, direction });
            return qb;
          }),
          select: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue([]),
          getMany: jest.fn(async () => sortRows(rows.filter((row) => filters.every((fn) => fn(row))), order)),
          getOne: jest.fn(async () => sortRows(rows.filter((row) => filters.every((fn) => fn(row))), order)[0] ?? null),
        };
        return qb;
      }),
    };

    return { service: new ExchangeRateService(repo as never), rows, repo };
  }

  it('sobrescribe el registro del mismo día', async () => {
    const { service, rows } = createService([
      { id: 'today', rate_date: '2026-10-14', exchange_rate: 16.8, notes: 'anterior' },
    ]);

    const saved = await service.setDailyRate('tenant-1', {
      rate_date: '2026-10-14',
      exchange_rate: 17.25,
      notes: 'Banxico',
    });

    expect(saved.exchange_rate).toBe(17.25);
    expect(rows).toHaveLength(1);
    expect(rows[0].notes).toBe('Banxico');
  });

  it('si el día no tiene captura, deja en el historial la tasa del día anterior', async () => {
    const { service, rows } = createService([
      { id: 'prev', rate_date: '2026-10-12', exchange_rate: 16.8 },
    ]);

    const row = await service.getDailyRate('tenant-1', '2026-10-14');

    expect(row?.rate_date).toBe('2026-10-14');
    expect(Number(row?.exchange_rate)).toBe(16.8);
    expect(rows.map((item) => item.rate_date).sort()).toEqual([
      '2026-10-12',
      '2026-10-13',
      '2026-10-14',
    ]);
  });
});

function sortRows(
  rows: ExchangeRate[],
  order: Array<{ field: keyof ExchangeRate; direction: 'ASC' | 'DESC' }>,
): ExchangeRate[] {
  return [...rows].sort((left, right) => {
    for (const rule of order) {
      const a = String(left[rule.field] ?? '');
      const b = String(right[rule.field] ?? '');
      if (a === b) {
        continue;
      }
      const compared = a < b ? -1 : 1;
      return rule.direction === 'ASC' ? compared : -compared;
    }
    return 0;
  });
}
