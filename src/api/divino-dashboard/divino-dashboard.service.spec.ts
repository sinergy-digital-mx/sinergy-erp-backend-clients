import { DivinoDashboardService } from './divino-dashboard.service';

function sale(partial: Record<string, unknown>) {
  return {
    contract_id: '1',
    contract_number: 'CONT-1',
    contract_date: '2026-11-01',
    total_price: 100,
    list_price: 100,
    currency: 'USD',
    down_payment: 0,
    down_payment_target: null,
    down_payment_financed: 0,
    payment_months: 0,
    monthly_payment: 0,
    sale_type: 'financed',
    total_area: 100,
    seller_id: null,
    seller_first_name: null,
    seller_last_name: null,
    lead_group_id: null,
    origin_name: null,
    property_code: 'L1',
    customer_name: 'Ana López',
    ...partial,
  };
}

describe('DivinoDashboardService sale mix', () => {
  const service = new DivinoDashboardService({} as never);

  it('cuenta contado por sale_type aunque antes tuviera meses de pago', () => {
    const kpis = service.computeKpisFromSales([
      sale({ sale_type: 'cash', payment_months: 1, monthly_payment: 500, down_payment_financed: 1 }),
      sale({ sale_type: 'financed', payment_months: 12, monthly_payment: 200, contract_id: '2' }),
      sale({
        sale_type: 'financed',
        down_payment_financed: 1,
        payment_months: 24,
        monthly_payment: 100,
        contract_id: '3',
      }),
    ] as never);

    expect(kpis.cash_count).toBe(1);
    expect(kpis.financed_count).toBe(2);
    expect(kpis.cash_pct).toBe(33.33);
    expect(kpis.avg_monthly_payment).toBe(150);
  });

  it('arma el detalle con etiqueta E + F o F', () => {
    const rows = service.mapSaleMix([
      sale({ sale_type: 'cash', contract_number: 'C-1' }),
      sale({
        sale_type: 'financed',
        down_payment_financed: 1,
        contract_number: 'F-1',
        contract_id: '2',
      }),
    ] as never);

    expect(rows[0].sale_label).toBe('Contado');
    expect(rows[0].monthly_payment).toBe(0);
    expect(rows[1].sale_label).toBe('Financiado (E + F)');
    expect(rows[1].down_payment_financed).toBe(true);
  });
});
