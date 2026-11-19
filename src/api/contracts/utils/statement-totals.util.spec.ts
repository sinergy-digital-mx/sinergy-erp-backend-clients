import { buildStatementTotals } from './statement-totals.util';

describe('buildStatementTotals', () => {
  const today = new Date(2026, 9, 23);
  const contract = { interest_rate: 10, payment_due_day: 6 };

  it('suma el pendiente vencido de enganche y mensualidades, y el interés solo de mensualidades', () => {
    const totals = buildStatementTotals({
      contract,
      today,
      downpayments: [
        { status: 'pendiente', is_overdue: true, amount_pending: 100, amount: 100 },
        { status: 'pagado', is_overdue: false, amount_pending: 0, amount: 50 },
      ],
      payments: [
        {
          status: 'pendiente',
          is_overdue: true,
          amount: 271.47,
          amount_pending: 271.47,
          due_date: '2026-10-17',
        },
        {
          status: 'parcial',
          is_overdue: true,
          amount: 200,
          amount_pending: 80,
          due_date: '2026-10-17',
          late_interest_waived: true,
        },
        {
          status: 'pendiente',
          is_overdue: false,
          amount: 200,
          amount_pending: 200,
          due_date: '2026-11-17',
        },
      ],
    });

    expect(totals.overdue_count).toBe(3);
    expect(totals.overdue_amount).toBe(451.47);
    expect(totals.late_interest_amount).toBe(27.15);
  });

  it('respeta el interés capturado a mano', () => {
    const totals = buildStatementTotals({
      contract,
      today,
      payments: [
        {
          status: 'pendiente',
          is_overdue: true,
          amount: 100,
          amount_pending: 100,
          due_date: '2026-10-01',
          late_interest_amount: 15,
        },
      ],
    });

    expect(totals.overdue_amount).toBe(100);
    expect(totals.late_interest_amount).toBe(15);
  });
});
