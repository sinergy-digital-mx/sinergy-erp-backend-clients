import {
  buildSalesCostRows,
  filterSalesCostRows,
  formatSalesCustomerName,
  rateOnOrBefore,
  salesCurrencyLabel,
  summarizeSalesCostRows,
  SalesCostOrderInput,
  SalesCostSideDocumentInput,
} from './average-cost-report.util';

function order(partial: Partial<SalesCostOrderInput> & Pick<SalesCostOrderInput, 'id'>): SalesCostOrderInput {
  return {
    folio: 'TO-215704',
    created_on: '2026-10-01',
    cancelled_on: null,
    cancelled: false,
    payment_status: 'Pagado',
    is_credit: false,
    customer_name: 'MOSTRADOR',
    subtotal: 4044.44,
    discount: 0,
    tax: 323.56,
    total: 4368,
    currency: 'MXN',
    exchange_rate: null,
    invoiced: false,
    sale_cost: 2554.32,
    reversal_cost: 2554.32,
    ...partial,
  };
}

describe('reporte de ventas a costo promedio', () => {
  it('clasifica recibo de contado, factura a crédito y recibo a crédito pagado', () => {
    const rows = buildSalesCostRows({
      dateFrom: '2026-10-01',
      dateTo: '2026-10-01',
      sideDocuments: [],
      orders: [
        order({ id: 'cash' }),
        order({
          id: 'invoice',
          folio: '112684',
          customer_name: 'TRE-BRADCO',
          is_credit: true,
          payment_status: 'Pendiente',
          invoiced: true,
          subtotal: 330.2,
          tax: 26.42,
          total: 356.62,
          sale_cost: 229.51,
          reversal_cost: 0,
        }),
        order({
          id: 'credit-paid',
          folio: 'TO-1',
          is_credit: true,
          payment_status: 'Pagado',
          invoiced: false,
        }),
      ],
    });

    expect(rows.map((row) => [row.document, row.type_code, row.status_code, row.type_label, row.status_label])).toEqual([
      ['112684', 6, 2, 'Factura', 'Crédito'],
      ['TO-1', 5, 4, 'Recibo a crédito', 'Pagado'],
      ['TO-215704', 1, 1, 'Recibo', 'Contado'],
    ]);
    expect(rows[2]).toMatchObject({
      amount: 4044.44,
      discount: 0,
      tax: 323.56,
      sale_total: 4368,
      cost_total: 2554.32,
      margin_amount: 1490.12,
      margin_percent: 36.84,
    });
  });

  it('agrega la cancelación con importe positivo y total, impuesto y costo en negativo', () => {
    const rows = buildSalesCostRows({
      dateFrom: '2026-10-01',
      dateTo: '2026-10-31',
      sideDocuments: [],
      orders: [
        order({
          id: 'cancelled',
          cancelled: true,
          cancelled_on: '2026-10-01',
          invoiced: false,
        }),
      ],
    });

    expect(rows).toHaveLength(2);
    expect(rows[1]).toMatchObject({
      document: 'TO-215704',
      type_code: 3,
      status_code: 3,
      amount: 4044.44,
      discount: 0,
      tax: -323.56,
      sale_total: -4368,
      cost_total: -2554.32,
      margin_amount: -1490.12,
      margin_percent: 36.84,
      reversal: true,
    });
    expect(summarizeSalesCostRows(rows)).toMatchObject({
      document_count: 2,
      sale_total: 0,
      cost_total: 0,
      profit: 0,
    });
  });

  it('una factura cancelada usa el tipo 8 y solo entra la fecha que cae en el periodo', () => {
    const rows = buildSalesCostRows({
      dateFrom: '2026-10-02',
      dateTo: '2026-10-02',
      sideDocuments: [],
      orders: [
        order({
          id: 'late-cancel',
          created_on: '2026-10-01',
          cancelled: true,
          cancelled_on: '2026-10-02',
          invoiced: true,
        }),
      ],
    });

    expect(rows).toEqual([
      expect.objectContaining({
        date: '2026-10-02',
        type_code: 8,
        status_code: 3,
        sale_total: -4368,
      }),
    ]);
  });

  it('convierte la venta en dólares y deja la nota de crédito y el anticipo como movimientos aparte', () => {
    const note: SalesCostSideDocumentInput = {
      id: 'note-1',
      document: 'NC-9',
      customer_name: 'TRE-BRADCO',
      stamped_on: '2026-10-01',
      cancelled_on: '2026-10-03',
      cancelled: true,
      kind: 'credit_note',
      subtotal: 100,
      total: 116,
      currency: 'MXN',
      exchange_rate: null,
      sales_order_id: 'usd',
      quotation_id: null,
    };
    const advance: SalesCostSideDocumentInput = {
      id: 'adv-1',
      document: 'ANT-1',
      customer_name: 'TRE-BRADCO',
      stamped_on: '2026-10-01',
      cancelled_on: null,
      cancelled: false,
      kind: 'advance',
      subtotal: 500,
      total: 500,
      currency: 'MXN',
      exchange_rate: null,
      sales_order_id: null,
      quotation_id: 'quote-1',
    };

    const rows = buildSalesCostRows({
      dateFrom: '2026-10-01',
      dateTo: '2026-10-01',
      orders: [
        order({
          id: 'usd',
          folio: 'OV-USD',
          currency: 'USD',
          exchange_rate: 18,
          subtotal: 10,
          discount: 1,
          tax: 1.44,
          total: 10.44,
          sale_cost: 80,
          invoiced: true,
          is_credit: false,
        }),
      ],
      sideDocuments: [note, advance],
    });

    expect(rows.find((row) => row.document === 'OV-USD')).toMatchObject({
      amount: 180,
      discount: 18,
      tax: 25.92,
      sale_total: 187.92,
      cost_total: 80,
      source_currency: 'USD',
      exchange_rate: 18,
      currency: 'MXN',
      type_code: 6,
    });
    expect(salesCurrencyLabel('USD', 18)).toBe('USD 18.00');
    expect(salesCurrencyLabel('MXN', null)).toBe('MXN');
    expect(rows.find((row) => row.document === 'NC-9')).toMatchObject({
      type_code: 7,
      status_code: 5,
      amount: -100,
      tax: -16,
      sale_total: -116,
      cost_total: 0,
    });
    expect(rows.find((row) => row.document === 'ANT-1')).toMatchObject({
      type_code: 19,
      status_code: 1,
      amount: 500,
      sale_total: 500,
    });

    const reversal = buildSalesCostRows({
      dateFrom: '2026-10-03',
      dateTo: '2026-10-03',
      orders: [],
      sideDocuments: [note],
    });
    expect(reversal[0]).toMatchObject({
      type_code: 9,
      status_code: 3,
      sale_total: 116,
    });
  });

  it('busca por cliente o documento y calcula la utilidad sin el impuesto', () => {
    const rows = buildSalesCostRows({
      dateFrom: '2026-10-01',
      dateTo: '2026-10-01',
      sideDocuments: [],
      orders: [
        order({ id: 'a', folio: 'A-1', customer_name: 'JUAN GARCIA', subtotal: 100, tax: 16, total: 116, sale_cost: 40 }),
        order({ id: 'b', folio: 'B-2', customer_name: 'MARIA', subtotal: 50, tax: 0, total: 50, sale_cost: 20 }),
      ],
    });

    expect(filterSalesCostRows(rows, 'garcia').map((row) => row.document)).toEqual(['A-1']);
    expect(summarizeSalesCostRows(rows)).toMatchObject({
      document_count: 2,
      sale_total: 166,
      tax: 16,
      cost_total: 60,
      profit: 90,
      margin_percent: 60,
    });
  });

  it('deja el margen en blanco cuando el precio sin impuesto es cero', () => {
    const rows = buildSalesCostRows({
      dateFrom: '2026-10-01',
      dateTo: '2026-10-01',
      sideDocuments: [],
      orders: [
        order({
          id: 'zero-price',
          subtotal: 0,
          discount: 0,
          tax: 16,
          total: 16,
          sale_cost: 0,
        }),
      ],
    });

    expect(rows[0]).toMatchObject({
      margin_amount: 0,
      margin_percent: null,
    });
    expect(summarizeSalesCostRows(rows).margin_percent).toBeNull();
  });

  it('toma el tipo de cambio vigente el día de la venta', () => {
    expect(
      rateOnOrBefore('2026-10-08', [
        { rate_date: '2026-10-01', exchange_rate: 16.5 },
        { rate_date: '2026-10-10', exchange_rate: 17.2 },
      ]),
    ).toBe(16.5);
    expect(rateOnOrBefore('2026-09-30', [{ rate_date: '2026-10-01', exchange_rate: 16.5 }])).toBeNull();
  });

  it('arma el nombre del cliente', () => {
    expect(
      formatSalesCustomerName({
        order_fiscal: 'Jorge Ivan Galicia Cerda',
      }),
    ).toBe('JORGE IVAN GALICIA CERDA');
    expect(
      formatSalesCustomerName({
        customer_fiscal: 'VENTA DE MOSTRADOR',
        name: 'Público en General',
      }),
    ).toBe('PÚBLICO EN GENERAL');
    expect(formatSalesCustomerName({ walk_in_name: 'Mostreador' })).toBe('MOSTREADOR');
  });
});
