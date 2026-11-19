import {
    buildPurchaseTrend,
    formatUtcDateTime,
    rollingPurchaseMonths,
    rollingWindowStart,
} from '../customer-purchase-trend.util';

describe('customer purchase trend', () => {
    const now = new Date('2026-10-01T18:00:00.000Z');

    it('arma 12 meses corridos que terminan en el mes actual de México', () => {
        const months = rollingPurchaseMonths(now).map((point) => point.month);

        expect(months).toEqual([
            '2025-11',
            '2025-12',
            '2026-01',
            '2026-02',
            '2026-03',
            '2026-04',
            '2026-05',
            '2026-06',
            '2026-07',
            '2026-08',
            '2026-09',
            '2026-10',
        ]);
        expect(rollingPurchaseMonths(now)[0].label).toBe('nov 25');
        expect(rollingPurchaseMonths(now).at(-1)?.label).toBe('oct 26');
    });

    it('abre la ventana a la medianoche de México del mes más antiguo', () => {
        expect(rollingWindowStart(now).toISOString()).toBe('2025-11-01T06:00:00.000Z');
        expect(formatUtcDateTime(rollingWindowStart(now))).toBe('2025-11-01 06:00:00');
    });

    it('agrupa por mes de México y deja en cero los meses sin compras', () => {
        const series = buildPurchaseTrend(
            [
                { created_at: '2025-11-01 05:59:59', total: '999' },
                { created_at: '2025-11-01 06:00:00', total: '100.5' },
                { created_at: '2026-10-01 05:00:00', total: '20' },
                { created_at: '2026-10-01 06:30:00', total: 33.76 },
                { created_at: '2026-03-15 18:00:00', total: '10' },
                { created_at: '2026-03-20 18:00:00', total: '5.25' },
            ],
            now,
        );

        expect(series.from).toBe('2025-11');
        expect(series.to).toBe('2026-10');
        expect(series.months).toHaveLength(12);
        expect(series.months.find((point) => point.month === '2025-10')).toBeUndefined();
        expect(series.months.find((point) => point.month === '2025-11')).toMatchObject({
            total: 100.5,
            orders_count: 1,
        });
        expect(series.months.find((point) => point.month === '2026-03')).toMatchObject({
            total: 15.25,
            orders_count: 2,
        });
        expect(series.months.find((point) => point.month === '2026-09')).toMatchObject({
            total: 20,
            orders_count: 1,
        });
        expect(series.months.find((point) => point.month === '2026-10')).toMatchObject({
            total: 33.76,
            orders_count: 1,
        });
        expect(series.months.find((point) => point.month === '2026-01')).toMatchObject({
            total: 0,
            orders_count: 0,
        });
        expect(series.total).toBe(169.51);
        expect(series.orders_count).toBe(5);
    });
});
