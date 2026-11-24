import { buildSalesOrderListStats } from './sales-order-list-stats.util';

describe('buildSalesOrderListStats', () => {
  it('suma todas las filas del filtro y parte MXN de USD', () => {
    const stats = buildSalesOrderListStats([
      {
        currency: 'MXN',
        general_status: 'Creada',
        payment_status: 'Pendiente',
        cnt: '2',
        amount: '175.22',
      },
      {
        currency: 'MXN',
        general_status: 'Surtida',
        payment_status: 'Pagado',
        cnt: 10,
        amount: 24000.1,
      },
      {
        currency: 'USD',
        general_status: 'Creada',
        payment_status: 'Pendiente',
        cnt: 1,
        amount: '50.5',
      },
    ]);

    expect(stats.count).toBe(13);
    expect(stats.by_currency.MXN.count).toBe(12);
    expect(stats.by_currency.MXN.amount).toBe(24175.32);
    expect(stats.by_currency.MXN.open).toEqual({ count: 2, amount: 175.22 });
    expect(stats.by_currency.MXN.delivered).toEqual({ count: 10, amount: 24000.1 });
    expect(stats.by_currency.MXN.paid).toEqual({ count: 10, amount: 24000.1 });
    expect(stats.by_currency.MXN.pending).toEqual({ count: 2, amount: 175.22 });
    expect(stats.by_currency.USD.open).toEqual({ count: 1, amount: 50.5 });
    expect(stats.by_currency.USD.delivered).toEqual({ count: 0, amount: 0 });
    expect(stats.by_currency.USD.pending).toEqual({ count: 1, amount: 50.5 });
    expect(stats.by_currency.USD.paid).toEqual({ count: 0, amount: 0 });
  });

  it('trata moneda vacía como MXN y redondea centavos', () => {
    const stats = buildSalesOrderListStats([
      {
        currency: null,
        general_status: 'Cancelada',
        payment_status: 'Pagado',
        cnt: 1,
        amount: 10.1,
      },
      {
        currency: 'MXN',
        general_status: 'Surtida',
        payment_status: 'Pagado',
        cnt: 1,
        amount: 0.2,
      },
    ]);

    expect(stats.by_currency.MXN.count).toBe(2);
    expect(stats.by_currency.MXN.amount).toBe(10.3);
    expect(stats.by_currency.MXN.open.count).toBe(0);
    expect(stats.by_currency.MXN.delivered).toEqual({ count: 1, amount: 0.2 });
    expect(stats.by_currency.MXN.paid.amount).toBe(10.3);
    expect(stats.count).toBe(2);
  });

  it('abiertas agrupa lo no entregado y deja fuera las canceladas', () => {
    const stats = buildSalesOrderListStats([
      {
        currency: 'MXN',
        general_status: 'Creada',
        payment_status: 'Pendiente',
        cnt: 2,
        amount: 100,
      },
      {
        currency: 'MXN',
        general_status: 'En Camino',
        payment_status: 'Pagado',
        cnt: 1,
        amount: 40,
      },
      {
        currency: 'MXN',
        general_status: 'Surtida',
        payment_status: 'Pagado',
        cnt: 5,
        amount: 500,
      },
      {
        currency: 'MXN',
        general_status: 'Cancelada',
        payment_status: 'Pendiente',
        cnt: 3,
        amount: 30,
      },
    ]);

    expect(stats.count).toBe(11);
    expect(stats.by_currency.MXN.open).toEqual({ count: 3, amount: 140 });
    expect(stats.by_currency.MXN.delivered).toEqual({ count: 5, amount: 500 });
  });

  it('sin filas deja los cubos en cero', () => {
    const stats = buildSalesOrderListStats([]);
    expect(stats.count).toBe(0);
    expect(stats.by_currency.MXN.amount).toBe(0);
    expect(stats.by_currency.USD.amount).toBe(0);
  });
});
