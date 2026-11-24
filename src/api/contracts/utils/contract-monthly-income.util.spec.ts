import { buildMonthlyIncomeAnalysis } from './contract-monthly-income.util';

function payment(partial: Record<string, unknown>) {
  return {
    contract_id: 'c1',
    contract_number: 'C-1',
    customer_name: 'Ana López',
    currency: 'USD',
    due_date: '2026-11-05',
    amount: 1000,
    amount_paid: 0,
    status: 'pendiente',
    ...partial,
  };
}

describe('buildMonthlyIncomeAnalysis', () => {
  it('separa lo del mes de lo que sigue abierto de meses anteriores', () => {
    const rows = [
      ...Array.from({ length: 5 }, (_, index) =>
        payment({
          contract_id: `paid-${index}`,
          contract_number: `P-${index}`,
          amount_paid: 1000,
          status: 'pagado',
        }),
      ),
      ...Array.from({ length: 4 }, (_, index) =>
        payment({
          contract_id: `open-${index}`,
          contract_number: `A-${index}`,
        }),
      ),
      payment({
        contract_id: 'open-extra',
        contract_number: 'A-9',
        due_date: '2026-11-05',
      }),
      payment({
        contract_id: 'open-extra',
        contract_number: 'A-9',
        due_date: '2026-10-05',
        status: 'pendiente',
      }),
    ];

    const result = buildMonthlyIncomeAnalysis({
      year: 2026,
      month: 11,
      payments: rows as never,
    });

    expect(result.month_label).toBe('Noviembre 2026');
    expect(result.currencies).toEqual([
      expect.objectContaining({
        currency: 'USD',
        expected: 10000,
        collected: 5000,
        pending: 5000,
        contracts: 10,
        paid_contracts: 5,
        unpaid_contracts: 5,
        prior_amount: 1000,
        prior_installments: 1,
        prior_contracts: 1,
      }),
    ]);

    const withPrior = result.contracts.find((row) => row.contract_id === 'open-extra');
    expect(withPrior?.month_expected).toBe(1000);
    expect(withPrior?.prior_amount).toBe(1000);
    expect(withPrior?.prior_oldest).toBe('2026-10-05');
  });

  it('un abono parcial no cuenta el mes como cubierto y no mete cuotas canceladas', () => {
    const result = buildMonthlyIncomeAnalysis({
      year: 2026,
      month: 11,
      payments: [
        payment({ amount: 800, amount_paid: 300, status: 'parcial' }),
        payment({ contract_id: 'x', status: 'cancelado', amount: 5000 }),
        payment({ contract_id: 'future', due_date: '2026-12-05', amount: 900 }),
      ] as never,
    });

    expect(result.currencies[0]).toEqual(
      expect.objectContaining({
        expected: 800,
        collected: 300,
        pending: 500,
        partial_contracts: 1,
        contracts: 1,
      }),
    );
  });

  it('no suma al esperado los financiados que no tienen cuota generada', () => {
    const result = buildMonthlyIncomeAnalysis({
      year: 2026,
      month: 11,
      payments: [],
      unscheduled: [
        {
          contract_id: 'u1',
          contract_number: 'U-1',
          customer_name: 'Luis',
          currency: 'USD',
          monthly_payment: 1500,
        },
      ],
    });

    expect(result.currencies).toEqual([]);
    expect(result.unscheduled.count).toBe(1);
    expect(result.unscheduled.contracts[0].monthly_payment).toBe(1500);
  });
});
