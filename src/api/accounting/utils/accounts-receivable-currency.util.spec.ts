import {
  aggregateReceivableAccounts,
  applyReceivableExchangeRate,
  filterReceivableAccounts,
  sortReceivableAccounts,
  summarizeReceivableAccounts,
  ReceivableOrderInput,
} from './accounts-receivable-currency.util';

function order(partial: Partial<ReceivableOrderInput> & Pick<ReceivableOrderInput, 'razon_social' | 'currency' | 'amount_pending'>): ReceivableOrderInput {
  return {
    fiscal_rfc: 'XAXX010101000',
    customer_id: 1,
    ...partial,
  };
}

describe('accounts receivable currency', () => {
  it('separa adeudo y órdenes por moneda', () => {
    const rows = aggregateReceivableAccounts([
      order({ razon_social: 'Maderas', currency: 'MXN', amount_pending: 100, customer_id: 1 }),
      order({ razon_social: 'Maderas', currency: 'USD', amount_pending: 20, customer_id: 2 }),
      order({ razon_social: 'Maderas', currency: null, amount_pending: 5, customer_id: 1 }),
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0].pending_order_count_mxn).toBe(2);
    expect(rows[0].amount_pending_mxn).toBe(105);
    expect(rows[0].pending_order_count_usd).toBe(1);
    expect(rows[0].amount_pending_usd).toBe(20);
    expect(rows[0].customer_count).toBe(2);
    expect(rows[0].pending_order_count).toBe(3);
  });

  it('filtra cada vista y convierte el total con el tipo de cambio del sistema', () => {
    const rows = aggregateReceivableAccounts([
      order({ razon_social: 'Pesos', currency: 'MXN', amount_pending: 10 }),
      order({ razon_social: 'Dolares', currency: 'USD', amount_pending: 80 }),
      order({ razon_social: 'Ambos', currency: 'MXN', amount_pending: 30 }),
      order({ razon_social: 'Ambos', currency: 'usd', amount_pending: 5 }),
    ]);

    expect(filterReceivableAccounts(rows, 'mxn').map((row) => row.razon_social).sort()).toEqual(['Ambos', 'Pesos']);
    expect(sortReceivableAccounts(filterReceivableAccounts(rows, 'all'), 'all').map((row) => row.razon_social)).toEqual([
      'Ambos',
      'Pesos',
      'Dolares',
    ]);

    const rated = applyReceivableExchangeRate(rows, 'all', 16.8);
    const byName = Object.fromEntries(rated.map((row) => [row.razon_social, row.amount_pending_total_mxn]));
    expect(byName).toEqual({ Pesos: 10, Dolares: 1344, Ambos: 114 });

    const summary = summarizeReceivableAccounts(rows, 'all', '16.8000', '2026-10-14');
    expect(summary.exchange_rate).toBe(16.8);
    expect(summary.total_accounts).toBe(3);
    expect(summary.total_amount_pending_mxn).toBe(40);
    expect(summary.total_amount_pending_usd).toBe(85);
    expect(summary.total_amount_pending_total_mxn).toBe(1468);

    const withoutRate = summarizeReceivableAccounts(rows, 'all', null, null);
    expect(withoutRate.total_amount_pending_total_mxn).toBeNull();
  });
});
