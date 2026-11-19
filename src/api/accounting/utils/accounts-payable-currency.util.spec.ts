import {
  aggregatePayableVendors,
  applyPayableExchangeRate,
  filterPayableVendors,
  isWithinPayablePeriod,
  normalizePayableCurrency,
  payableCalendarDay,
  sortPayableVendors,
  summarizePayableVendors,
  summarizePayableWithRate,
  mergeVendorCredits,
  PayableOrderInput,
} from './accounts-payable-currency.util';

function order(partial: Partial<PayableOrderInput> & Pick<PayableOrderInput, 'vendor_id' | 'payment_currency' | 'amount_pending'>): PayableOrderInput {
  return {
    vendor_name: 'Maderas',
    razon_social: 'Maderas del Norte',
    company_name: null,
    credit_limit: null,
    amount_paid: 0,
    ...partial,
  };
}

describe('accounts payable currency', () => {
  it('trata moneda vacía como pesos y usd sin importar mayúsculas', () => {
    expect(normalizePayableCurrency(null)).toBe('MXN');
    expect(normalizePayableCurrency(' usd ')).toBe('USD');
  });

  it('separa adeudo, OC y progreso por moneda', () => {
    const rows = aggregatePayableVendors([
      order({
        vendor_id: 'v1',
        payment_currency: 'MXN',
        amount_pending: 50,
        amount_paid: 50,
        credit_limit: 200,
      }),
      order({
        vendor_id: 'v1',
        payment_currency: 'MXN',
        amount_pending: 25,
        amount_paid: 0,
        credit_limit: 200,
      }),
      order({
        vendor_id: 'v1',
        payment_currency: 'USD',
        amount_pending: 40,
        amount_paid: 60,
        credit_limit: 200,
      }),
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0].pending_order_count_mxn).toBe(2);
    expect(rows[0].amount_pending_mxn).toBe(75);
    expect(rows[0].progress_percentage_mxn).toBe(37.5);
    expect(rows[0].pending_order_count_usd).toBe(1);
    expect(rows[0].amount_pending_usd).toBe(40);
    expect(rows[0].progress_percentage_usd).toBe(40);
    expect(rows[0].pending_order_count).toBe(3);
  });

  it('filtra y ordena cada vista', () => {
    const rows = aggregatePayableVendors([
      order({ vendor_id: 'pesos', vendor_name: 'Pesos', payment_currency: 'MXN', amount_pending: 10 }),
      order({ vendor_id: 'dolares', vendor_name: 'Dolares', payment_currency: 'USD', amount_pending: 80 }),
      order({ vendor_id: 'ambos', vendor_name: 'Ambos', payment_currency: 'MXN', amount_pending: 30 }),
      order({ vendor_id: 'ambos', vendor_name: 'Ambos', payment_currency: 'USD', amount_pending: 5 }),
    ]);

    expect(filterPayableVendors(rows, 'mxn').map((row) => row.vendor_id).sort()).toEqual(['ambos', 'pesos']);
    expect(filterPayableVendors(rows, 'usd').map((row) => row.vendor_id).sort()).toEqual(['ambos', 'dolares']);
    expect(sortPayableVendors(filterPayableVendors(rows, 'all'), 'all').map((row) => row.vendor_id)).toEqual([
      'ambos',
      'pesos',
      'dolares',
    ]);

    const summary = summarizePayableVendors(filterPayableVendors(rows, 'usd'), 'usd');
    expect(summary.total_vendors).toBe(2);
    expect(summary.total_amount_pending_usd).toBe(85);
    expect(summary.total_pending_orders_usd).toBe(2);
    expect(summary.total_amount_pending).toBe(85);
  });

  it('convierte el total a pesos con el tipo de cambio del día', () => {
    const rows = aggregatePayableVendors([
      order({ vendor_id: 'pesos', vendor_name: 'Pesos', payment_currency: 'MXN', amount_pending: 10 }),
      order({ vendor_id: 'dolares', vendor_name: 'Dolares', payment_currency: 'USD', amount_pending: 80 }),
      order({ vendor_id: 'ambos', vendor_name: 'Ambos', payment_currency: 'MXN', amount_pending: 30 }),
      order({ vendor_id: 'ambos', vendor_name: 'Ambos', payment_currency: 'USD', amount_pending: 5 }),
    ]);

    const rated = applyPayableExchangeRate(rows, 'all', '16.8000');
    const byVendor = Object.fromEntries(rated.map((row) => [row.vendor_id, row.amount_pending_total_mxn]));
    expect(byVendor).toEqual({ pesos: 10, dolares: 1344, ambos: 114 });

    const summary = summarizePayableWithRate(rows, 'all', 16.8, '2026-10-14');
    expect(summary.exchange_rate).toBe(16.8);
    expect(summary.exchange_rate_date).toBe('2026-10-14');
    expect(summary.total_amount_pending_total_mxn).toBe(1468);

    const usdOnly = summarizePayableWithRate(filterPayableVendors(rows, 'usd'), 'usd', 16.8, '2026-10-14');
    expect(usdOnly.total_amount_pending_total_mxn).toBe(1428);

    const withoutRate = summarizePayableWithRate(rows, 'all', null, null);
    expect(withoutRate.exchange_rate).toBeNull();
    expect(withoutRate.total_amount_pending_total_mxn).toBeNull();
    expect(applyPayableExchangeRate(rows, 'mxn', null).find((row) => row.vendor_id === 'pesos')?.amount_pending_total_mxn).toBe(10);
  });

  it('incluye proveedores solo con saldo a favor', () => {
    const rows = mergeVendorCredits(
      aggregatePayableVendors([
        order({ vendor_id: 'con-deuda', vendor_name: 'Con deuda', payment_currency: 'MXN', amount_pending: 10 }),
      ]),
      [
        {
          vendor_id: 'solo-favor',
          vendor_name: 'Solo favor',
          razon_social: null,
          company_name: null,
          credit_limit: null,
          credit_balance_mxn: 250,
          credit_balance_usd: 0,
        },
        {
          vendor_id: 'con-deuda',
          vendor_name: 'Con deuda',
          razon_social: null,
          company_name: null,
          credit_limit: null,
          credit_balance_mxn: 40,
          credit_balance_usd: 5,
        },
      ],
    );

    expect(filterPayableVendors(rows, 'mxn').map((row) => row.vendor_id).sort()).toEqual([
      'con-deuda',
      'solo-favor',
    ]);
    const debt = rows.find((row) => row.vendor_id === 'con-deuda');
    expect(debt?.credit_balance_mxn).toBe(40);
    expect(debt?.credit_balance_usd).toBe(5);
    expect(summarizePayableVendors(rows, 'all').total_credit_balance_mxn).toBe(290);
  });

  it('deja la orden dentro del mes o rango por su día en Tijuana', () => {
    expect(payableCalendarDay('2026-11-04')).toBe('2026-11-04');
    expect(isWithinPayablePeriod('2026-11-04T18:30:00.000Z', '2026-11-01', '2026-11-04')).toBe(true);
    expect(isWithinPayablePeriod('2026-10-31T18:30:00.000Z', '2026-11-01', '2026-11-04')).toBe(false);
    expect(isWithinPayablePeriod(null, '2026-11-01', '2026-11-04')).toBe(false);
  });
});
